import axios from 'axios';
import BankPluginInterface from './bank.interface.js';
import { ApiError } from '../../lib/ApiError.js';

class InstantpayBankPlugin extends BankPluginInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: this.config.baseUrl, // https://api.instantpay.in
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-Ipay-Auth-Code': this.config.authCode, // 1
        'X-Ipay-Client-Id': this.config.clientId,
        'X-Ipay-Client-Secret': this.config.clientSecret,
        'X-Ipay-Endpoint-Ip': this.config.endpointIp, // ip
        'X-Ipay-Outlet-Id': this.config.outletId, // ip
      },
    });
  }

  async fetchBanks() {
    try {
      const res = await this.client.post('/fi/remit/out/domestic/v2/banks');

      const data = res.data;

      if (!data) {
        throw ApiError.internal('Empty response from InstantPay banks API');
      }

      if (data.statuscode !== 'TXN') {
        throw ApiError.internal(
          data.status || 'InstantPay bank list request failed',
        );
      }

      return data.data || [];
    } catch (error) {
      throw ApiError.internal(
        error?.response?.data?.status ||
          error?.response?.data?.message ||
          error.message ||
          'Failed to fetch bank list',
      );
    }
  }
}

export default InstantpayBankPlugin;

// const config = {
//   baseUrl: 'https://api.instantpay.in',
//   authCode: process.env.IPAY_AUTH_CODE,
//   clientId: process.env.IPAY_CLIENT_ID,
//   clientSecret: process.env.IPAY_CLIENT_SECRET,
//   endpointIp: process.env.IPAY_ENDPOINT_IP,
//   outletId: process.env.IPAY_OUTLET_ID,
// };
