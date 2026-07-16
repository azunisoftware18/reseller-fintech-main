import axios from 'axios';
import PancardPluginInterface from './bulkpe.interface.js';
import { ApiError } from '../../lib/ApiError.js';

class BulkpePancardPlugin extends PancardPluginInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: this.config.bulkpeBaseUrl,
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * PAN Verification (No OTP required)
   */
  async verifyPan({ panNumber }) {
    try {
      const res = await this.client.post('/pan/verify', {
        pan_number: panNumber,
      });

      if (!res.data.success) {
        throw ApiError.badRequest(
          res.data.message || 'PAN verification failed',
        );
      }

      const data = res.data.data;

      return {
        panNumber: data.pan_number,
        name: data.name,
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        dob: data.dob,
        category: data.category, // Individual / Company / Firm
        isValid: data.valid,
      };
    } catch (err) {
      throw ApiError.internal(
        err.response?.data?.message || 'PAN verification error',
      );
    }
  }
}

export default BulkpePancardPlugin;
