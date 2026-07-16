import { randomUUID } from 'crypto';
import { db } from '../database/core/core-db.js';
import {
  commissionSettingTable,
  commissionSettingSlabTable,
  ServiceTable,
  roleTable,
  usersTable,
  ServiceProviderMappingTable,
  tenantsTable,
  ProviderTable,
  ProviderSlabTable,
  employeesTable,
} from '../models/core/index.js';
import { and, eq, desc, count, sql, inArray, lt } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import { canSetCommission } from '../guard/commission.guard.js';
import { rupeesToPaise, paiseToRupees } from '../lib/lib.js';

class CommissionSettingService {
  // ==================== EMPLOYEE HELPERS ====================

  static async validateEmployeeActor(actor) {
    if (actor.type !== 'EMPLOYEE') return;

    const [employee] = await db
      .select({
        employeeStatus: employeesTable.employeeStatus,
        tenantId: employeesTable.tenantId,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, actor.id))
      .limit(1);

    if (!employee) throw ApiError.unauthorized('Employee not found');
    if (employee.employeeStatus !== 'ACTIVE')
      throw ApiError.forbidden('Employee not active');

    const [tenant] = await db
      .select({ userType: tenantsTable.userType })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, employee.tenantId))
      .limit(1);

    const allowed = ['AZZUNIQUE', 'RESELLER', 'WHITELABEL'];
    if (!allowed.includes(tenant?.userType)) {
      throw ApiError.forbidden('Employee operations not allowed');
    }

    return employee.tenantId;
  }

  static async getActorTenantId(actor) {
    if (actor.type === 'EMPLOYEE') {
      return await this.validateEmployeeActor(actor);
    }
    return actor?.tenantId;
  }

  // ==================== HELPER METHODS ====================

  static async getServiceDisplayName(tx, serviceProviderMappingId) {
    if (!serviceProviderMappingId) return 'Unknown Service';

    const [mapping] = await tx
      .select({
        serviceId: ServiceProviderMappingTable.ServiceId,
        providerId: ServiceProviderMappingTable.ProviderId,
      })
      .from(ServiceProviderMappingTable)
      .where(eq(ServiceProviderMappingTable.id, serviceProviderMappingId))
      .limit(1);

    if (!mapping?.serviceId) return 'Unknown Service';

    const [service] = await tx
      .select({ name: ServiceTable.name })
      .from(ServiceTable)
      .where(eq(ServiceTable.id, mapping.serviceId))
      .limit(1);

    let providerName = '';
    if (mapping.providerId) {
      const [provider] = await tx
        .select({
          providerName: ProviderTable.providerName,
          code: ProviderTable.code,
        })
        .from(ProviderTable)
        .where(eq(ProviderTable.id, mapping.providerId))
        .limit(1);
      if (provider) providerName = provider.providerName || provider.code || '';
    }

    if (service?.name && providerName)
      return `${service.name} - ${providerName}`;
    if (service?.name) return service.name;
    if (providerName) return providerName;
    return 'Unknown Service';
  }

  static async getActorRoleLevel(tx, actor) {
    if (actor.type === 'EMPLOYEE') {
      const [employee] = await tx
        .select({ tenantId: employeesTable.tenantId })
        .from(employeesTable)
        .where(eq(employeesTable.id, actor.id))
        .limit(1);

      if (!employee?.tenantId) return null;

      const [tenant] = await tx
        .select({ userType: tenantsTable.userType })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, employee.tenantId))
        .limit(1);

      if (!tenant?.userType) return null;

      const [ownerRole] = await tx
        .select({ roleLevel: roleTable.roleLevel })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(
          and(
            eq(usersTable.tenantId, employee.tenantId),
            eq(roleTable.roleCode, tenant.userType),
          ),
        )
        .limit(1);

      return ownerRole?.roleLevel ?? null;
    }

    if (!actor?.roleId) return null;
    const [role] = await tx
      .select({ roleLevel: roleTable.roleLevel })
      .from(roleTable)
      .where(eq(roleTable.id, actor.roleId))
      .limit(1);
    return role?.roleLevel ?? null;
  }

  static async getTargetRoleLevelFromPayload(tx, payload) {
    if (!payload) return null;
    if (payload.scope === 'USER' && payload.targetUserId) {
      const [targetUser] = await tx
        .select({ roleId: usersTable.roleId })
        .from(usersTable)
        .where(eq(usersTable.id, payload.targetUserId))
        .limit(1);
      if (!targetUser?.roleId) return null;
      const [targetRole] = await tx
        .select({ roleLevel: roleTable.roleLevel })
        .from(roleTable)
        .where(eq(roleTable.id, targetUser.roleId))
        .limit(1);
      return targetRole?.roleLevel || null;
    }
    if (payload.scope === 'ROLE' && payload.roleId) {
      const [targetRole] = await tx
        .select({ roleLevel: roleTable.roleLevel })
        .from(roleTable)
        .where(eq(roleTable.id, payload.roleId))
        .limit(1);
      return targetRole?.roleLevel || null;
    }
    return null;
  }

  static async getTargetRoleLevelFromRule(tx, rule) {
    if (!rule) return null;
    if (rule.scope === 'USER' && rule.targetUserId) {
      const [targetUser] = await tx
        .select({ roleId: usersTable.roleId })
        .from(usersTable)
        .where(eq(usersTable.id, rule.targetUserId))
        .limit(1);
      if (targetUser?.roleId) {
        const [targetRole] = await tx
          .select({ roleLevel: roleTable.roleLevel })
          .from(roleTable)
          .where(eq(roleTable.id, targetUser.roleId))
          .limit(1);
        return targetRole?.roleLevel || null;
      }
    }
    if (rule.scope === 'ROLE' && rule.roleId) {
      const [targetRole] = await tx
        .select({ roleLevel: roleTable.roleLevel })
        .from(roleTable)
        .where(eq(roleTable.id, rule.roleId))
        .limit(1);
      return targetRole?.roleLevel || null;
    }
    return null;
  }

  static validateValueRange(value, type, mode, context = '') {
    if (type === 'PERCENTAGE') {
      if (value < 0 || value > 100) {
        throw ApiError.badRequest(
          `${context}Percentage value must be between 0 and 100, got: ${value}`,
        );
      }
      if (mode === 'COMMISSION' && value <= 0) {
        throw ApiError.badRequest(
          `${context}Commission percentage must be greater than 0, got: ${value}`,
        );
      }
      if (mode === 'SURCHARGE' && value < 0) {
        throw ApiError.badRequest(
          `${context}Surcharge percentage cannot be negative, got: ${value}`,
        );
      }
    } else if (type === 'FLAT') {
      if (mode === 'COMMISSION' && value <= 0) {
        throw ApiError.badRequest(
          `${context}Flat commission amount must be greater than 0, got: ₹${value}`,
        );
      }
      if (mode === 'SURCHARGE' && value < 0) {
        throw ApiError.badRequest(
          `${context}Flat surcharge amount cannot be negative, got: ₹${value}`,
        );
      }
    } else {
      throw ApiError.badRequest(
        `${context}Invalid type: ${type}. Must be PERCENTAGE or FLAT`,
      );
    }
  }

  static async validateHierarchyRule(
    tx,
    mode,
    currentValue,
    parentValue,
    type,
    context = '',
  ) {
    const valueSymbol = type === 'FLAT' ? '₹' : '%';

    if (mode === 'COMMISSION') {
      if (currentValue > parentValue) {
        throw ApiError.badRequest(
          `${context}Commission validation failed: ${currentValue}${valueSymbol} cannot be greater than parent (${parentValue}${valueSymbol}). Child must receive less than or equal to parent.`,
        );
      }
    } else if (mode === 'SURCHARGE') {
      if (currentValue < parentValue) {
        throw ApiError.badRequest(
          `${context}Surcharge validation failed: ${currentValue}${valueSymbol} cannot be less than parent (${parentValue}${valueSymbol}). Child must charge more than or equal to parent.`,
        );
      }
    }
  }

  static async getParentRoleChain(tx, roleId, tenantId) {
    const chain = [];
    let currentRoleId = roleId;
    const visited = new Set();

    while (currentRoleId && !visited.has(currentRoleId)) {
      visited.add(currentRoleId);

      const [currentRole] = await tx
        .select({
          roleLevel: roleTable.roleLevel,
          roleName: roleTable.roleName,
        })
        .from(roleTable)
        .where(eq(roleTable.id, currentRoleId))
        .limit(1);

      if (!currentRole) break;

      const [parentRole] = await tx
        .select({
          id: roleTable.id,
          roleLevel: roleTable.roleLevel,
          roleName: roleTable.roleName,
        })
        .from(roleTable)
        .where(
          and(
            eq(roleTable.tenantId, tenantId),
            lt(roleTable.roleLevel, currentRole.roleLevel),
          ),
        )
        .orderBy(desc(roleTable.roleLevel))
        .limit(1);

      if (parentRole) {
        chain.push(parentRole);
        currentRoleId = parentRole.id;
      } else {
        break;
      }
    }

    return chain;
  }

  static async validateRoleHierarchyChain(
    tx,
    mode,
    value,
    type,
    tenantId,
    serviceProviderMappingId,
    roleId,
    context = '',
  ) {
    const parentChain = await this.getParentRoleChain(tx, roleId, tenantId);
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );
    const [currentRole] = await tx
      .select({ roleName: roleTable.roleName, roleLevel: roleTable.roleLevel })
      .from(roleTable)
      .where(eq(roleTable.id, roleId))
      .limit(1);

    if (!currentRole) throw ApiError.badRequest('Invalid role');

    for (const parentRole of parentChain) {
      const [parentRule] = await tx
        .select({
          value: commissionSettingTable.value,
          type: commissionSettingTable.type,
          supportsSlab: commissionSettingTable.supportsSlab,
        })
        .from(commissionSettingTable)
        .where(
          and(
            eq(commissionSettingTable.tenantId, tenantId),
            eq(
              commissionSettingTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(commissionSettingTable.mode, mode),
            eq(commissionSettingTable.scope, 'ROLE'),
            eq(commissionSettingTable.roleId, parentRole.id),
            eq(commissionSettingTable.isActive, true),
          ),
        )
        .limit(1);

      if (parentRule?.value) {
        const parentValue = paiseToRupees(parentRule.value);

        if (type !== parentRule.type) {
          throw ApiError.badRequest(
            `${context}Type mismatch: ${currentRole.roleName} uses ${type} but ${parentRole.roleName} uses ${parentRule.type}. Both must use same type (FLAT or PERCENTAGE) for service "${serviceDisplayName}".`,
          );
        }

        try {
          await this.validateHierarchyRule(tx, mode, value, parentValue, type);
        } catch (error) {
          throw ApiError.badRequest(
            `${context}${error.message}. Hierarchy: ${currentRole.roleName} (${value}${type === 'FLAT' ? '₹' : '%'}) → ${parentRole.roleName} (${parentValue}${parentRule.type === 'FLAT' ? '₹' : '%'}). Service: ${serviceDisplayName}`,
          );
        }
      }
    }

    if (
      parentChain.length === 0 ||
      !(await this.hasAnyParentRule(
        tx,
        parentChain,
        tenantId,
        serviceProviderMappingId,
        mode,
      ))
    ) {
      await this.checkTenantLevelRule(
        tx,
        mode,
        value,
        type,
        tenantId,
        serviceProviderMappingId,
        currentRole.roleName,
      );
    }
  }

  static async hasAnyParentRule(
    tx,
    parentChain,
    tenantId,
    serviceProviderMappingId,
    mode,
  ) {
    for (const parent of parentChain) {
      const [rule] = await tx
        .select({ id: commissionSettingTable.id })
        .from(commissionSettingTable)
        .where(
          and(
            eq(commissionSettingTable.tenantId, tenantId),
            eq(
              commissionSettingTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(commissionSettingTable.mode, mode),
            eq(commissionSettingTable.scope, 'ROLE'),
            eq(commissionSettingTable.roleId, parent.id),
            eq(commissionSettingTable.isActive, true),
          ),
        )
        .limit(1);
      if (rule) return true;
    }
    return false;
  }

  static async checkTenantLevelRule(
    tx,
    mode,
    value,
    type,
    tenantId,
    serviceProviderMappingId,
    roleName,
  ) {
    const [tenantRule] = await tx
      .select({
        value: commissionSettingTable.value,
        type: commissionSettingTable.type,
      })
      .from(commissionSettingTable)
      .where(
        and(
          eq(commissionSettingTable.tenantId, tenantId),
          eq(
            commissionSettingTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(commissionSettingTable.mode, mode),
          eq(commissionSettingTable.scope, null),
          eq(commissionSettingTable.isActive, true),
        ),
      )
      .limit(1);

    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    if (tenantRule?.value) {
      const tenantValue = paiseToRupees(tenantRule.value);

      if (type !== tenantRule.type) {
        throw ApiError.badRequest(
          `Type mismatch: ${roleName} uses ${type} but tenant-level uses ${tenantRule.type}. Both must use same type for service "${serviceDisplayName}".`,
        );
      }

      try {
        await this.validateHierarchyRule(tx, mode, value, tenantValue, type);
      } catch (error) {
        throw ApiError.badRequest(
          `${error.message}. Hierarchy: ${roleName} (${value}${type === 'FLAT' ? '₹' : '%'}) → Tenant Level (${tenantValue}${tenantRule.type === 'FLAT' ? '₹' : '%'}). Service: ${serviceDisplayName}`,
        );
      }
    } else {
      await this.validateTenantHierarchy(
        tx,
        mode,
        value,
        type,
        tenantId,
        serviceProviderMappingId,
        roleName,
      );
    }
  }

  static async validateTenantHierarchy(
    tx,
    mode,
    value,
    type,
    tenantId,
    serviceProviderMappingId,
    contextRoleName = '',
  ) {
    let currentTenantId = tenantId;
    const visited = new Set();
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    while (currentTenantId && !visited.has(currentTenantId)) {
      visited.add(currentTenantId);

      const [currentTenant] = await tx
        .select({ parentTenantId: tenantsTable.parentTenantId })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, currentTenantId))
        .limit(1);

      const parentTenantId = currentTenant?.parentTenantId;

      if (!parentTenantId) {
        await this.validateTopLevelAgainstProviderCost(
          tx,
          mode,
          value,
          type,
          serviceProviderMappingId,
          contextRoleName,
        );
        return;
      }

      const [parentRule] = await tx
        .select({
          id: commissionSettingTable.id,
          value: commissionSettingTable.value,
          type: commissionSettingTable.type,
          supportsSlab: commissionSettingTable.supportsSlab,
        })
        .from(commissionSettingTable)
        .where(
          and(
            eq(commissionSettingTable.tenantId, parentTenantId),
            eq(
              commissionSettingTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(commissionSettingTable.mode, mode),
            eq(commissionSettingTable.isActive, true),
          ),
        )
        .limit(1);

      if (parentRule) {
        let parentValue;
        let parentSlabInfo = '';

        if (parentRule.supportsSlab) {
          const [maxSlab] = await tx
            .select({ value: commissionSettingSlabTable.value })
            .from(commissionSettingSlabTable)
            .where(
              and(
                eq(
                  commissionSettingSlabTable.commissionSettingId,
                  parentRule.id,
                ),
                eq(commissionSettingSlabTable.isActive, true),
              ),
            )
            .orderBy(desc(commissionSettingSlabTable.maxAmount))
            .limit(1);
          parentValue = maxSlab
            ? paiseToRupees(maxSlab.value)
            : paiseToRupees(parentRule.value);
        } else {
          parentValue = paiseToRupees(parentRule.value);
        }

        if (type !== parentRule.type) {
          throw ApiError.badRequest(
            `Type mismatch: Current uses ${type} but parent tenant uses ${parentRule.type} for service "${serviceDisplayName}".`,
          );
        }

        try {
          await this.validateHierarchyRule(tx, mode, value, parentValue, type);
        } catch (error) {
          throw ApiError.badRequest(
            `${error.message}. Tenant Hierarchy: Current (${value}${type === 'FLAT' ? '₹' : '%'}) → Parent Tenant (${parentValue}${parentRule.type === 'FLAT' ? '₹' : '%'}). Service: ${serviceDisplayName}`,
          );
        }
        return;
      }

      currentTenantId = parentTenantId;
    }

    await this.validateTopLevelAgainstProviderCost(
      tx,
      mode,
      value,
      type,
      serviceProviderMappingId,
      contextRoleName,
    );
  }

  static async getProviderCostFromSlab(
    tx,
    serviceProviderMappingId,
    amountOrSlab,
  ) {
    let minAmount, maxAmount;

    if (typeof amountOrSlab === 'number') {
      const amountInPaise = rupeesToPaise(amountOrSlab);
      minAmount = BigInt(amountInPaise);
      maxAmount = BigInt(amountInPaise);
    } else if (amountOrSlab && typeof amountOrSlab === 'object') {
      const minInRupees = Number(amountOrSlab.minAmount);
      const maxInRupees = Number(amountOrSlab.maxAmount);

      minAmount = BigInt(rupeesToPaise(minInRupees));
      maxAmount = BigInt(rupeesToPaise(maxInRupees));
    } else {
      return null;
    }

    const providerSlabs = await tx
      .select({
        providerCost: ProviderSlabTable.providerCost,
        minAmount: ProviderSlabTable.minAmount,
        maxAmount: ProviderSlabTable.maxAmount,
      })
      .from(ProviderSlabTable)
      .where(
        and(
          eq(
            ProviderSlabTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(ProviderSlabTable.isActive, true),
          sql`${ProviderSlabTable.minAmount} <= ${maxAmount}`,
          sql`${ProviderSlabTable.maxAmount} >= ${minAmount}`,
        ),
      )
      .orderBy(
        sql`CASE 
        WHEN ${ProviderSlabTable.minAmount} <= ${minAmount} 
         AND ${ProviderSlabTable.maxAmount} >= ${maxAmount} 
        THEN 0 
        ELSE 1 
      END`,
        ProviderSlabTable.minAmount,
      );

    if (providerSlabs.length > 0) {
      const providerSlab = providerSlabs[0];
      return {
        providerCost: paiseToRupees(providerSlab.providerCost),
        minAmount: paiseToRupees(providerSlab.minAmount),
        maxAmount: paiseToRupees(providerSlab.maxAmount),
      };
    }

    return null;
  }

  static async validateTopLevelAgainstProviderCost(
    tx,
    mode,
    value,
    type,
    serviceProviderMappingId,
    contextRoleName = '',
    slabRange = null,
  ) {
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    let providerCost;
    let slabInfo = '';

    if (slabRange) {
      const providerSlab = await this.getProviderCostFromSlab(
        tx,
        serviceProviderMappingId,
        slabRange,
      );

      if (!providerSlab) {
        const [anyProviderSlab] = await tx
          .select({ count: sql`COUNT(*)` })
          .from(ProviderSlabTable)
          .where(
            and(
              eq(
                ProviderSlabTable.serviceProviderMappingId,
                serviceProviderMappingId,
              ),
              eq(ProviderSlabTable.isActive, true),
            ),
          );

        if (anyProviderSlab?.count > 0) {
          throw ApiError.badRequest(
            `No provider cost found for slab range ₹${slabRange.minAmount}-₹${slabRange.maxAmount}. Please ensure provider slabs cover this range. Service: ${serviceDisplayName}`,
          );
        }

        const [mapping] = await tx
          .select({ providerCost: ServiceProviderMappingTable.providerCost })
          .from(ServiceProviderMappingTable)
          .where(eq(ServiceProviderMappingTable.id, serviceProviderMappingId))
          .limit(1);

        if (!mapping?.providerCost) return;
        providerCost = paiseToRupees(mapping.providerCost);
      } else {
        providerCost = providerSlab.providerCost;
        slabInfo = ` (Provider slab: ₹${providerSlab.minAmount}-₹${providerSlab.maxAmount})`;
      }
    } else {
      const providerSlabs = await tx
        .select({
          providerCost: ProviderSlabTable.providerCost,
        })
        .from(ProviderSlabTable)
        .where(
          and(
            eq(
              ProviderSlabTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(ProviderSlabTable.isActive, true),
          ),
        );

      if (providerSlabs.length > 0) {
        const costs = providerSlabs.map((s) => paiseToRupees(s.providerCost));
        if (mode === 'SURCHARGE') {
          providerCost = Math.min(...costs);
        } else {
          providerCost = Math.max(...costs);
        }
      } else {
        const [mapping] = await tx
          .select({ providerCost: ServiceProviderMappingTable.providerCost })
          .from(ServiceProviderMappingTable)
          .where(eq(ServiceProviderMappingTable.id, serviceProviderMappingId))
          .limit(1);

        if (!mapping?.providerCost) return;
        providerCost = paiseToRupees(mapping.providerCost);
      }
    }

    if (mode === 'SURCHARGE') {
      if (type === 'FLAT' && value < providerCost) {
        throw ApiError.badRequest(
          `Surcharge validation failed: Top-level ${contextRoleName || 'surcharge'} (₹${value}) cannot be less than provider cost (₹${providerCost})${slabInfo}. Service: ${serviceDisplayName}. Rule: Surcharge must be ≥ Provider Cost at Azzunique level.`,
        );
      }
    } else if (mode === 'COMMISSION') {
      if (type === 'FLAT' && value > providerCost) {
        throw ApiError.badRequest(
          `Commission validation failed: Top-level ${contextRoleName || 'commission'} (₹${value}) cannot exceed provider cost (₹${providerCost})${slabInfo}. Service: ${serviceDisplayName}. Rule: Commission must be ≤ Provider Cost at Azzunique level.`,
        );
      }
    }
  }

  static async validateNonSlabHierarchy(
    tx,
    payload,
    tenantId,
    isUpdate = false,
  ) {
    const { mode, value, type, serviceProviderMappingId, scope, roleId } =
      payload;

    if (!mode || !type || payload.supportsSlab) return;

    if (scope === 'ROLE' && roleId) {
      await this.validateRoleHierarchyChain(
        tx,
        mode,
        value,
        type,
        tenantId,
        serviceProviderMappingId,
        roleId,
        '',
      );
      return;
    }

    if (scope === 'USER' && payload.targetUserId) {
      const [targetUser] = await tx
        .select({ roleId: usersTable.roleId })
        .from(usersTable)
        .where(eq(usersTable.id, payload.targetUserId))
        .limit(1);

      if (targetUser?.roleId) {
        await this.validateRoleHierarchyChain(
          tx,
          mode,
          value,
          type,
          tenantId,
          serviceProviderMappingId,
          targetUser.roleId,
          'User ',
        );
        return;
      }
    }

    await this.validateTenantHierarchy(
      tx,
      mode,
      value,
      type,
      tenantId,
      serviceProviderMappingId,
      'Tenant',
    );
  }

  static async validateSlabHierarchyRules(tx, commissionSettingId, mode) {
    const slabs = await this.fetchSlabs(tx, commissionSettingId);
    if (slabs.length === 0) return;

    const [setting] = await tx
      .select({
        tenantId: commissionSettingTable.tenantId,
        serviceProviderMappingId:
          commissionSettingTable.serviceProviderMappingId,
        type: commissionSettingTable.type,
        scope: commissionSettingTable.scope,
        roleId: commissionSettingTable.roleId,
      })
      .from(commissionSettingTable)
      .where(eq(commissionSettingTable.id, commissionSettingId))
      .limit(1);

    if (!setting) return;

    for (const slab of slabs) {
      await this.validateSingleSlabAgainstHierarchy(
        tx,
        slab,
        mode,
        setting.tenantId,
        setting.serviceProviderMappingId,
        setting.type,
        commissionSettingId,
        setting.scope,
        setting.roleId,
      );
    }
  }

  static async validateSingleSlabAgainstHierarchy(
    tx,
    slab,
    mode,
    tenantId,
    serviceProviderMappingId,
    type,
    commissionSettingId,
    scope = null,
    roleId = null,
  ) {
    const slabValue = Number(slab.value);
    const slabMinRupees = slab.minAmount;
    const slabMaxRupees = slab.maxAmount;

    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    if (scope === 'ROLE' && roleId) {
      const parentChain = await this.getParentRoleChain(tx, roleId, tenantId);
      const [currentRole] = await tx
        .select({ roleName: roleTable.roleName })
        .from(roleTable)
        .where(eq(roleTable.id, roleId))
        .limit(1);

      if (!currentRole) throw ApiError.badRequest('Invalid role');

      for (const parentRole of parentChain) {
        const [parentRule] = await tx
          .select({
            id: commissionSettingTable.id,
            value: commissionSettingTable.value,
            type: commissionSettingTable.type,
            supportsSlab: commissionSettingTable.supportsSlab,
          })
          .from(commissionSettingTable)
          .where(
            and(
              eq(commissionSettingTable.tenantId, tenantId),
              eq(
                commissionSettingTable.serviceProviderMappingId,
                serviceProviderMappingId,
              ),
              eq(commissionSettingTable.mode, mode),
              eq(commissionSettingTable.scope, 'ROLE'),
              eq(commissionSettingTable.roleId, parentRole.id),
              eq(commissionSettingTable.isActive, true),
            ),
          )
          .limit(1);

        if (parentRule) {
          let parentValue;
          let parentSlabInfo = '';

          if (parentRule.supportsSlab) {
            const slabMinPaise = rupeesToPaise(slab.minAmount);
            const slabMaxPaise = rupeesToPaise(slab.maxAmount);

            const [matchingSlab] = await tx
              .select({
                value: commissionSettingSlabTable.value,
                minAmount: commissionSettingSlabTable.minAmount,
                maxAmount: commissionSettingSlabTable.maxAmount,
              })
              .from(commissionSettingSlabTable)
              .where(
                and(
                  eq(
                    commissionSettingSlabTable.commissionSettingId,
                    parentRule.id,
                  ),
                  eq(commissionSettingSlabTable.isActive, true),
                  sql`${commissionSettingSlabTable.minAmount} <= ${slabMinPaise}`,
                  sql`${commissionSettingSlabTable.maxAmount} >= ${slabMaxPaise}`,
                ),
              )
              .limit(1);

            if (matchingSlab) {
              parentValue = paiseToRupees(matchingSlab.value);
              const parentMinRupees = paiseToRupees(matchingSlab.minAmount);
              const parentMaxRupees = paiseToRupees(matchingSlab.maxAmount);
              parentSlabInfo = ` (slab ₹${parentMinRupees}-₹${parentMaxRupees})`;
            } else {
              parentValue = paiseToRupees(parentRule.value);
            }
          } else {
            parentValue = paiseToRupees(parentRule.value);
          }

          if (type !== parentRule.type) {
            throw ApiError.badRequest(
              `Slab type mismatch: ${currentRole.roleName} uses ${type} but ${parentRole.roleName} uses ${parentRule.type} for service "${serviceDisplayName}".`,
            );
          }

          try {
            await this.validateHierarchyRule(
              tx,
              mode,
              slabValue,
              parentValue,
              type,
            );
          } catch (error) {
            const valueSymbol = type === 'FLAT' ? '₹' : '%';
            const parentValueSymbol = parentRule.type === 'FLAT' ? '₹' : '%';

            throw ApiError.badRequest(
              `Slab ₹${slabMinRupees}-₹${slabMaxRupees}: ${error.message}. Hierarchy: ${currentRole.roleName} (${slabValue}${valueSymbol}) → ${parentRole.roleName} (${parentValue}${parentValueSymbol})${parentSlabInfo}. Service: ${serviceDisplayName}`,
            );
          }
          return;
        }
      }

      await this.validateSlabAgainstTenantLevel(
        tx,
        slab,
        mode,
        type,
        tenantId,
        serviceProviderMappingId,
        currentRole.roleName,
      );
      return;
    }

    if (scope === 'USER' && roleId) {
      const [userRole] = await tx
        .select({ roleName: roleTable.roleName })
        .from(roleTable)
        .where(eq(roleTable.id, roleId))
        .limit(1);

      await this.validateSlabAgainstTenantLevel(
        tx,
        slab,
        mode,
        type,
        tenantId,
        serviceProviderMappingId,
        userRole?.roleName || 'User',
      );
    } else {
      await this.validateSlabAgainstTenantLevel(
        tx,
        slab,
        mode,
        type,
        tenantId,
        serviceProviderMappingId,
        'Tenant',
      );
    }
  }

  static async validateSlabAgainstTenantLevel(
    tx,
    slab,
    mode,
    type,
    tenantId,
    serviceProviderMappingId,
    roleName,
  ) {
    const [tenantRule] = await tx
      .select({
        id: commissionSettingTable.id,
        value: commissionSettingTable.value,
        type: commissionSettingTable.type,
        supportsSlab: commissionSettingTable.supportsSlab,
      })
      .from(commissionSettingTable)
      .where(
        and(
          eq(commissionSettingTable.tenantId, tenantId),
          eq(
            commissionSettingTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(commissionSettingTable.mode, mode),
          eq(commissionSettingTable.scope, null),
          eq(commissionSettingTable.isActive, true),
        ),
      )
      .limit(1);

    const slabValue = Number(slab.value);
    const slabMinRupees = slab.minAmount;
    const slabMaxRupees = slab.maxAmount;
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    if (tenantRule) {
      let tenantValue;
      let tenantSlabInfo = '';

      if (tenantRule.supportsSlab) {
        const slabMinPaise = rupeesToPaise(slab.minAmount);
        const slabMaxPaise = rupeesToPaise(slab.maxAmount);

        const [matchingSlab] = await tx
          .select({
            value: commissionSettingSlabTable.value,
            minAmount: commissionSettingSlabTable.minAmount,
            maxAmount: commissionSettingSlabTable.maxAmount,
          })
          .from(commissionSettingSlabTable)
          .where(
            and(
              eq(commissionSettingSlabTable.commissionSettingId, tenantRule.id),
              eq(commissionSettingSlabTable.isActive, true),
              sql`${commissionSettingSlabTable.minAmount} <= ${slabMinPaise}`,
              sql`${commissionSettingSlabTable.maxAmount} >= ${slabMaxPaise}`,
            ),
          )
          .limit(1);

        if (matchingSlab) {
          tenantValue = paiseToRupees(matchingSlab.value);
          const tenantMinRupees = paiseToRupees(matchingSlab.minAmount);
          const tenantMaxRupees = paiseToRupees(matchingSlab.maxAmount);
          tenantSlabInfo = ` (slab ₹${tenantMinRupees}-₹${tenantMaxRupees})`;
        } else {
          tenantValue = paiseToRupees(tenantRule.value);
        }
      } else {
        tenantValue = paiseToRupees(tenantRule.value);
      }

      if (type !== tenantRule.type) {
        throw ApiError.badRequest(
          `Slab type mismatch: ${roleName} uses ${type} but tenant-level uses ${tenantRule.type} for service "${serviceDisplayName}".`,
        );
      }

      try {
        await this.validateHierarchyRule(
          tx,
          mode,
          slabValue,
          tenantValue,
          type,
        );
      } catch (error) {
        const valueSymbol = type === 'FLAT' ? '₹' : '%';
        const tenantValueSymbol = tenantRule.type === 'FLAT' ? '₹' : '%';

        throw ApiError.badRequest(
          `Slab ₹${slabMinRupees}-₹${slabMaxRupees}: ${error.message}. Hierarchy: ${roleName} (${slabValue}${valueSymbol}) → Tenant Level (${tenantValue}${tenantValueSymbol})${tenantSlabInfo}. Service: ${serviceDisplayName}`,
        );
      }
    } else {
      await this.validateSlabAgainstTenantHierarchy(
        tx,
        slab,
        mode,
        type,
        tenantId,
        serviceProviderMappingId,
        roleName,
      );
    }
  }

  static async validateSlabAgainstTenantHierarchy(
    tx,
    slab,
    mode,
    type,
    tenantId,
    serviceProviderMappingId,
    roleName,
  ) {
    let currentTenantId = tenantId;
    const visited = new Set();
    const slabValue = Number(slab.value);
    const slabMinRupees = slab.minAmount;
    const slabMaxRupees = slab.maxAmount;
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    while (currentTenantId && !visited.has(currentTenantId)) {
      visited.add(currentTenantId);

      const [currentTenant] = await tx
        .select({ parentTenantId: tenantsTable.parentTenantId })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, currentTenantId))
        .limit(1);

      const parentTenantId = currentTenant?.parentTenantId;

      if (!parentTenantId) {
        await this.validateTopLevelSlabAgainstProviderCost(
          tx,
          slab,
          mode,
          type,
          serviceProviderMappingId,
          roleName,
        );
        return;
      }

      const [parentRule] = await tx
        .select({
          id: commissionSettingTable.id,
          value: commissionSettingTable.value,
          type: commissionSettingTable.type,
          supportsSlab: commissionSettingTable.supportsSlab,
        })
        .from(commissionSettingTable)
        .where(
          and(
            eq(commissionSettingTable.tenantId, parentTenantId),
            eq(
              commissionSettingTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(commissionSettingTable.mode, mode),
            eq(commissionSettingTable.isActive, true),
          ),
        )
        .limit(1);

      if (parentRule) {
        let parentValue;
        let parentSlabInfo = '';

        if (parentRule.supportsSlab) {
          const slabMinPaise = rupeesToPaise(slab.minAmount);
          const slabMaxPaise = rupeesToPaise(slab.maxAmount);

          const [matchingSlab] = await tx
            .select({
              value: commissionSettingSlabTable.value,
              minAmount: commissionSettingSlabTable.minAmount,
              maxAmount: commissionSettingSlabTable.maxAmount,
            })
            .from(commissionSettingSlabTable)
            .where(
              and(
                eq(
                  commissionSettingSlabTable.commissionSettingId,
                  parentRule.id,
                ),
                eq(commissionSettingSlabTable.isActive, true),
                sql`${commissionSettingSlabTable.minAmount} <= ${slabMinPaise}`,
                sql`${commissionSettingSlabTable.maxAmount} >= ${slabMaxPaise}`,
              ),
            )
            .limit(1);

          if (matchingSlab) {
            parentValue = paiseToRupees(matchingSlab.value);
            const parentMinRupees = paiseToRupees(matchingSlab.minAmount);
            const parentMaxRupees = paiseToRupees(matchingSlab.maxAmount);
            parentSlabInfo = ` (slab ₹${parentMinRupees}-₹${parentMaxRupees})`;
          } else {
            parentValue = paiseToRupees(parentRule.value);
          }
        } else {
          parentValue = paiseToRupees(parentRule.value);
        }

        if (type !== parentRule.type) {
          throw ApiError.badRequest(
            `Slab type mismatch: ${roleName} uses ${type} but parent tenant uses ${parentRule.type} for service "${serviceDisplayName}".`,
          );
        }

        try {
          await this.validateHierarchyRule(
            tx,
            mode,
            slabValue,
            parentValue,
            type,
          );
        } catch (error) {
          const valueSymbol = type === 'FLAT' ? '₹' : '%';
          const parentValueSymbol = parentRule.type === 'FLAT' ? '₹' : '%';

          throw ApiError.badRequest(
            `Slab ₹${slabMinRupees}-₹${slabMaxRupees}: ${error.message}. Tenant Hierarchy: ${roleName} (${slabValue}${valueSymbol}) → Parent Tenant (${parentValue}${parentValueSymbol})${parentSlabInfo}. Service: ${serviceDisplayName}`,
          );
        }
        return;
      }

      currentTenantId = parentTenantId;
    }

    await this.validateTopLevelSlabAgainstProviderCost(
      tx,
      slab,
      mode,
      type,
      serviceProviderMappingId,
      roleName,
    );
  }

  static async validateTopLevelSlabAgainstProviderCost(
    tx,
    slab,
    mode,
    type,
    serviceProviderMappingId,
    roleName,
  ) {
    const slabValue = Number(slab.value);
    const serviceDisplayName = await this.getServiceDisplayName(
      tx,
      serviceProviderMappingId,
    );

    const slabMinRupees = slab.minAmount;
    const slabMaxRupees = slab.maxAmount;

    const providerSlab = await this.getProviderCostFromSlab(
      tx,
      serviceProviderMappingId,
      {
        minAmount: slabMinRupees,
        maxAmount: slabMaxRupees,
      },
    );

    if (!providerSlab) {
      const allProviderSlabs = await tx
        .select({
          minAmount: ProviderSlabTable.minAmount,
          maxAmount: ProviderSlabTable.maxAmount,
        })
        .from(ProviderSlabTable)
        .where(
          and(
            eq(
              ProviderSlabTable.serviceProviderMappingId,
              serviceProviderMappingId,
            ),
            eq(ProviderSlabTable.isActive, true),
          ),
        )
        .orderBy(ProviderSlabTable.minAmount);

      if (allProviderSlabs.length > 0) {
        const providerRanges = allProviderSlabs
          .map(
            (s) =>
              `₹${paiseToRupees(s.minAmount)}-₹${paiseToRupees(s.maxAmount)}`,
          )
          .join(', ');

        throw ApiError.badRequest(
          `No provider cost found for slab range ₹${slabMinRupees}-₹${slabMaxRupees}. This range does not overlap with any provider slab. Available provider slab ranges: ${providerRanges}. Service: ${serviceDisplayName}. Suggestion: Adjust your slab ranges to align with provider slabs.`,
        );
      }

      const [mapping] = await tx
        .select({ providerCost: ServiceProviderMappingTable.providerCost })
        .from(ServiceProviderMappingTable)
        .where(eq(ServiceProviderMappingTable.id, serviceProviderMappingId))
        .limit(1);

      if (!mapping?.providerCost) return;

      const providerCost = paiseToRupees(mapping.providerCost);

      if (mode === 'SURCHARGE') {
        if (type === 'FLAT' && slabValue < providerCost) {
          throw ApiError.badRequest(
            `Surcharge slab ₹${slabMinRupees}-₹${slabMaxRupees} validation failed: ${roleName} (₹${slabValue}) cannot be less than provider cost (₹${providerCost}). Service: ${serviceDisplayName}. Rule: Surcharge must be ≥ Provider Cost at top level.`,
          );
        }
      } else if (mode === 'COMMISSION') {
        if (type === 'FLAT' && slabValue > providerCost) {
          throw ApiError.badRequest(
            `Commission slab ₹${slabMinRupees}-₹${slabMaxRupees} validation failed: ${roleName} (₹${slabValue}) cannot exceed provider cost (₹${providerCost}). Service: ${serviceDisplayName}. Rule: Commission must be ≤ Provider Cost at top level.`,
          );
        }
      }
      return;
    }

    const providerCost = providerSlab.providerCost;

    if (mode === 'SURCHARGE') {
      if (type === 'FLAT' && slabValue < providerCost) {
        throw ApiError.badRequest(
          `Surcharge slab ₹${slabMinRupees}-₹${slabMaxRupees} validation failed: ${roleName} (₹${slabValue}) cannot be less than provider cost (₹${providerCost}) for provider slab ₹${providerSlab.minAmount}-₹${providerSlab.maxAmount}. Service: ${serviceDisplayName}. Rule: Surcharge must be ≥ Provider Cost at top level.`,
        );
      }
    } else if (mode === 'COMMISSION') {
      if (type === 'FLAT' && slabValue > providerCost) {
        throw ApiError.badRequest(
          `Commission slab ₹${slabMinRupees}-₹${slabMaxRupees} validation failed: ${roleName} (₹${slabValue}) cannot exceed provider cost (₹${providerCost}) for provider slab ₹${providerSlab.minAmount}-₹${providerSlab.maxAmount}. Service: ${serviceDisplayName}. Rule: Commission must be ≤ Provider Cost at top level.`,
        );
      }
    }
  }

  static async checkRuleExists(tx, tenantId, payload, excludeId = null) {
    const whereConditions = [
      eq(commissionSettingTable.tenantId, tenantId),
      eq(commissionSettingTable.scope, payload.scope || ''),
      eq(
        commissionSettingTable.serviceProviderMappingId,
        payload.serviceProviderMappingId || '',
      ),
      eq(commissionSettingTable.mode, payload.mode || ''),
    ];

    if (payload.scope === 'USER' && payload.targetUserId) {
      whereConditions.push(
        eq(commissionSettingTable.targetUserId, payload.targetUserId),
      );
    } else if (payload.scope === 'ROLE' && payload.roleId) {
      whereConditions.push(eq(commissionSettingTable.roleId, payload.roleId));
    }

    if (excludeId) {
      whereConditions.push(sql`${commissionSettingTable.id} != ${excludeId}`);
    }

    const [existingRecord] = await tx
      .select({ id: commissionSettingTable.id })
      .from(commissionSettingTable)
      .where(and(...whereConditions))
      .limit(1);

    return existingRecord;
  }

  static prepareInsertData(payload, actor, id, now, tenantId) {
    let finalValue = BigInt(0);
    if (!payload.supportsSlab && payload.value) {
      const valueInPaise = rupeesToPaise(payload.value);
      finalValue = BigInt(valueInPaise || 0);
    }

    return {
      id,
      tenantId: tenantId,
      scope: payload.scope || null,
      roleId: payload.scope === 'ROLE' ? payload.roleId : null,
      targetUserId: payload.scope === 'USER' ? payload.targetUserId : null,
      serviceProviderMappingId: payload.serviceProviderMappingId || null,
      mode: payload.mode || null,
      type: payload.type || 'PERCENTAGE',
      value: finalValue,
      applyTDS: payload.applyTDS === true,
      tdsPercent: payload.applyTDS ? String(payload.tdsPercent || 0) : '0',
      applyGST: payload.applyGST === true,
      gstPercent: payload.applyGST ? String(payload.gstPercent || 0) : '0',
      supportsSlab: payload.supportsSlab === true,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
      createdAt: now,
      updatedAt: now,
    };
  }

  static prepareUpdateData(payload, existingRule, actor) {
    const updateData = { updatedAt: new Date() };

    if (actor.type === 'USER') {
      updateData.updatedByUserId = actor.id;
      updateData.updatedByEmployeeId = null;
    } else {
      updateData.updatedByEmployeeId = actor.id;
      updateData.updatedByUserId = null;
    }

    const updatableFields = [
      'mode',
      'type',
      'serviceProviderMappingId',
      'applyTDS',
      'applyGST',
      'isActive',
      'supportsSlab',
    ];

    updatableFields.forEach((field) => {
      if (payload[field] !== undefined) updateData[field] = payload[field];
    });

    if (!payload.supportsSlab && payload.value !== undefined) {
      const valueInPaise = rupeesToPaise(payload.value);
      updateData.value = BigInt(valueInPaise || 0);
    } else if (payload.supportsSlab === true) {
      updateData.value = BigInt(0);
    }

    if (payload.tdsPercent !== undefined)
      updateData.tdsPercent = String(payload.tdsPercent);
    if (payload.gstPercent !== undefined)
      updateData.gstPercent = String(payload.gstPercent);

    return updateData;
  }

  static async insertSlabs(tx, commissionSettingId, slabs, now) {
    if (!slabs?.length) return;
    const slabValues = slabs.map((slab) => ({
      id: randomUUID(),
      commissionSettingId: commissionSettingId,
      minAmount: BigInt(rupeesToPaise(slab.minAmount) || 0),
      maxAmount: BigInt(rupeesToPaise(slab.maxAmount) || 0),
      value: BigInt(rupeesToPaise(slab.value) || 0),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));
    await tx.insert(commissionSettingSlabTable).values(slabValues);
  }

  static async deleteSlabs(tx, commissionSettingId) {
    await tx
      .delete(commissionSettingSlabTable)
      .where(
        eq(commissionSettingSlabTable.commissionSettingId, commissionSettingId),
      );
  }

  static async fetchSlabs(tx, commissionSettingId) {
    const slabs = await tx
      .select()
      .from(commissionSettingSlabTable)
      .where(
        and(
          eq(
            commissionSettingSlabTable.commissionSettingId,
            commissionSettingId,
          ),
          eq(commissionSettingSlabTable.isActive, true),
        ),
      )
      .orderBy(commissionSettingSlabTable.minAmount);

    return slabs.map((slab) => ({
      ...slab,
      minAmount: paiseToRupees(slab.minAmount),
      maxAmount: paiseToRupees(slab.maxAmount),
      value: paiseToRupees(slab.value),
    }));
  }

  static async getRuleWithDetails(tx, id, tenantId) {
    const [rule] = await tx
      .select({
        id: commissionSettingTable.id,
        tenantId: commissionSettingTable.tenantId,
        scope: commissionSettingTable.scope,
        roleId: commissionSettingTable.roleId,
        targetUserId: commissionSettingTable.targetUserId,
        serviceProviderMappingId:
          commissionSettingTable.serviceProviderMappingId,
        mode: commissionSettingTable.mode,
        type: commissionSettingTable.type,
        value: commissionSettingTable.value,
        applyTDS: commissionSettingTable.applyTDS,
        tdsPercent: commissionSettingTable.tdsPercent,
        applyGST: commissionSettingTable.applyGST,
        gstPercent: commissionSettingTable.gstPercent,
        supportsSlab: commissionSettingTable.supportsSlab,
        isActive: commissionSettingTable.isActive,
        createdAt: commissionSettingTable.createdAt,
        updatedAt: commissionSettingTable.updatedAt,
      })
      .from(commissionSettingTable)
      .where(
        and(
          eq(commissionSettingTable.id, id),
          eq(commissionSettingTable.tenantId, tenantId),
        ),
      )
      .limit(1);
    return rule;
  }

  static async createRule(payload, actor) {
    await this.validateEmployeeActor(actor);

    const tenantId = await this.getActorTenantId(actor);

    if (!payload || typeof payload !== 'object') {
      throw ApiError.badRequest('Invalid payload: payload is required');
    }
    if (!actor || typeof actor !== 'object') {
      throw ApiError.badRequest('Invalid actor: actor is required');
    }
    if (!tenantId) {
      throw ApiError.badRequest('Tenant missing');
    }

    return await db.transaction(async (tx) => {
      const actorRoleLevel = await this.getActorRoleLevel(tx, actor);
      if (actorRoleLevel === null || actorRoleLevel === undefined) {
        throw ApiError.forbidden('Invalid actor role');
      }
      const targetRoleLevel = await this.getTargetRoleLevelFromPayload(
        tx,
        payload,
      );

      if (!canSetCommission({ actorRoleLevel, targetRoleLevel })) {
        throw ApiError.forbidden(
          'You are not allowed to set commission for this target',
        );
      }

      this.validateCommissionData(payload, 'create');

      await this.validateNonSlabHierarchy(tx, payload, tenantId);

      const existingRule = await this.checkRuleExists(tx, tenantId, payload);
      if (existingRule) {
        throw ApiError.badRequest(
          'A commission rule with these parameters already exists',
        );
      }

      const id = randomUUID();
      const now = new Date();
      const insertData = this.prepareInsertData(
        payload,
        actor,
        id,
        now,
        tenantId,
      );

      await tx.insert(commissionSettingTable).values(insertData);

      if (payload.supportsSlab && payload.slabs?.length > 0) {
        await this.insertSlabs(tx, id, payload.slabs, now);
        await this.validateSlabHierarchyRules(tx, id, payload.mode);
      }

      return {
        success: true,
        id,
        message: 'Commission rule created successfully',
      };
    });
  }

  static async updateRule(id, payload, actor) {
    await this.validateEmployeeActor(actor);

    const tenantId = await this.getActorTenantId(actor);
    if (!id) throw ApiError.badRequest('Rule id is required');
    if (!payload || typeof payload !== 'object')
      throw ApiError.badRequest('Invalid payload');
    if (!actor || typeof actor !== 'object')
      throw ApiError.badRequest('Invalid actor');
    if (!tenantId) throw ApiError.badRequest('Tenant missing');

    return await db.transaction(async (tx) => {
      const existingRule = await this.getRuleWithDetails(tx, id, tenantId);
      if (!existingRule) throw ApiError.notFound('Commission rule not found');

      const actorRoleLevel = await this.getActorRoleLevel(tx, actor);
      if (actorRoleLevel === null || actorRoleLevel === undefined) {
        throw ApiError.forbidden('Invalid actor role');
      }
      const targetRoleLevel = await this.getTargetRoleLevelFromRule(
        tx,
        existingRule,
      );

      if (!canSetCommission({ actorRoleLevel, targetRoleLevel })) {
        throw ApiError.forbidden(
          'You are not allowed to update this commission rule',
        );
      }

      const mergedPayload = { ...existingRule, ...payload };
      if (mergedPayload.value && typeof mergedPayload.value === 'bigint') {
        mergedPayload.value = paiseToRupees(mergedPayload.value);
      }

      this.validateCommissionData(mergedPayload, 'update');

      const checkPayload = {
        scope: payload.scope || existingRule.scope,
        roleId: payload.roleId || existingRule.roleId,
        targetUserId: payload.targetUserId || existingRule.targetUserId,
        serviceProviderMappingId:
          payload.serviceProviderMappingId ||
          existingRule.serviceProviderMappingId,
        mode: payload.mode || existingRule.mode,
      };

      const existingDuplicate = await this.checkRuleExists(
        tx,
        tenantId,
        checkPayload,
        id,
      );
      if (existingDuplicate) {
        const serviceDisplayName = await this.getServiceDisplayName(
          tx,
          checkPayload.serviceProviderMappingId,
        );
        throw ApiError.badRequest(
          `A rule with same scope and mode already exists for service "${serviceDisplayName}". Please update existing rule instead of creating duplicate.`,
        );
      }

      const validationPayload = {
        mode: payload.mode || existingRule.mode,
        type: payload.type || existingRule.type,
        value:
          payload.value !== undefined
            ? payload.value
            : paiseToRupees(existingRule.value),
        supportsSlab:
          payload.supportsSlab !== undefined
            ? payload.supportsSlab
            : existingRule.supportsSlab,
        serviceProviderMappingId:
          payload.serviceProviderMappingId ||
          existingRule.serviceProviderMappingId,
        scope: payload.scope || existingRule.scope,
        roleId: payload.roleId || existingRule.roleId,
      };

      await this.validateNonSlabHierarchy(
        tx,
        validationPayload,
        tenantId,
        true,
      );

      const updateData = this.prepareUpdateData(payload, existingRule, actor);
      await tx
        .update(commissionSettingTable)
        .set(updateData)
        .where(eq(commissionSettingTable.id, id));

      if (payload.supportsSlab !== undefined) {
        if (payload.supportsSlab && payload.slabs?.length > 0) {
          await this.deleteSlabs(tx, id);
          await this.insertSlabs(tx, id, payload.slabs, new Date());
          await this.validateSlabHierarchyRules(
            tx,
            id,
            payload.mode || existingRule.mode,
          );
        } else if (!payload.supportsSlab && existingRule.supportsSlab) {
          await this.deleteSlabs(tx, id);
        }
      }

      return {
        success: true,
        id,
        message: 'Commission rule updated successfully',
      };
    });
  }

  static validateCommissionData(payload, action = 'create') {
    if (!payload) throw ApiError.badRequest('Payload is required');
    if (!payload.type || !['PERCENTAGE', 'FLAT'].includes(payload.type)) {
      throw ApiError.badRequest('Type must be PERCENTAGE or FLAT');
    }

    if (!payload.supportsSlab) {
      if (
        action === 'create' &&
        (payload.value === undefined || payload.value === null)
      ) {
        throw ApiError.badRequest(
          'Value is required when slab support is disabled',
        );
      }
      if (payload.value !== undefined) {
        this.validateValueRange(payload.value, payload.type, payload.mode);
      }
      if (payload.slabs?.length > 0) {
        throw ApiError.badRequest(
          'Slabs cannot be provided when slab support is disabled',
        );
      }
    }

    if (payload.supportsSlab) {
      if (
        action === 'create' &&
        (!payload.slabs || payload.slabs.length === 0)
      ) {
        throw ApiError.badRequest(
          'At least one slab is required when slab support is enabled',
        );
      }

      const hasMeaningfulValue =
        payload.value !== undefined &&
        payload.value !== null &&
        payload.value !== 0 &&
        payload.value !== 0n;

      if (hasMeaningfulValue) {
        throw ApiError.badRequest(
          'Value must not be provided when slab support is enabled',
        );
      }

      if (payload.slabs?.length > 0) {
        this.validateSlabs(payload.slabs, payload.type, payload.mode);
      }
    }

    if (payload.mode === 'COMMISSION' && payload.applyGST) {
      throw ApiError.badRequest('GST cannot be applied to commissions');
    }
    if (payload.mode === 'SURCHARGE' && payload.applyTDS) {
      throw ApiError.badRequest('TDS cannot be applied to surcharges');
    }
  }

  static validateSlabs(slabs, type, mode) {
    if (!slabs?.length) return;

    for (const slab of slabs) {
      if (slab.value === undefined || slab.value === null) {
        throw ApiError.badRequest(
          `Value is required in slab for range ₹${slab.minAmount}-₹${slab.maxAmount}`,
        );
      }
      this.validateValueRange(slab.value, type, mode, 'Slab ');
    }

    const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);

    if (sortedSlabs[0].minAmount !== 1) {
      throw ApiError.badRequest('First slab must start with minAmount ₹1');
    }

    for (let i = 0; i < sortedSlabs.length; i++) {
      const slab = sortedSlabs[i];
      if (slab.minAmount < 1) {
        throw ApiError.badRequest(
          `Invalid minAmount in slab ${i + 1}: cannot be less than ₹1`,
        );
      }
      if (slab.maxAmount === 0 || slab.maxAmount === null) {
        throw ApiError.badRequest(
          `Unlimited slab (maxAmount = 0) is not allowed for slab ${i + 1}. Please specify a maxAmount.`,
        );
      }
      if (slab.maxAmount <= slab.minAmount) {
        throw ApiError.badRequest(
          `Invalid slab range ${i + 1}: maxAmount (₹${slab.maxAmount}) must be greater than minAmount (₹${slab.minAmount})`,
        );
      }
      if (i > 0) {
        const prev = sortedSlabs[i - 1];
        if (slab.minAmount <= prev.maxAmount) {
          throw ApiError.badRequest(
            `Overlap detected: slab ${i} starts at ₹${slab.minAmount} but previous slab ends at ₹${prev.maxAmount}. Slabs must not overlap.`,
          );
        }
        if (slab.minAmount !== prev.maxAmount + 1) {
          throw ApiError.badRequest(
            `Gap detected: expected slab ${i + 1} to start at ₹${prev.maxAmount + 1} but got ₹${slab.minAmount}. Slabs must be continuous without gaps.`,
          );
        }
      }
    }
  }

  static async resolveForUser({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    amount,
  }) {
    try {
      let currentTenantId = tenantId;

      while (currentTenantId) {
        if (userId) {
          const [userRule] = await db
            .select()
            .from(commissionSettingTable)
            .where(
              and(
                eq(commissionSettingTable.tenantId, currentTenantId),
                eq(
                  commissionSettingTable.serviceProviderMappingId,
                  serviceProviderMappingId,
                ),
                eq(commissionSettingTable.scope, 'USER'),
                eq(commissionSettingTable.targetUserId, userId),
                eq(commissionSettingTable.isActive, true),
              ),
            )
            .limit(1);

          if (userRule) {
            return await this.resolveRuleValue(userRule, amount);
          }
        }

        if (roleId) {
          const [roleRule] = await db
            .select()
            .from(commissionSettingTable)
            .where(
              and(
                eq(commissionSettingTable.tenantId, currentTenantId),
                eq(
                  commissionSettingTable.serviceProviderMappingId,
                  serviceProviderMappingId,
                ),
                eq(commissionSettingTable.scope, 'ROLE'),
                eq(commissionSettingTable.roleId, roleId),
                eq(commissionSettingTable.isActive, true),
              ),
            )
            .limit(1);

          if (roleRule) {
            return await this.resolveRuleValue(roleRule, amount);
          }
        }

        const [tenant] = await db
          .select({ parentTenantId: tenantsTable.parentTenantId })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, currentTenantId))
          .limit(1);

        currentTenantId = tenant?.parentTenantId;
      }

      return null;
    } catch (error) {
      console.error('Error resolving commission for user:', error);
      throw error;
    }
  }

  static async resolveRuleValue(rule, amount) {
    if (rule.supportsSlab) {
      if (!amount) {
        throw ApiError.badRequest(
          'Amount is required for slab-based commission resolution',
        );
      }
      const slabAmount = BigInt(rupeesToPaise(amount));
      const [slab] = await db
        .select()
        .from(commissionSettingSlabTable)
        .where(
          and(
            eq(commissionSettingSlabTable.commissionSettingId, rule.id),
            eq(commissionSettingSlabTable.isActive, true),
            sql`${commissionSettingSlabTable.minAmount} <= ${slabAmount}`,
            sql`${commissionSettingSlabTable.maxAmount} >= ${slabAmount}`,
          ),
        )
        .orderBy(desc(commissionSettingSlabTable.minAmount))
        .limit(1);

      if (!slab) return null;
      return this.formatCommissionResponse(
        rule,
        paiseToRupees(slab.value),
        slab,
      );
    }

    if (!rule.value) return null;
    return this.formatCommissionResponse(rule, paiseToRupees(rule.value));
  }

  static formatCommissionResponse(rule, value, slab = null) {
    const response = {
      id: rule.id,
      tenantId: rule.tenantId,
      scope: rule.scope,
      roleId: rule.roleId,
      targetUserId: rule.targetUserId,
      serviceProviderMappingId: rule.serviceProviderMappingId,
      mode: rule.mode,
      type: rule.type,
      value: value,
      applyTDS: rule.applyTDS,
      tdsPercent: rule.tdsPercent ? Number(rule.tdsPercent) : null,
      applyGST: rule.applyGST,
      gstPercent: rule.gstPercent ? Number(rule.gstPercent) : null,
      supportsSlab: rule.supportsSlab,
      isActive: rule.isActive,
    };

    if (slab) {
      response.appliedSlab = {
        minAmount: Number(slab.minAmount),
        maxAmount: Number(slab.maxAmount),
        value: Number(slab.value),
      };
    }

    return response;
  }

  static async getCommissionList(actor, query = {}) {
    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId)
      throw ApiError.badRequest('Invalid actor: tenantId required');

    const { id: actorId, roleId, isTenantOwner } = actor;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    let actorRoleLevel = 0;
    if (roleId) {
      const [actorRole] = await db
        .select({ roleLevel: roleTable.roleLevel })
        .from(roleTable)
        .where(eq(roleTable.id, roleId))
        .limit(1);
      actorRoleLevel = actorRole?.roleLevel || 0;
    }

    let whereConditions = [eq(commissionSettingTable.tenantId, tenantId)];

    if (actor.type !== 'EMPLOYEE' && !isTenantOwner && actorId) {
      const downlineUsers = await this.getDownlineUsers(actorId, tenantId);
      const userIdsToShow = downlineUsers.map((u) => u.id);

      if (userIdsToShow.length > 0) {
        whereConditions.push(
          sql`(
            ${commissionSettingTable.scope} = 'ROLE' OR
            (${commissionSettingTable.scope} = 'USER' AND ${commissionSettingTable.targetUserId} IN (${userIdsToShow.join(',')})) OR
            (${commissionSettingTable.scope} = 'USER' AND ${commissionSettingTable.targetUserId} = ${actorId})
          )`,
        );
      } else {
        whereConditions.push(
          sql`(
            ${commissionSettingTable.scope} = 'ROLE' OR
            (${commissionSettingTable.scope} = 'USER' AND ${commissionSettingTable.targetUserId} = ${actorId})
          )`,
        );
      }
    }

    const rows = await db
      .select({
        id: commissionSettingTable.id,
        tenantId: commissionSettingTable.tenantId,
        scope: commissionSettingTable.scope,
        roleId: commissionSettingTable.roleId,
        targetUserId: commissionSettingTable.targetUserId,
        serviceProviderMappingId:
          commissionSettingTable.serviceProviderMappingId,
        mode: commissionSettingTable.mode,
        type: commissionSettingTable.type,
        value: commissionSettingTable.value,
        applyTDS: commissionSettingTable.applyTDS,
        tdsPercent: commissionSettingTable.tdsPercent,
        applyGST: commissionSettingTable.applyGST,
        gstPercent: commissionSettingTable.gstPercent,
        supportsSlab: commissionSettingTable.supportsSlab,
        isActive: commissionSettingTable.isActive,
        createdAt: commissionSettingTable.createdAt,
        updatedAt: commissionSettingTable.updatedAt,
        roleName: roleTable.roleName,
        roleCode: roleTable.roleCode,
        serviceName: ServiceTable.name,
        serviceCode: ServiceTable.code,
        targetUserFirstName: usersTable.firstName,
        targetUserLastName: usersTable.lastName,
        targetUserEmail: usersTable.email,
      })
      .from(commissionSettingTable)
      .leftJoin(roleTable, eq(commissionSettingTable.roleId, roleTable.id))
      .leftJoin(
        usersTable,
        eq(commissionSettingTable.targetUserId, usersTable.id),
      )
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          commissionSettingTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .where(and(...whereConditions))
      .orderBy(desc(commissionSettingTable.createdAt))
      .limit(limit)
      .offset(offset);

    const commissionIdsWithSlabs = rows
      .filter((row) => row.supportsSlab)
      .map((row) => row.id);
    let slabsMap = new Map();

    if (commissionIdsWithSlabs.length > 0) {
      const slabs = await db
        .select()
        .from(commissionSettingSlabTable)
        .where(
          and(
            inArray(
              commissionSettingSlabTable.commissionSettingId,
              commissionIdsWithSlabs,
            ),
            eq(commissionSettingSlabTable.isActive, true),
          ),
        )
        .orderBy(commissionSettingSlabTable.minAmount);

      slabs.forEach((slab) => {
        if (!slabsMap.has(slab.commissionSettingId)) {
          slabsMap.set(slab.commissionSettingId, []);
        }
        slabsMap.get(slab.commissionSettingId).push({
          id: slab.id,
          commissionSettingId: slab.commissionSettingId,
          minAmount: paiseToRupees(slab.minAmount),
          maxAmount: paiseToRupees(slab.maxAmount),
          value: paiseToRupees(slab.value),
          isActive: slab.isActive,
          createdAt: slab.createdAt,
          updatedAt: slab.updatedAt,
        });
      });
    }

    const rowsWithSlabs = rows.map((row) => ({
      ...row,
      slabs: slabsMap.get(row.id) || [],
      value: row.value ? paiseToRupees(row.value) : null,
      tdsPercent: row.tdsPercent ? Number(row.tdsPercent) : null,
      gstPercent: row.gstPercent ? Number(row.gstPercent) : null,
      targetUser:
        row.scope === 'USER' && row.targetUserId
          ? {
              id: row.targetUserId,
              firstName: row.targetUserFirstName,
              lastName: row.targetUserLastName,
              email: row.targetUserEmail,
            }
          : null,
    }));

    const [totalResult] = await db
      .select({ total: count() })
      .from(commissionSettingTable)
      .where(and(...whereConditions));

    return {
      data: rowsWithSlabs,
      meta: {
        page,
        limit,
        total: Number(totalResult?.total || 0),
        totalPages: Math.ceil(Number(totalResult?.total || 0) / limit),
      },
    };
  }

  static async getDownlineUsers(userId, tenantId, maxDepth = 10) {
    if (!userId || !tenantId) return [];
    const downlineUsers = [];
    const queue = [{ id: userId, depth: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.depth > 0) {
        downlineUsers.push(current);
      }
      if (current.depth >= maxDepth) continue;

      const directDownlines = await db
        .select({
          id: usersTable.id,
        })
        .from(usersTable)
        .where(
          and(
            eq(usersTable.tenantId, tenantId),
            eq(usersTable.ownerUserId, current.id),
            eq(usersTable.userStatus, 'ACTIVE'),
          ),
        );

      for (const downline of directDownlines) {
        queue.push({ id: downline.id, depth: current.depth + 1 });
      }
    }

    return downlineUsers;
  }

  static async getCommissionById(id, actor) {
    if (!id) throw ApiError.badRequest('Commission rule ID is required');

    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId) throw ApiError.badRequest('Invalid actor');

    const [rule] = await db
      .select({
        id: commissionSettingTable.id,
        tenantId: commissionSettingTable.tenantId,
        scope: commissionSettingTable.scope,
        roleId: commissionSettingTable.roleId,
        targetUserId: commissionSettingTable.targetUserId,
        serviceProviderMappingId:
          commissionSettingTable.serviceProviderMappingId,
        mode: commissionSettingTable.mode,
        type: commissionSettingTable.type,
        value: commissionSettingTable.value,
        applyTDS: commissionSettingTable.applyTDS,
        tdsPercent: commissionSettingTable.tdsPercent,
        applyGST: commissionSettingTable.applyGST,
        gstPercent: commissionSettingTable.gstPercent,
        supportsSlab: commissionSettingTable.supportsSlab,
        isActive: commissionSettingTable.isActive,
        createdAt: commissionSettingTable.createdAt,
        updatedAt: commissionSettingTable.updatedAt,
        roleName: roleTable.roleName,
        roleCode: roleTable.roleCode,
        serviceName: ServiceTable.name,
        serviceCode: ServiceTable.code,
      })
      .from(commissionSettingTable)
      .leftJoin(roleTable, eq(commissionSettingTable.roleId, roleTable.id))
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          commissionSettingTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .where(
        and(
          eq(commissionSettingTable.id, id),
          eq(commissionSettingTable.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!rule) throw ApiError.notFound('Commission rule not found');

    let slabs = [];
    if (rule.supportsSlab) {
      const slabResults = await db
        .select()
        .from(commissionSettingSlabTable)
        .where(
          and(
            eq(commissionSettingSlabTable.commissionSettingId, id),
            eq(commissionSettingSlabTable.isActive, true),
          ),
        )
        .orderBy(commissionSettingSlabTable.minAmount);

      slabs = slabResults.map((slab) => ({
        id: slab.id,
        minAmount: paiseToRupees(slab.minAmount),
        maxAmount: paiseToRupees(slab.maxAmount),
        value: paiseToRupees(slab.value),
      }));
    }

    return {
      ...rule,
      value: rule.value ? paiseToRupees(rule.value) : null,
      tdsPercent: rule.tdsPercent ? Number(rule.tdsPercent) : null,
      gstPercent: rule.gstPercent ? Number(rule.gstPercent) : null,
      slabs,
    };
  }

  static async deleteRule(id, actor) {
    if (!id) throw ApiError.badRequest('Commission rule ID is required');

    const tenantId = await this.getActorTenantId(actor);
    if (!tenantId) throw ApiError.badRequest('Invalid actor');

    return await db.transaction(async (tx) => {
      const existingRule = await this.getRuleWithDetails(tx, id, tenantId);
      if (!existingRule) throw ApiError.notFound('Commission rule not found');

      if (existingRule.supportsSlab) {
        await this.deleteSlabs(tx, id);
      }

      await tx
        .delete(commissionSettingTable)
        .where(eq(commissionSettingTable.id, id));

      return {
        success: true,
        id,
        message: 'Commission rule deleted successfully',
      };
    });
  }
}

export default CommissionSettingService;
