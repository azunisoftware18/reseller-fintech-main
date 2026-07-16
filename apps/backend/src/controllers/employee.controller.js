import { EmployeeService } from '../services/employee.service.js';

export const createEmployee = async (req, res, next) => {
  const employee = await EmployeeService.create(req.body, req.user);
  res.status(201).json(employee);
};

export const updateEmployee = async (req, res, next) => {
  const employee = await EmployeeService.update(
    req.params.id,
    req.body,
    req.user,
    req.file,
  );
  res.json(employee);
};

export const findEmployee = async (req, res, next) => {
  const employee = await EmployeeService.findOne(req.params.id, req.user);
  res.json(employee);
};

export const findAllEmployees = async (req, res, next) => {
  const employees = await EmployeeService.findAll(req.query, req.user);
  res.json(employees);
};

export const deleteEmployee = async (req, res, next) => {
  const employee = await EmployeeService.delete(req.params.id, req.user);
  res.json(employee);
};

export const assignEmployeePermissions = async (req, res) => {
  await EmployeeService.assignPermissions(
    req.params.id,
    req.body.permissions,
    req.user,
  );
  res.json({ success: true });
};
