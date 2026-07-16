import StateCityService from '../services/state-city.service.js';
import { ApiError } from '../lib/ApiError.js';

// ==================== STATE CONTROLLERS ====================

export const getAllStates = async (req, res, next) => {
  try {
    const result = await StateCityService.getAllStates(req.query);

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'States fetched successfully',
    });
  } catch (error) {
    console.error('Get all states error:', error);
    next(error);
  }
};

// ==================== CITY CONTROLLERS ====================

export const getCitiesByState = async (req, res, next) => {
  try {
    const { stateCode } = req.params;

    if (!stateCode) {
      throw ApiError.badRequest('State code is required');
    }

    const result = await StateCityService.getCitiesByState(
      stateCode,
      req.query,
    );

    res.status(200).json({
      success: true,
      data: result.data,
      state: result.state,
      message: `Cities for state ${result.state.name} fetched successfully`,
    });
  } catch (error) {
    console.error('Get cities by state error:', error);
    next(error);
  }
};
