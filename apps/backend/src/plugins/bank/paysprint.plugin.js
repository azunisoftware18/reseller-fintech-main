import axios from 'axios';
import { ApiError } from '../../lib/ApiError.js';

class PaysprintVerificationPlugin {
  constructor(config) {
    if (!config.token || !config.authorisedKey || !config.userAgent) {
      throw new Error(
        'Paysprint Plugin: Token, UserAgent and Authorised Key are required',
      );
    }

    this.client = axios.create({
      baseURL:
        config.baseUrl || 'https://uat.paysprint.in/sprintverify-uat/api/v1',
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        Token: config.token,
        Authorisedkey: config.authorisedKey,
        'User-Agent': config.userAgent,
      },
    });
  }

  async verify({ accountNumber, ifscCode, refId }) {
    const payload = {
      refid: refId || `VERIFY${Date.now()}`,
      account_number: accountNumber,
      ifsc_code: ifscCode,
    };

    try {
      const response = await this.client.post(
        '/verification/penny_drop_v2',
        payload,
      );

      return this._normalizeResponse(response.data);
    } catch (error) {
      if (error.response?.data) {
        return this._normalizeErrorResponse(error.response.data);
      }
      throw error;
    }
  }

  _normalizeResponse(data) {
    const { statuscode, status, message, data: responseData } = data;

    // Check if verification was successful
    if (statuscode === 200 && status === true) {
      return {
        status: true,
        message:
          responseData.nwrespmessg || message || 'Verification successful',
        beneficiaryName: responseData.c_name || '',
        providerReference:
          responseData.txnrefno || responseData.reference_id?.toString(),
        referenceId: responseData.reference_id,
        transactionRefNo: responseData.txnrefno,
        responseCode: responseData.nwrespcode,
        networkTransactionRefId: responseData.nwtxnrefid,
        requestDetails: responseData.reqdtls,
        raw: data,
      };
    }

    // Handle failed verification
    return {
      status: false,
      message: message || 'Verification failed',
      beneficiaryName: '',
      providerReference:
        responseData?.txnrefno || responseData?.reference_id?.toString(),
      referenceId: responseData?.reference_id,
      responseCode: responseData?.nwrespcode || statuscode,
      raw: data,
    };
  }

  _normalizeErrorResponse(data) {
    const { statuscode, status, message } = data;

    throw ApiError.badRequest(
      `Verification failed: ${message || 'Unknown error'} (Code: ${statuscode})`,
    );
  }
}

export default PaysprintVerificationPlugin;
