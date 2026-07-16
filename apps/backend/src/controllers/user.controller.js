import userService from '../services/user.service.js';

export const createUser = async (req, res) => {
  const data = await userService.create(req.body, req.user);
  res.status(201).json(data);
};

export const findAllUsers = async (req, res) => {
  const data = await userService.findAll(req.query, req.user);
  res.json(data);
};

export const findUser = async (req, res) => {
  const data = await userService.findOne(req.params.id, req.user);
  res.json(data);
};

export const updateUser = async (req, res) => {
  const result = await userService.update(
    req.params.id,
    req.body,
    req.user,
    req.file,
  );
  res.json(result);
};

export const getAllDescendants = async (req, res) => {
  const data = await userService.getAllDescendants(req.params.id, req.user);
  res.json(data);
};

export const assignUserPermissions = async (req, res) => {
  await userService.assignPermissions(
    req.params.id,
    req.body.permissions,
    req.user,
  );
  res.json({ success: true });
};
