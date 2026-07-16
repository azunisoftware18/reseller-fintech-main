import CommissionSettingService from '../services/commission-setting.service.js';
import { ApiError } from '../lib/ApiError.js';

export const createCommission = async (req, res, next) => {
  try {
    // ✅ Validate request body
    if (!req.body || typeof req.body !== 'object') {
      throw ApiError.badRequest('Request body is required');
    }

    // ✅ Validate required fields
    const requiredFields = [
      'mode',
      'scope',
      'serviceProviderMappingId',
      'type',
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw ApiError.badRequest(`Missing required field: ${field}`);
      }
    }

    // ✅ Validate value based on mode and slab support
    if (!req.body.supportsSlab) {
      if (req.body.value === undefined || req.body.value === null) {
        throw ApiError.badRequest(
          'Value is required when slab support is disabled',
        );
      }
      if (req.body.value <= 0) {
        throw ApiError.badRequest('Value must be greater than 0');
      }
    }

    // ✅ Validate slabs if supportsSlab is true
    if (req.body.supportsSlab) {
      if (!req.body.slabs || req.body.slabs.length === 0) {
        throw ApiError.badRequest(
          'At least one slab is required when slab support is enabled',
        );
      }
    }

    // ✅ Validate actor with proper checks
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    // ✅ Build actor object with all required fields
    const actor = {
      id: req.user.id,
      tenantId: req.user.tenantId,
      roleId: req.user.roleId,
      type: req.user.type || 'USER',
      roleCode: req.user.roleCode,
      roleLevel: req.user.roleLevel,
      isTenantOwner: req.user.isTenantOwner || false,
      ownedTenantId: req.user.ownedTenantId || null,
    };

    const result = await CommissionSettingService.createRule(req.body, actor);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Commission rule created successfully',
    });
  } catch (error) {
    console.error('Create commission error:', error);
    next(error);
  }
};

export const updateCommission = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Validate id
    if (!id) {
      throw ApiError.badRequest('Commission rule ID is required');
    }

    // ✅ Validate request body
    if (!req.body || typeof req.body !== 'object') {
      throw ApiError.badRequest('Request body is required');
    }

    // ✅ Validate actor
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }

    // ✅ Build actor object
    const actor = {
      id: req.user.id,
      tenantId: req.user.tenantId,
      roleId: req.user.roleId,
      type: req.user.type || 'USER',
      roleCode: req.user.roleCode,
      roleLevel: req.user.roleLevel,
      isTenantOwner: req.user.isTenantOwner || false,
      ownedTenantId: req.user.ownedTenantId || null,
    };

    const result = await CommissionSettingService.updateRule(
      id,
      req.body,
      actor,
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'Commission rule updated successfully',
    });
  } catch (error) {
    console.error('Update commission error:', error);
    next(error);
  }
};

export const getAllCommissionList = async (req, res, next) => {
  try {
    // ✅ Validate actor
    if (!req.user || !req.user.tenantId) {
      throw ApiError.unauthorized('User not authenticated');
    }

    // ✅ Build actor object
    const actor = {
      id: req.user.id,
      tenantId: req.user.tenantId,
      roleId: req.user.roleId,
      type: req.user.type || 'USER',
      roleCode: req.user.roleCode,
      roleLevel: req.user.roleLevel,
      isTenantOwner: req.user.isTenantOwner || false,
      ownedTenantId: req.user.ownedTenantId || null,
    };

    const result = await CommissionSettingService.getCommissionList(
      actor,
      req.query,
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: 'Fetched successfully',
    });
  } catch (error) {
    console.error('Get commission list error:', error);
    next(error);
  }
};

// ✅ Resolve commission for a user
export const resolveCommission = async (req, res, next) => {
  try {
    const { tenantId, userId, roleId, serviceProviderMappingId, amount } =
      req.body;

    // ✅ Validate required fields
    if (!tenantId) {
      throw ApiError.badRequest('tenantId is required');
    }
    if (!serviceProviderMappingId) {
      throw ApiError.badRequest('serviceProviderMappingId is required');
    }
    if (!amount) {
      throw ApiError.badRequest('amount is required');
    }

    const result = await CommissionSettingService.resolveForUser({
      tenantId,
      userId,
      roleId,
      serviceProviderMappingId,
      amount,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Commission resolved successfully',
    });
  } catch (error) {
    console.error('Resolve commission error:', error);
    next(error);
  }
};

// ✅ Get single commission rule by ID
export const getCommissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Commission rule ID is required');
    }

    if (!req.user || !req.user.tenantId) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const actor = {
      id: req.user.id,
      tenantId: req.user.tenantId,
      roleId: req.user.roleId,
      isTenantOwner: req.user.isTenantOwner || false,
    };

    const result = await CommissionSettingService.getCommissionById(id, actor);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Fetched successfully',
    });
  } catch (error) {
    console.error('Get commission by id error:', error);
    next(error);
  }
};

// ✅ Delete commission rule
export const deleteCommission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Commission rule ID is required');
    }

    if (!req.user || !req.user.id) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const actor = {
      id: req.user.id,
      tenantId: req.user.tenantId,
      roleId: req.user.roleId,
      isTenantOwner: req.user.isTenantOwner || false,
    };

    const result = await CommissionSettingService.deleteRule(id, actor);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Commission rule deleted successfully',
    });
  } catch (error) {
    console.error('Delete commission error:', error);
    next(error);
  }
};
