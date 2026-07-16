export function canSetCommission({ actorRoleLevel, targetRoleLevel }) {
  // ❌ Only Level 0,1,2 allowed to set commission
  if (actorRoleLevel > 2) return false;

  // AZZUNIQUE → only Reseller
  if (actorRoleLevel === 0) {
    return targetRoleLevel === 1;
  }

  // Reseller → only White Label
  if (actorRoleLevel === 1) {
    return targetRoleLevel === 2;
  }

  // White Label → State Head, MD, Distributor, Retailer
  if (actorRoleLevel === 2) {
    return [3, 4, 5, 6].includes(targetRoleLevel);
  }

  return false;
}
