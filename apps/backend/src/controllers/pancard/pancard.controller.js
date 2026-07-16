import PancardService from '../../services/pancard/pancard.service.js';

export const verifyPan = async (req, res) => {
  const result = await PancardService.verifyPan({
    payload: req.body,
    actor: req.user,
  });

  res.status(201).json(result);
};
