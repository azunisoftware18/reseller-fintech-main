import {
  ProviderService,
  ServiceProviderMappingService,
  ServiceService,
} from '../services/service.service.js';

// CREATE SERVICE
const createService = async (req, res) => {
  const service = await ServiceService.create(req.body);
  res.status(201).json(service);
};

// GET ALL SERVICES (PAGINATED)
const getServices = async (req, res) => {
  const services = await ServiceService.getAll(req.query);
  res.json(services);
};

// UPDATE SERVICE
const updateService = async (req, res) => {
  const updated = await ServiceService.update(req.params.id, req.body);
  res.json(updated);
};

// CREATE PROVIDER
const createProvider = async (req, res) => {
  const provider = await ProviderService.create(req.body);
  res.status(201).json(provider);
};

// GET ALL PROVIDERS (PAGINATED)
const getProviders = async (req, res) => {
  const providers = await ProviderService.getAll(req.query);
  res.json(providers);
};

// UPDATE PROVIDER
const updateProvider = async (req, res) => {
  const updated = await ProviderService.update(req.params.id, req.body);
  res.json(updated);
};

// CREATE MAPPING
const createMapping = async (req, res) => {
  const mapping = await ServiceProviderMappingService.create(req.body);
  res.status(201).json(mapping);
};

// GET ALL MAPPINGS (PAGINATED)
const getMappings = async (req, res) => {
  const data = await ServiceProviderMappingService.getAll(req.query);
  res.json({ mappings: data });
};

// GET ALLOWED MAPPINGS (FORM-READY, PERMISSION-BASED)
const getAllowedMappings = async (req, res) => {
  const data = await ServiceProviderMappingService.getAllowedMappings(
    req.user,
    req.query,
  );

  res.json({
    success: true,
    mappings: data.data,
  });
};

// UPDATE MAPPING
const updateMapping = async (req, res) => {
  const updated = await ServiceProviderMappingService.update(
    req.params.id,
    req.body,
  );
  res.json(updated);
};

// HARD DELETE MAPPING
const hardDeleteMapping = async (req, res) => {
  const result = await ServiceProviderMappingService.hardDelete(req.params.id);
  res.json(result);
};

export {
  createService,
  getServices,
  updateService,
  createProvider,
  getProviders,
  updateProvider,
  createMapping,
  getMappings,
  updateMapping,
  hardDeleteMapping,
  getAllowedMappings,
};
