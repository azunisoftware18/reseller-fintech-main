import { db } from '../database/core/core-db.js';
import {
  usersTable,
  employeesTable,
  roleTable,
  tenantsTable,
  walletTable,
  permissionTable,
  userPermissionTable,
  rolePermissionTable,
  departmentPermissionTable,
  employeePermissionTable,
  departmentTable,
} from '../models/core/index.js';
import { and, eq } from 'drizzle-orm';
import {
  generateTokens,
  hashToken,
  paiseToRupees,
  verifyPassword,
} from '../lib/lib.js';
import { ApiError } from '../lib/ApiError.js';
import AuditService from './audit.service.js';

class AuthService {
  async loginUser(context, data, locationData = null) {
    const [user] = await db
      .select({
        id: usersTable.id,
        passwordHash: usersTable.passwordHash,
        tenantId: usersTable.tenantId,
        userStatus: usersTable.userStatus,
        roleCode: roleTable.roleCode,
        roleId: usersTable.roleId,
        isSystem: roleTable.isSystem,
        ownerUserId: usersTable.ownerUserId,
      })
      .from(usersTable)
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .where(eq(usersTable.userNumber, data.identifier))
      .limit(1);

    if (!user) {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: 0,
        tenantId: 0,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'USER',
          status: 'FAILED',
          reason: 'Invalid credentials',
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'USER',
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (user.userStatus !== 'ACTIVE') {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: user.id,
        tenantId: user.tenantId,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'USER',
          status: 'FAILED',
          reason: 'User is inactive',
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'USER',
        },
      });
      throw ApiError.forbidden('User is inactive');
    }

    const valid = verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: user.id,
        tenantId: user.tenantId,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'USER',
          status: 'FAILED',
          reason: 'Invalid credentials',
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'USER',
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.isSystem) {
      await this.validateOwnerChain(user.id, user.ownerUserId, user.tenantId);
    }

    const [tenant] = await db
      .select({
        id: tenantsTable.id,
        userType: tenantsTable.userType,
      })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, user.tenantId))
      .limit(1);

    if (!tenant) {
      throw ApiError.unauthorized('Tenant not found');
    }

    const [role] = await db
      .select({ roleLevel: roleTable.roleLevel })
      .from(roleTable)
      .where(eq(roleTable.id, user.roleId))
      .limit(1);

    const tokens = generateTokens({
      sub: user.id,
      tenantId: tenant.id,
      tenantType: tenant.userType,
      type: 'USER',
      roleId: user.roleId,
      roleCode: user.roleCode,
      roleLevel: role.roleLevel,
    });

    await db
      .update(usersTable)
      .set({ refreshTokenHash: hashToken(tokens.refreshToken) })
      .where(eq(usersTable.id, user.id));

    await AuditService.createAuthLog({
      action: 'LOGIN',
      performByUserId: user.id,
      tenantId: user.tenantId,
      ipAddress: locationData?.ipAddress || null,
      userAgent: locationData?.userAgent || null,
      oldData: null,
      newData: {
        identifier: data.identifier,
        type: 'USER',
        status: 'SUCCESS',
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
        accuracy: locationData?.accuracy || null,
      },
      metaData: {
        identifier: data.identifier,
        userType: 'USER',
      },
    });

    return {
      id: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      type: 'USER',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async loginEmployee(data, locationData = null) {
    const [employee] = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.employeeNumber, data.identifier))
      .limit(1);

    if (!employee) {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: 0,
        tenantId: 0,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'EMPLOYEE',
          status: 'FAILED',
          reason: 'Invalid credentials',
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'EMPLOYEE',
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    const status = employee?.employeeStatus?.toUpperCase();

    const blockedStatuses = {
      INACTIVE: 'Employee is inactive',
      SUSPENDED: 'Employee is suspended',
    };

    if (blockedStatuses[status]) {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: null,
        performByEmployeeId: employee.id,
        tenantId: employee.tenantId,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'EMPLOYEE',
          status: 'FAILED',
          reason: blockedStatuses[status],
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'EMPLOYEE',
        },
      });
      throw ApiError.forbidden(blockedStatuses[status]);
    }

    const valid = verifyPassword(data.password, employee.passwordHash);
    if (!valid) {
      await AuditService.createAuthLog({
        action: 'LOGIN_FAILED',
        performByUserId: null,
        performByEmployeeId: employee.id,
        tenantId: employee.tenantId,
        ipAddress: locationData?.ipAddress || null,
        userAgent: locationData?.userAgent || null,
        oldData: null,
        newData: {
          identifier: data.identifier,
          type: 'EMPLOYEE',
          status: 'FAILED',
          reason: 'Invalid credentials',
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy: locationData?.accuracy || null,
        },
        metaData: {
          identifier: data.identifier,
          userType: 'EMPLOYEE',
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    const tokens = generateTokens({
      sub: employee.id,
      tenantId: employee.tenantId,
      type: 'EMPLOYEE',
      departmentId: employee.departmentId,
    });

    await db
      .update(employeesTable)
      .set({ refreshTokenHash: hashToken(tokens.refreshToken) })
      .where(eq(employeesTable.id, employee.id));

    await AuditService.createAuthLog({
      action: 'LOGIN',
      performByUserId: null,
      performByEmployeeId: employee.id,
      tenantId: employee.tenantId,
      ipAddress: locationData?.ipAddress || null,
      userAgent: locationData?.userAgent || null,
      oldData: null,
      newData: {
        identifier: data.identifier,
        type: 'EMPLOYEE',
        status: 'SUCCESS',
        latitude: locationData?.latitude || null,
        longitude: locationData?.longitude || null,
        accuracy: locationData?.accuracy || null,
      },
      metaData: {
        identifier: data.identifier,
        userType: 'EMPLOYEE',
      },
    });

    return {
      id: employee.id,
      tenantId: employee.tenantId,
      type: 'EMPLOYEE',
      departmentId: employee.departmentId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout({ userId, type }) {
    const table = type === 'EMPLOYEE' ? employeesTable : usersTable;

    await db
      .update(table)
      .set({ refreshTokenHash: null })
      .where(eq(table.id, userId));
  }

  async getCurrentUser(actor) {
    if (!actor?.id || !actor?.type) {
      throw ApiError.unauthorized('Invalid session');
    }

    return actor.type === 'EMPLOYEE'
      ? this.getEmployee(actor.id)
      : this.getUser(actor.id);
  }

  async getEmployee(userId) {
    const [employee] = await db
      .select({
        id: employeesTable.id,
        employeeNumber: employeesTable.employeeNumber,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        departmentId: employeesTable.departmentId,
        employeeStatus: employeesTable.employeeStatus,
        tenantId: employeesTable.tenantId,

        departmentName: departmentTable.departmentName,
        departmentCode: departmentTable.departmentCode,

        tenantName: tenantsTable.tenantName,
        tenantNumber: tenantsTable.tenantNumber,
        tenantEmail: tenantsTable.tenantEmail,
        tenantWhatsapp: tenantsTable.tenantWhatsapp,
        tenantStatus: tenantsTable.tenantStatus,
        tenantType: tenantsTable.tenantType,
        userType: tenantsTable.userType,
        parentTenantId: tenantsTable.parentTenantId,
      })
      .from(employeesTable)
      .leftJoin(tenantsTable, eq(employeesTable.tenantId, tenantsTable.id))
      .leftJoin(
        departmentTable,
        eq(employeesTable.departmentId, departmentTable.id),
      )
      .where(eq(employeesTable.id, userId))
      .limit(1);

    if (!employee || employee.employeeStatus !== 'ACTIVE') {
      throw ApiError.unauthorized('Session expired');
    }

    const departmentPermissions = await this.getDepartmentPermissions(
      employee.departmentId,
    );

    const employeePermissions = await this.getEmployeePermissions(employee.id);

    return {
      type: 'EMPLOYEE',

      user: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        departmentId: employee.departmentId,
      },

      role: {
        id: employee.departmentId,
        roleName: employee.departmentName,
        roleCode: employee.departmentCode,
      },

      tenant: await this.tenantShape(employee),

      permissions: {
        role: departmentPermissions,
        user: employeePermissions,
      },
    };
  }

  async getUser(userId) {
    // Step 1: User ka basic data fetch karo (wallet join nahi)
    const [user] = await db
      .select({
        id: usersTable.id,
        userNumber: usersTable.userNumber,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        mobileNumber: usersTable.mobileNumber,
        profilePicture: usersTable.profilePicture,
        userStatus: usersTable.userStatus,
        isKycVerified: usersTable.isKycVerified,
        roleId: usersTable.roleId,
        tenantId: usersTable.tenantId,
        ownerUserId: usersTable.ownerUserId,
        actionReason: usersTable.actionReason,

        roleCode: roleTable.roleCode,
        roleName: roleTable.roleName,
        roleLevel: roleTable.roleLevel,
        isSystem: roleTable.isSystem,

        tenantName: tenantsTable.tenantName,
        tenantNumber: tenantsTable.tenantNumber,
        tenantEmail: tenantsTable.tenantEmail,
        tenantWhatsapp: tenantsTable.tenantWhatsapp,
        tenantStatus: tenantsTable.tenantStatus,
        tenantType: tenantsTable.tenantType,
        userType: tenantsTable.userType,
        parentTenantId: tenantsTable.parentTenantId,
      })
      .from(usersTable)
      .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
      .leftJoin(tenantsTable, eq(usersTable.tenantId, tenantsTable.id))
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.userStatus !== 'ACTIVE') {
      throw ApiError.unauthorized('Session expired');
    }

    // Step 2: User ke sare wallets alag se fetch karo
    const userWallets = await db
      .select({
        id: walletTable.id,
        walletType: walletTable.walletType,
        balance: walletTable.balance,
        blockedAmount: walletTable.blockedAmount,
        status: walletTable.status,
      })
      .from(walletTable)
      .where(
        and(
          eq(walletTable.ownerType, 'USER'),
          eq(walletTable.ownerId, userId),
          eq(walletTable.tenantId, user.tenantId),
        ),
      );

    // Step 3: Wallets ko object mein convert karo (easy access ke liye)
    const wallets = {};
    let mainWalletBalance = 0;

    for (const wallet of userWallets) {
      wallets[wallet.walletType] = {
        id: wallet.id,
        balance: paiseToRupees(wallet.balance) ?? 0,
        blockedAmount: paiseToRupees(wallet.blockedAmount) ?? 0,
        status: wallet.status,
        availableBalance:
          paiseToRupees(
            Number(wallet.balance) - Number(wallet.blockedAmount || 0),
          ) ?? 0,
      };

      if (wallet.walletType === 'MAIN') {
        mainWalletBalance = wallets[wallet.walletType].balance;
      }
    }

    // Step 4: Permissions fetch karo
    let rolePermissions = [];
    let userPermissions = [];

    const isSuperAdmin = user.isSystem === true;

    if (!isSuperAdmin) {
      rolePermissions = await this.getRolePermissions(user.roleId);
      userPermissions = await this.getUserPermissions(user.id);
    }

    return {
      type: 'USER',

      user: {
        id: user.id,
        userNumber: user.userNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        profilePicture: user.profilePicture,
        status: user.userStatus,
        isKycVerified: user.isKycVerified,
        ownerUserId: user.ownerUserId,
        actionReason: user.actionReason,
      },

      role: {
        id: user.roleId,
        roleCode: user.roleCode,
        roleName: user.roleName,
        roleLevel: user.roleLevel,
        isSystem: user.isSystem,
      },

      tenant: await this.tenantShape(user),

      // Sare wallets yahan milenge
      wallets: wallets,

      // Backward compatibility ke liye purana wallet object bhi rakho
      wallet: {
        balance: mainWalletBalance,
      },

      permissions: {
        isSuperAdmin,
        role: rolePermissions,
        user: userPermissions,
      },
    };
  }

  async tenantShape(row) {
    return {
      id: row.tenantId,
      tenantName: row.tenantName,
      tenantNumber: row.tenantNumber,
      tenantEmail: row.tenantEmail,
      tenantWhatsapp: row.tenantWhatsapp,
      tenantStatus: row.tenantStatus,
      tenantType: row.tenantType,
      userType: row.userType,
      parentTenantId: row.parentTenantId,
    };
  }

  async getUserPermissions(userId) {
    const rows = await db
      .select({
        id: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
        effect: userPermissionTable.effect,
      })
      .from(userPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, userPermissionTable.permissionId),
      )
      .where(eq(userPermissionTable.userId, userId));

    return rows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      effect: p.effect,
      source: 'USER',
    }));
  }

  async getRolePermissions(roleId) {
    const rows = await db
      .select({
        id: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(rolePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, rolePermissionTable.permissionId),
      )
      .where(eq(rolePermissionTable.roleId, roleId));

    return rows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      source: 'ROLE',
    }));
  }

  async getDepartmentPermissions(departmentId) {
    const rows = await db
      .select({
        id: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
      })
      .from(departmentPermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, departmentPermissionTable.permissionId),
      )
      .where(eq(departmentPermissionTable.departmentId, departmentId));

    return rows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      source: 'DEPARTMENT',
    }));
  }

  async getEmployeePermissions(employeeId) {
    const rows = await db
      .select({
        id: permissionTable.id,
        resource: permissionTable.resource,
        action: permissionTable.action,
        effect: employeePermissionTable.effect,
      })
      .from(employeePermissionTable)
      .leftJoin(
        permissionTable,
        eq(permissionTable.id, employeePermissionTable.permissionId),
      )
      .where(eq(employeePermissionTable.employeeId, employeeId));

    return rows.map((p) => ({
      id: p.id,
      resource: p.resource,
      action: p.action,
      effect: p.effect,
      source: 'EMPLOYEE',
    }));
  }

  async validateOwnerChain(userId, ownerUserId, tenantId) {
    let currentOwner = ownerUserId;
    let depth = 0;

    while (currentOwner) {
      if (++depth > 10) {
        throw ApiError.forbidden('Ownership chain too deep');
      }

      const [owner] = await db
        .select({
          id: usersTable.id,
          ownerUserId: usersTable.ownerUserId,
          userStatus: usersTable.userStatus,
          isSystem: roleTable.isSystem,
        })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(and(eq(usersTable.id, currentOwner)))
        .limit(1);

      if (!owner) {
        throw ApiError.forbidden('Invalid ownership chain');
      }

      if (owner.userStatus !== 'ACTIVE') {
        throw ApiError.forbidden('Owner inactive');
      }

      if (owner.isSystem) {
        break;
      }

      if (!owner.ownerUserId) {
        break;
      }

      currentOwner = owner.ownerUserId;
    }
  }
}

export default new AuthService();
