import masterPageSectionService from '../services/MasterPageSection.service.js';

export const addMasterPageSection = async (req, res) => {
  const sections = await masterPageSectionService.addSection(
    req.params.masterPageId,
    req.body,
  );
  res.status(201).json(sections);
};

export const getMasterPageSections = async (req, res) => {
  const sections = await masterPageSectionService.findByPage(
    req.params.masterPageId,
  );
  res.json(sections);
};

export const updateMasterPageSection = async (req, res) => {
  const section = await masterPageSectionService.updateSection(
    req.params.id,
    req.body.sectionData,
  );
  res.json(section);
};

export const moveMasterPageSection = async (req, res) => {
  const sections = await masterPageSectionService.moveSection(
    req.params.id,
    req.body.newOrder,
  );
  res.json(sections);
};

export const deleteMasterPageSection = async (req, res) => {
  await masterPageSectionService.deleteSection(req.params.id);
  res.status(204).end();
};
