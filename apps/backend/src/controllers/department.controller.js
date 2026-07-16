import departmentService from '../services/department.service.js';

export const createDepartment = async (req, res) => {
  const data = await departmentService.create(req.body, req.user);
  res.status(201).json(data);
};

export const findAllDepartments = async (req, res) => {
  const data = await departmentService.findAll(req.user);
  res.json(data);
};

export const findDepartment = async (req, res) => {
  const data = await departmentService.findOne(req.params.id, req.user);
  res.json(data);
};

export const updateDepartment = async (req, res) => {
  const data = await departmentService.update(
    req.params.id,
    req.body,
    req.user,
  );
  res.json(data);
};

export const deleteDepartment = async (req, res) => {
  await departmentService.delete(req.params.id, req.user);
  res.json({ success: true });
};

export const assignDepartmentPermissions = async (req, res) => {
  await departmentService.assignPermissions(
    req.params.id,
    req.body.permissionIds,
    req.user,
  );
  res.json({ success: true });
};
