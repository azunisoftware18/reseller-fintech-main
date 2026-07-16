export function permissionChecker(perms, resource, action) {
  if (!perms) return false;

  // 🔥 SUPER ADMIN EXPLICIT
  if (perms.isSuperAdmin) return true;

  const all = [
    ...(Array.isArray(perms.role) ? perms.role : []),
    ...(Array.isArray(perms.user) ? perms.user : []),
  ];

  // ❌ DENY overrides ALLOW
  const denied = all.some(
    (p) =>
      p.resource === resource &&
      p.action === action &&
      (p.effect ?? "ALLOW") === "DENY",
  );
  if (denied) return false;

  // ✅ ALLOW check
  return all.some(
    (p) =>
      p.resource === resource &&
      p.action === action &&
      (p.effect ?? "ALLOW") === "ALLOW",
  );
}
