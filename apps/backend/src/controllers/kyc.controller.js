import { promises as fs } from 'fs';
import s3Service from '../lib/S3Service.js';
import KycService from '../services/kyc.service.js';

const cleanupLocalFiles = async (files) => {
  if (!files || files.length === 0) return;

  await Promise.all(
    files.map(async (file) => {
      try {
        if (file?.path) {
          await fs.unlink(file.path);
          console.log(`[KYC Cleanup] Deleted local temp file: ${file.path}`);
        }
      } catch (err) {
        // ENOENT = file already deleted ya exist nahi karta, ignore karo
        if (err.code !== 'ENOENT') {
          console.warn(
            `[KYC Cleanup] Failed to delete ${file.path}:`,
            err.message,
          );
        }
      }
    }),
  );
};

const buildFinalDocuments = async (files, documentsMeta = []) => {
  const uploadedDocs = [];
  const documentsMetaArray = documentsMeta || [];

  const docsNeedingUpload = documentsMetaArray.filter((d) => !d.documentUrl);

  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let docMeta = documentsMetaArray.find(
        (d) => d.documentType === file.documentType,
      );

      if (!docMeta && i < docsNeedingUpload.length) {
        docMeta = docsNeedingUpload[i];
      }

      if (!docMeta) {
        docMeta = documentsMetaArray[i];
      }

      if (!docMeta) {
        console.warn(`[KYC] No metadata for file: ${file.originalname}`);
        continue;
      }

      const s3Result = await s3Service.upload(file.path, 'kyc');

      uploadedDocs.push({
        documentType: docMeta.documentType,
        documentNumber: docMeta.documentNumber,
        documentUrl: s3Result.url,
        documentKey: s3Result.key,
      });
    }
  }

  const finalDocs = [...uploadedDocs];

  documentsMetaArray.forEach((metaDoc) => {
    const wasUploaded = uploadedDocs.find(
      (u) => u.documentType === metaDoc.documentType,
    );

    if (!wasUploaded && metaDoc.documentUrl) {
      finalDocs.push({
        documentType: metaDoc.documentType,
        documentNumber: metaDoc.documentNumber,
        documentUrl: metaDoc.documentUrl,
        documentKey: metaDoc.documentKey,
      });
    }
  });

  return finalDocs;
};

const deleteOldImages = async (oldDocuments, newDocuments) => {
  const deletedKeys = [];

  for (const oldDoc of oldDocuments || []) {
    const newDoc = newDocuments.find(
      (d) => d.documentType === oldDoc.documentType,
    );

    if (newDoc && newDoc.documentKey) {
      let oldKey = oldDoc.documentKey;

      if (!oldKey && oldDoc.documentUrl) {
        oldKey = s3Service.extractKeyFromUrl(oldDoc.documentUrl);
      }

      if (oldKey) {
        try {
          await s3Service.deleteByKey(oldKey);
          deletedKeys.push(oldKey);
        } catch (err) {
          console.warn(
            `[KYC] Failed to delete old S3 key ${oldKey}:`,
            err.message,
          );
        }
      }
    }
  }

  if (deletedKeys.length > 0) {
    console.log(`[KYC] Deleted old images from S3:`, deletedKeys);
  }

  return deletedKeys;
};

const validateRequiredDocs = (documents) => {
  const requiredTypes = [
    'PAN',
    'AADHAAR_FRONT',
    'AADHAAR_BACK',
    'ADDRESS_PROOF',
    'USER_PHOTO',
  ];
  const presentTypes = documents.map((d) => d.documentType);
  const missing = requiredTypes.filter((t) => !presentTypes.includes(t));

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required documents: ${missing.join(', ')}`,
    };
  }
  return { valid: true };
};

export const submitKyc = async (req, res) => {
  const { body, files = [], user: actor } = req;

  try {
    const finalDocuments = await buildFinalDocuments(files, body.documents);

    const validation = validateRequiredDocs(finalDocuments);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    const result = await KycService.submitKyc(
      {
        userId: body.userId,
        personalInfo: body.personalInfo,
        address: body.address,
        documents: finalDocuments,
      },
      actor,
    );

    res
      .status(201)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[KYC Submit] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  } finally {
    // 🗑️ Chahe success ho ya koi bhi error, local temp files hamesha delete karo
    await cleanupLocalFiles(files);
  }
};

export const resubmitKyc = async (req, res) => {
  const { body, files = [], user: actor } = req;

  try {
    const existingKyc = await KycService.getKycStatus(body.userId, actor);
    const oldDocuments = existingKyc?.documents || [];

    const finalDocuments = await buildFinalDocuments(files, body.documents);

    const validation = validateRequiredDocs(finalDocuments);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    await deleteOldImages(oldDocuments, finalDocuments);

    const result = await KycService.resubmitKyc(
      {
        userId: body.userId,
        kycId: body.kycId,
        personalInfo: body.personalInfo,
        address: body.address,
        documents: finalDocuments,
      },
      actor,
    );

    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[KYC Resubmit] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  } finally {
    // 🗑️ Resubmit fail hone pe bhi local files cleanup ho jayegi
    await cleanupLocalFiles(files);
  }
};

export const approveKyc = async (req, res) => {
  const result = await KycService.approveKyc(req.body, req.user);
  res
    .status(200)
    .json({ success: true, data: result, message: result.message });
};

export const rejectKyc = async (req, res) => {
  const result = await KycService.rejectKyc(req.body, req.user);
  res
    .status(200)
    .json({ success: true, data: result, message: result.message });
};

export const getKycStatus = async (req, res) => {
  const result = await KycService.getKycStatus(req.params.userId, req.user);
  res.status(200).json({ success: true, data: result });
};

export const getKycsForApprover = async (req, res) => {
  const result = await KycService.getKycsForApprover(req.user, req.query);
  res.status(200).json({ success: true, data: result.data, meta: result.meta });
};
