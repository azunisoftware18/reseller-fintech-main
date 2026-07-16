import roleService from '../services/role.service.js';

export const createRole = async (req, res) => {
  const role = await roleService.create(req.body, req.user);
  res.status(201).json(role);
};

export const findAllRoles = async (req, res) => {
  const roles = await roleService.findAll(req.user);
  res.json(roles);
};

export const findRole = async (req, res) => {
  const role = await roleService.findOne(req.params.id, req.user);
  res.json(role);
};

export const updateRole = async (req, res) => {
  const role = await roleService.update(req.params.id, req.body, req.user);
  res.json(role);
};

export const deleteRole = async (req, res) => {
  await roleService.delete(req.params.id, req.user);
  res.status(204).end();
};

export const assignPermissions = async (req, res) => {
  await roleService.assignPermissions(
    req.params.id,
    req.body.permissionIds,
    req.user,
  );
  res.json({ success: true });
};
