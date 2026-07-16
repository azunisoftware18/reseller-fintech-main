export const RECHARGE_SERVICE_CODE = 'RECHARGE';
export const AADHAAR_SERVICE_CODE = 'AADHAAR';
export const PANCARD_SERVICE_CODE = 'PANCARD';
export const FUNDREQUEST_SERVICE_CODE = 'FUND_REQUEST';

export const RECHARGE_FEATURES = {
  INITIATE_RECHARGE: 'INITIATE_RECHARGE',
  FETCH_PLANS: 'FETCH_PLANS',
  FETCH_OFFERS: 'FETCH_OFFERS',
};

export const ALLOWED_SERVICES_ROLES = [
  'STATE_HEAD',
  'MASTER_DISTRIBUTOR',
  'DISTRIBUTOR',
  'RETAILER',
];

export const ROLE_HIERARCHY = {
  AZZUNIQUE: { level: 0, canApprove: ['RESELLER'] },
  RESELLER: { level: 1, canApprove: ['WHITE_LABEL'] },
  WHITE_LABEL: {
    level: 2,
    canApprove: ['STATE_HEAD', 'MASTER_DISTRIBUTOR', 'DISTRIBUTOR', 'RETAILER'],
  },
  STATE_HEAD: { level: 3, canApprove: [] },
  MASTER_DISTRIBUTOR: { level: 4, canApprove: [] },
  DISTRIBUTOR: { level: 5, canApprove: [] },
  RETAILER: { level: 6, canApprove: [] },
};
