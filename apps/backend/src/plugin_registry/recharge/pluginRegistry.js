import { ApiError } from '../../lib/ApiError.js';
import MplanPlugin from '../../plugins/recharge/mplan.plugin.js';
import RechargeExchangePlugin from '../../plugins/recharge/rechargeExchange.plugin.js';

// Central plugin resolver
export function getRechargePlugin(providerCode, config) {
  switch (providerCode) {
    case 'MPLAN':
      return new MplanPlugin(config);

    case 'RECHARGE_EXCHANGE':
      return new RechargeExchangePlugin(config);

    default:
      throw ApiError.internal('Unknown recharge provider');
  }
}
