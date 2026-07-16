import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import crypto from 'crypto';
import envConfig from '../config/config.js';

// ================= S3 CLIENT =================
const s3 = new S3Client({
  region: envConfig.s3.region,
  credentials: {
    accessKeyId: envConfig.s3.accessKey,
    secretAccessKey: envConfig.s3.secretKey,
  },
});

// ================= CONSTANTS =================
const MAIN_FOLDER = 'fintech';

// 🔐 Allowed categories (SECURITY)
const ALLOWED_CATEGORIES = [
  'employee-profile',
  'user-profile',
  'kyc',
  'documents',
  'logos',
  'favicons',
];

// ================= SERVICE =================
class S3Service {
  constructor() {
    if (!envConfig.s3.bucket) {
      throw new Error('S3 bucket not configured');
    }
    this.bucket = envConfig.s3.bucket;
  }

  // ================= UPLOAD =================
  async upload(localFilePath, category) {
    if (!localFilePath) {
      throw new Error('File path is required');
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new Error(`Invalid upload category: ${category}`);
    }

    const fileStream = fs.createReadStream(localFilePath);
    const ext = path.extname(localFilePath);
    const mimeType = mime.lookup(localFilePath) || 'application/octet-stream';

    const uniqueName = `${Date.now()}_${crypto.randomUUID()}${ext}`;
    const s3Key = `${MAIN_FOLDER}/${category}/${uniqueName}`;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: s3Key,
          Body: fileStream,
          ContentType: mimeType,
          ACL: 'private', // 🔐 fintech-safe
        }),
      );

      return {
        key: s3Key, // 🔥 store this in DB
        url: `https://${this.bucket}.s3.${envConfig.s3.region}.amazonaws.com/${s3Key}`,
      };
    } finally {
      // cleanup local file (always)
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }

  // ================= UPLOAD BUFFER (BASE64/API IMAGE) =================
  async uploadBuffer(buffer, category, extension = 'png', contentType = null) {
    if (!buffer) {
      throw new Error('Buffer is required');
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new Error(`Invalid upload category: ${category}`);
    }

    const uniqueName = `${Date.now()}_${crypto.randomUUID()}.${extension}`;
    const s3Key = `${MAIN_FOLDER}/${category}/${uniqueName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType || `image/${extension}`,
        ACL: 'private',
      }),
    );

    return {
      key: s3Key,
      url: `https://${this.bucket}.s3.${envConfig.s3.region}.amazonaws.com/${s3Key}`,
    };
  }

  // ================= DELETE =================
  async deleteByKey(s3Key) {
    if (!s3Key) {
      throw new Error('S3 key is required');
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      }),
    );

    return true;
  }

  buildS3Url(key) {
    if (!key) return null;

    return `https://${envConfig.s3.bucket}.s3.${envConfig.s3.region}.amazonaws.com/${key}`;
  }

  // ================= HELPERS =================
  extractKeyFromUrl(fileUrl) {
    if (!fileUrl) return null;
    return fileUrl.split('.amazonaws.com/')[1] || null;
  }
}

// ================= EXPORT =================
export const s3Service = new S3Service();
export default s3Service;
