import permissionService from '../services/permission.service.js';

export const findAllPermissions = async (req, res) => {
  const data = await permissionService.findAll(req.user);
  res.json(data);
};
