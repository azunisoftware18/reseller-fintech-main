import AadhaarPluginInterface from './bulkpe.interface.js';

class ManualAadhaarPlugin extends AadhaarPluginInterface {
  /**
   * Manual flow me OTP nahi hota
   */
  async sendOtp() {
    return {
      referenceId: null,
      raw: {
        status: true,
        message: 'Manual KYC does not require OTP',
      },
    };
  }

  /**
   * Manual verify = form data accept karna
   */
  async verifyOtp({ aadhaarNumber, formData, files }) {
    if (!aadhaarNumber) {
      throw new Error('Aadhaar number missing');
    }

    const masked = `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;

    // Example file metadata extraction
    const profilePhotoFile = files.profilePhoto[0];
    const aadhaarPdfFile = files.aadhaarPdf[0];

    return {
      data: {
        status: 'PENDING',
        aadhaarData: {
          name: formData.fullName || formData.name,
          dob: formData.dob,
          address: formData.address,
          gender: formData.gender,
          maskedAadhaar: masked,
        },
        documents: {
          profilePhoto: {
            originalName: profilePhotoFile.originalname,
            mimeType: profilePhotoFile.mimetype,
            size: profilePhotoFile.size,
          },
          aadhaarPdfFile: {
            originalName: aadhaarPdfFile.originalname,
            mimeType: aadhaarPdfFile.mimetype,
            size: aadhaarPdfFile.size,
          },
        },
      },
      raw: {
        source: 'MANUAL',
        submittedAt: new Date(),
      },
    };
  }
}

export default ManualAadhaarPlugin;
