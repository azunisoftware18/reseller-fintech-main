import axios from 'axios';
import RechargeExchangePluginInterface from './rechargeExchange.interface.js';
import { ApiError } from '../../lib/ApiError.js';

class RechargeExchangePlugin extends RechargeExchangePluginInterface {
  constructor(config) {
    super(config);

    this.txClient = axios.create({
      baseURL: this.config.rechargeExchangePluginUrl,
      timeout: 15000,
    });

    this.statusClient = axios.create({
      baseURL: this.config.rechargeExchangeStatusPluginUrl,
      timeout: 15000,
    });
  }

  async recharge({ opcode, number, amount, transid }) {
    const { userId, token } = this.config;

    const res = await this.txClient.get('/Transaction', {
      params: {
        userid: userId,
        token,
        opcode,
        number,
        amount,
        transid,
      },
    });

    return res.data;
  }

  async checkStatus({ transid }) {
    const { userId, token } = this.config;

    const res = await this.statusClient.get('/TransactionStatus', {
      params: {
        userid: userId,
        token,
        transid,
      },
    });

    return res.data;
  }

  async fetchBalance() {
    const { userId, token } = this.config;

    const res = await this.statusClient.get('/BalanceNew', {
      params: {
        userid: userId,
        token,
      },
    });

    if (res.data.status !== 'SUCCESS') {
      throw ApiError.badRequest('Unable to fetch provider balance');
    }

    return {
      balance: Number(res.data.balance),
    };
  }

  async complain({ referenceId, remark }) {
    const { userId, token } = this.config;

    const res = await this.txClient.get('/Complain', {
      params: {
        userid: userId,
        token,
        referenceid: referenceId,
        remark,
      },
    });

    return res.data;
  }

  async fetchOperators() {
    const res = await this.txClient.get('/OperatorList');
    return res.data;
  }
}

export default RechargeExchangePlugin;
