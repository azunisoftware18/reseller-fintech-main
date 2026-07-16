import { db } from '../../database/core/core-db.js';
import { ApiError } from '../../lib/ApiError.js';
import { getRechargePlugin } from '../../plugin_registry/recharge/pluginRegistry.js';
import OperatorMapService from '../recharge-admin/operatorMap.service.js';
import CircleMapService from '../recharge-admin/circleMap.service.js';
import WalletService from '../wallet.service.js';
import {
  transactionTable,
  apiEntityTable,
  usersTable,
} from '../../models/core/index.js';
import { ServiceProviderMappingTable } from '../../models/core/serviceProviderMapping.schema.js';
import { ProviderTable } from '../../models/core/provider.schema.js';
import { eq, and, gte, lte, like, or, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { paiseToRupees, rupeesToPaise } from '../../lib/lib.js';
import { ServiceTable } from '../../models/core/service.schema.js';
import TransactionProcessor from '../../engines/TransactionProcessor.js';
import { plans, rechargeResponseData } from '../../lib/apiMockData.js';

class RechargeService {
  async fetchPlans(
    {
      internalOperatorCode,
      internalCircleCode,
      mobileNumber,
      serviceProviderMappingId,
    },
    user,
  ) {
    const mapping = await this._validateMapping(serviceProviderMappingId);

    const operatorCode = await OperatorMapService.getProviderCode(
      internalOperatorCode,
      serviceProviderMappingId,
      'PLAN_FETCH',
    );

    const circleCode = await CircleMapService.getProviderCode(
      internalCircleCode,
      serviceProviderMappingId,
      'PLAN_FETCH',
    );

    if (!operatorCode || !circleCode) {
      throw ApiError.badRequest(
        'Operator or circle mapping not found for plan fetching',
      );
    }

    const plugin = getRechargePlugin(mapping.providerCode, mapping.config);

    try {
      // const plans = await plugin.fetchPlans({ operatorCode, circleCode });

      return {
        success: true,
        data: {
          mobileNumber,
          operator: internalOperatorCode,
          circle: internalCircleCode,
          plans: this._transformPlans(plans),
        },
      };
    } catch (error) {
      throw ApiError.internal(`Failed to fetch plans: ${error.message}`);
    }
  }

  async performRecharge(
    {
      mobileNumber,
      internalOperatorCode,
      amount,
      serviceProviderMappingId,
      planId,
      metadata,
    },
    user,
  ) {
    const wallet = await WalletService.getUserMainWallet(
      user.id,
      user.tenantId,
    );

    const amountInPaise = rupeesToPaise(amount);

    await WalletService.validateWalletBalance(wallet.id, amountInPaise);

    const mapping = await this._validateMapping(serviceProviderMappingId);

    const operatorCode = await OperatorMapService.getProviderCode(
      internalOperatorCode,
      serviceProviderMappingId,
      'RECHARGE_EXECUTE',
    );

    if (!operatorCode) {
      throw ApiError.badRequest('Operator mapping not found for recharge');
    }

    const txnId = `RC${Date.now()}${crypto.randomInt(1000, 9999)}`;
    const idempotencyKey = crypto.randomUUID();
    const apiEntityId = crypto.randomUUID();
    const now = new Date();

    await db.insert(apiEntityTable).values({
      id: apiEntityId,
      tenantId: user.tenantId,
      reference: txnId,
      userId: user.id,
      serviceProviderMappingId,
      status: 'PENDING',
      requestPayload: JSON.stringify({
        mobileNumber,
        amount,
        operatorCode,
        internalOperatorCode,
      }),
      createdAt: now,
      updatedAt: now,
    });

    await WalletService.blockAmount({
      walletId: wallet.id,
      amount: amountInPaise,
      apiEntityId: apiEntityId,
      reference: txnId,
    });

    const transactionId = crypto.randomUUID();

    await db.insert(transactionTable).values({
      id: transactionId,
      tenantId: user.tenantId,
      idempotencyKey,
      txnId,
      amount: BigInt(amountInPaise),
      netAmount: BigInt(amountInPaise),
      status: 'PENDING',
      serviceProviderMappingId,
      pricing: JSON.stringify({
        baseAmount: amount,
        commission: 0,
        tds: 0,
        gst: 0,
        providerMargin: 0,
      }),
      userId: user.id,
      walletId: wallet.id,
      apiEntityId,
      serviceType: 'RECHARGE',
      serviceData: JSON.stringify({
        mobileNumber,
        operatorCode: internalOperatorCode,
        planId: planId || null,
      }),
      initiatedAt: now,
    });

    let rechargeResponse;
    try {
      const plugin = getRechargePlugin(mapping.providerCode, mapping.config);

      // rechargeResponse = await plugin.recharge({
      //   opcode: operatorCode,
      //   number: mobileNumber,
      //   amount: amount,
      //   transid: txnId,
      // });

      //Mock Data
      rechargeResponse = rechargeResponseData;

      const providerStatus = String(
        rechargeResponse.status || '',
      ).toUpperCase();

      const providerRef =
        rechargeResponse.optransid ||
        rechargeResponse.referenceid ||
        rechargeResponse.providerReference ||
        rechargeResponse.transid;

      if (providerRef) {
        await db
          .update(transactionTable)
          .set({ providerReference: String(providerRef) })
          .where(eq(transactionTable.id, transactionId));
      }

      if (providerStatus === 'FAIL' || providerStatus === 'FAILED') {
        await WalletService.releaseBlockedAmount({
          walletId: wallet.id,
          amount: amountInPaise,
          apiEntityId: apiEntityId,
          transactionId: transactionId,
          reference: `${txnId}_FAILED`,
        });

        await db
          .update(apiEntityTable)
          .set({
            status: 'FAILED',
            providerInitData: JSON.stringify(rechargeResponse),
            errorData: JSON.stringify({
              message: rechargeResponse.message || 'Provider rejected request',
            }),
            updatedAt: new Date(),
          })
          .where(eq(apiEntityTable.id, apiEntityId));

        await db
          .update(transactionTable)
          .set({
            status: 'FAILED',
            completedAt: new Date(),
            providerResponse: JSON.stringify(rechargeResponse),
          })
          .where(eq(transactionTable.id, transactionId));

        throw ApiError.badRequest(
          `Recharge failed: ${rechargeResponse.message || 'Provider error'}`,
        );
      }

      if (providerStatus === 'SUCCESS') {
        await db
          .update(apiEntityTable)
          .set({
            status: 'COMPLETED',
            providerInitData: JSON.stringify(rechargeResponse),
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(apiEntityTable.id, apiEntityId));

        await this._processImmediateSuccess(
          transactionId,
          apiEntityId,
          wallet.id,
          rechargeResponse,
        );

        const providerMargin = rechargeResponse.margin || 0;

        await db
          .update(transactionTable)
          .set({
            pricing: JSON.stringify({
              baseAmount: amount,
              commission: 0,
              tds: 0,
              gst: 0,
              providerMargin,
            }),
          })
          .where(eq(transactionTable.id, transactionId));

        await this._processRechargeFinancials({
          tenantId: user.tenantId,
          userId: user.id,
          roleId: user.roleId,
          amount,
          providerMargin,
          transactionId,
          serviceProviderMappingId,
          serviceId: mapping.ServiceId,
          walletId: wallet.id,
        });

        return {
          success: true,
          data: {
            transactionId,
            txnId,
            status: 'SUCCESS',
            message:
              rechargeResponse.message || 'Recharge completed successfully',
            mobileNumber,
            amount,
            providerReference: String(providerRef),
          },
        };
      }

      await db
        .update(apiEntityTable)
        .set({
          status: 'PROCESSING',
          providerInitData: JSON.stringify(rechargeResponse),
          updatedAt: new Date(),
        })
        .where(eq(apiEntityTable.id, apiEntityId));

      return {
        success: true,
        data: {
          transactionId,
          txnId,
          status: 'PENDING',
          message:
            rechargeResponse.message || 'Recharge initiated successfully',
          mobileNumber,
          amount,
          providerReference: String(providerRef),
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      await WalletService.releaseBlockedAmount({
        walletId: wallet.id,
        amount: amountInPaise,
        apiEntityId: apiEntityId,
        transactionId: transactionId,
        reference: `${txnId}_FAILED`,
      });

      await db
        .update(apiEntityTable)
        .set({
          status: 'FAILED',
          errorData: JSON.stringify({
            message: error.message,
            stack: error.stack,
          }),
          updatedAt: new Date(),
        })
        .where(eq(apiEntityTable.id, apiEntityId));

      await db
        .update(transactionTable)
        .set({
          status: 'FAILED',
          completedAt: new Date(),
        })
        .where(eq(transactionTable.id, transactionId));

      throw ApiError.internal(`Recharge failed: ${error.message}`);
    }
  }

  async getHistory(query, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const status = query.status === 'ALL' ? null : query.status;

    const conditions = [
      eq(transactionTable.userId, user.id),
      eq(transactionTable.tenantId, user.tenantId),
      eq(transactionTable.serviceType, 'RECHARGE'),
    ];

    if (status) {
      conditions.push(eq(transactionTable.status, status));
    }

    if (query.startDate) {
      conditions.push(
        gte(transactionTable.initiatedAt, new Date(query.startDate)),
      );
    }

    if (query.endDate) {
      conditions.push(
        lte(transactionTable.initiatedAt, new Date(query.endDate)),
      );
    }

    if (query.mobileNumber) {
      conditions.push(
        like(transactionTable.serviceData, `%${query.mobileNumber}%`),
      );
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          like(transactionTable.txnId, searchTerm),
          like(transactionTable.providerReference, searchTerm),
          like(transactionTable.serviceData, searchTerm),
        ),
      );
    }

    const [{ total }] = await db
      .select({ total: sql`COUNT(*)`.mapWith(Number) })
      .from(transactionTable)
      .where(and(...conditions));

    const statsRows = await db
      .select({
        status: transactionTable.status,
        count: sql`COUNT(*)`.mapWith(Number),
        totalAmount: sql`SUM(${transactionTable.amount})`.mapWith(Number),
      })
      .from(transactionTable)
      .where(
        and(
          eq(transactionTable.userId, user.id),
          eq(transactionTable.tenantId, user.tenantId),
          eq(transactionTable.serviceType, 'RECHARGE'),
        ),
      )
      .groupBy(transactionTable.status);

    const stats = {
      PENDING: { count: 0, amount: 0 },
      PROCESSING: { count: 0, amount: 0 },
      SUCCESS: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 },
      REFUNDED: { count: 0, amount: 0 },
    };

    statsRows.forEach((row) => {
      stats[row.status] = {
        count: row.count,
        amount: row.totalAmount || 0,
      };
    });

    const transactions = await db
      .select({
        id: transactionTable.id,
        txnId: transactionTable.txnId,
        amount: transactionTable.amount,
        netAmount: transactionTable.netAmount,
        status: transactionTable.status,
        providerReference: transactionTable.providerReference,
        serviceData: transactionTable.serviceData,
        pricing: transactionTable.pricing,
        initiatedAt: transactionTable.initiatedAt,
        completedAt: transactionTable.completedAt,
        serviceName: ServiceTable.name,
        providerName: ProviderTable.providerName,
      })
      .from(transactionTable)
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          transactionTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(and(...conditions))
      .orderBy(desc(transactionTable.initiatedAt))
      .limit(limit)
      .offset(offset);

    const transformedData = transactions.map((tx) => {
      const serviceData = JSON.parse(tx.serviceData || '{}');
      const pricing = JSON.parse(tx.pricing || '{}');

      return {
        id: tx.id,
        txnId: tx.txnId,
        mobileNumber: serviceData.mobileNumber,
        operator: serviceData.operatorCode,
        circle: serviceData.circleCode,
        amount: paiseToRupees(tx.amount),
        netAmount: paiseToRupees(tx.netAmount),
        status: tx.status,
        providerReference: tx.providerReference,
        serviceName: tx.serviceName,
        providerName: tx.providerName,
        commission: pricing.commission || 0,
        tds: pricing.tds || 0,
        gst: pricing.gst || 0,
        initiatedAt: tx.initiatedAt,
        completedAt: tx.completedAt,
      };
    });

    return {
      success: true,
      data: transformedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats,
      },
    };
  }

  async getDetails(transactionId, user) {
    const [transaction] = await db
      .select({
        id: transactionTable.id,
        txnId: transactionTable.txnId,
        amount: transactionTable.amount,
        netAmount: transactionTable.netAmount,
        status: transactionTable.status,
        providerReference: transactionTable.providerReference,
        providerResponse: transactionTable.providerResponse,
        serviceData: transactionTable.serviceData,
        pricing: transactionTable.pricing,
        initiatedAt: transactionTable.initiatedAt,
        processedAt: transactionTable.processedAt,
        completedAt: transactionTable.completedAt,
        serviceName: ServiceTable.name,
        providerName: ProviderTable.providerName,
      })
      .from(transactionTable)
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          transactionTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(
        and(
          eq(transactionTable.id, transactionId),
          eq(transactionTable.userId, user.id),
          eq(transactionTable.tenantId, user.tenantId),
          eq(transactionTable.serviceType, 'RECHARGE'),
        ),
      )
      .limit(1);

    if (!transaction) {
      throw ApiError.notFound('Transaction not found');
    }

    const serviceData = JSON.parse(transaction.serviceData || '{}');
    const pricing = JSON.parse(transaction.pricing || '{}');
    const providerResponse = transaction.providerResponse
      ? JSON.parse(transaction.providerResponse)
      : null;

    return {
      success: true,
      data: {
        id: transaction.id,
        txnId: transaction.txnId,
        mobileNumber: serviceData.mobileNumber,
        operator: serviceData.operatorCode,
        circle: serviceData.circleCode,
        planId: serviceData.planId,
        amount: paiseToRupees(transaction.amount),
        netAmount: paiseToRupees(transaction.netAmount),
        status: transaction.status,
        providerReference: transaction.providerReference,
        serviceName: transaction.serviceName,
        providerName: transaction.providerName,
        pricing: {
          baseAmount: pricing.baseAmount || paiseToRupees(transaction.amount),
          commission: pricing.commission || 0,
          tds: pricing.tds || 0,
          gst: pricing.gst || 0,
        },
        providerResponse,
        timeline: {
          initiatedAt: transaction.initiatedAt,
          processedAt: transaction.processedAt,
          completedAt: transaction.completedAt,
        },
      },
    };
  }

  async checkStatus({ transactionId }, user) {
    const [transaction] = await db
      .select()
      .from(transactionTable)
      .where(
        and(
          eq(transactionTable.txnId, transactionId),
          eq(transactionTable.userId, user.id),
          eq(transactionTable.tenantId, user.tenantId),
        ),
      )
      .limit(1);

    if (!transaction) {
      throw ApiError.notFound('Transaction not found');
    }

    if (
      transaction.status === 'PENDING' ||
      transaction.status === 'PROCESSING'
    ) {
      const mapping = await this._validateMapping(
        transaction.serviceProviderMappingId,
      );
      const plugin = getRechargePlugin(mapping.providerCode, mapping.config);

      try {
        const statusResponse = await plugin.checkStatus({
          transid: transaction.txnId,
        });

        if (statusResponse.status === 'SUCCESS') {
          await this._markRechargeSuccess(transaction, mapping);

          const pricing = JSON.parse(transaction.pricing || '{}');
          const providerMargin = pricing.providerMargin || 0;

          if (providerMargin > 0) {
            const [apiEntity] = await db
              .select({
                userId: apiEntityTable.userId,
                tenantId: apiEntityTable.tenantId,
                serviceProviderMappingId:
                  apiEntityTable.serviceProviderMappingId,
              })
              .from(apiEntityTable)
              .where(eq(apiEntityTable.id, transaction.apiEntityId))
              .limit(1);

            if (apiEntity) {
              const [userDetails] = await db
                .select({ roleId: usersTable.roleId })
                .from(usersTable)
                .where(eq(usersTable.id, apiEntity.userId))
                .limit(1);

              if (userDetails) {
                await this._processRechargeFinancials({
                  tenantId: apiEntity.tenantId,
                  userId: apiEntity.userId,
                  roleId: userDetails.roleId,
                  amount: paiseToRupees(transaction.amount),
                  providerMargin,
                  transactionId: transaction.id,
                  serviceProviderMappingId: apiEntity.serviceProviderMappingId,
                  serviceId: transaction.serviceId,
                  walletId: transaction.walletId,
                });
              }
            }
          }
        } else if (statusResponse.status === 'FAILED') {
          await this._markRechargeFailed(
            transaction,
            statusResponse.message || 'Provider failed',
          );
        }

        return {
          success: true,
          data: {
            transactionId: transaction.id,
            txnId: transaction.txnId,
            status: statusResponse.status,
            providerReference: transaction.providerReference,
            mobileNumber: JSON.parse(transaction.serviceData).mobileNumber,
            amount: Number(transaction.amount),
          },
        };
      } catch (error) {
        return {
          success: true,
          data: {
            transactionId: transaction.id,
            txnId: transaction.txnId,
            status: transaction.status,
            providerReference: transaction.providerReference,
            mobileNumber: JSON.parse(transaction.serviceData).mobileNumber,
            amount: Number(transaction.amount),
            message: 'Status check failed, returning cached status',
          },
        };
      }
    }

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        txnId: transaction.txnId,
        status: transaction.status,
        providerReference: transaction.providerReference,
        mobileNumber: JSON.parse(transaction.serviceData).mobileNumber,
        amount: Number(transaction.amount),
        completedAt: transaction.completedAt,
      },
    };
  }

  async handleCallback(payload) {
    const { status, opid, yourtransid, txnid, number, amount, message } =
      payload;

    const normalizedStatus = String(status).toUpperCase();

    const [transaction] = await db
      .select()
      .from(transactionTable)
      .where(eq(transactionTable.txnId, yourtransid))
      .limit(1);

    if (!transaction) {
      console.error(`Callback: Transaction not found: ${yourtransid}`);
      return { success: false, message: 'Transaction not found' };
    }

    if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
      return { success: true, message: 'Already processed' };
    }

    const wallet = await WalletService.getUserMainWallet(
      transaction.userId,
      transaction.tenantId,
    );

    const amountInPaise = Number(transaction.amount);

    const apiEntityUpdate = {
      status: normalizedStatus === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
      providerFinalData: JSON.stringify(payload),
      updatedAt: new Date(),
    };

    if (normalizedStatus === 'FAIL') {
      apiEntityUpdate.errorData = JSON.stringify({
        message: message || 'Provider failed',
      });
    }

    await db
      .update(apiEntityTable)
      .set(apiEntityUpdate)
      .where(eq(apiEntityTable.id, transaction.apiEntityId));

    if (normalizedStatus === 'SUCCESS') {
      await WalletService.debitBlockedAmount({
        walletId: wallet.id,
        amount: amountInPaise,
        transactionId: transaction.id,
        reference: opid || txnid,
      });

      await db
        .update(transactionTable)
        .set({
          status: 'SUCCESS',
          providerReference: String(opid || txnid),
          providerResponse: JSON.stringify(payload),
          completedAt: new Date(),
          processedAt: new Date(),
        })
        .where(eq(transactionTable.id, transaction.id));

      const pricing = JSON.parse(transaction.pricing || '{}');
      const providerMargin = pricing.providerMargin || 0;

      if (providerMargin > 0) {
        const [apiEntity] = await db
          .select({
            userId: apiEntityTable.userId,
            tenantId: apiEntityTable.tenantId,
            serviceProviderMappingId: apiEntityTable.serviceProviderMappingId,
          })
          .from(apiEntityTable)
          .where(eq(apiEntityTable.id, transaction.apiEntityId))
          .limit(1);

        if (apiEntity) {
          const [userDetails] = await db
            .select({ roleId: usersTable.roleId })
            .from(usersTable)
            .where(eq(usersTable.id, apiEntity.userId))
            .limit(1);

          if (userDetails) {
            await this._processRechargeFinancials({
              tenantId: apiEntity.tenantId,
              userId: apiEntity.userId,
              roleId: userDetails.roleId,
              amount: paiseToRupees(transaction.amount),
              providerMargin,
              transactionId: transaction.id,
              serviceProviderMappingId: apiEntity.serviceProviderMappingId,
              serviceId: transaction.serviceId,
              walletId: wallet.id,
            });
          }
        }
      }

      return { success: true, message: 'Recharge marked as success' };
    }

    if (normalizedStatus === 'FAIL') {
      await WalletService.releaseBlockedAmount({
        walletId: wallet.id,
        amount: amountInPaise,
        transactionId: transaction.id,
        reference: `${yourtransid}_CALLBACK_FAILED`,
      });

      await db
        .update(transactionTable)
        .set({
          status: 'FAILED',
          providerReference: String(opid || txnid || ''),
          providerResponse: JSON.stringify(payload),
          completedAt: new Date(),
        })
        .where(eq(transactionTable.id, transaction.id));

      return { success: true, message: 'Recharge marked as failed' };
    }

    return { success: false, message: `Unknown status: ${status}` };
  }

  async _validateMapping(serviceProviderMappingId) {
    const [mapping] = await db
      .select({
        id: ServiceProviderMappingTable.id,
        ServiceId: ServiceProviderMappingTable.ServiceId,
        ProviderId: ServiceProviderMappingTable.ProviderId,
        config: ServiceProviderMappingTable.config,
        isActive: ServiceProviderMappingTable.isActive,
        providerCode: ProviderTable.code,
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(eq(ServiceProviderMappingTable.id, serviceProviderMappingId))
      .limit(1);

    if (!mapping) {
      throw ApiError.badRequest('Service provider mapping not found');
    }

    if (!mapping.isActive) {
      throw ApiError.badRequest('Service provider mapping is inactive');
    }

    return mapping;
  }

  _transformPlans(plans) {
    if (!plans || !plans.records) return [];

    const result = [];

    for (const [category, planList] of Object.entries(plans.records)) {
      if (!Array.isArray(planList)) continue;

      for (const plan of planList) {
        result.push({
          planId: plan.plan_id || plan.id || plan.rs,
          amount: Number(plan.recharge_amount || plan.amount || plan.rs),
          validity: plan.recharge_validity || plan.validity || null,
          description:
            plan.recharge_short_desc || plan.description || plan.desc || null,
          talktime: plan.recharge_talktime || plan.talktime || '0',
          data: plan.recharge_data || plan.data || null,
          type: plan.plan_type || category,
          raw: plan,
        });
      }
    }

    return result;
  }

  async _processImmediateSuccess(
    transactionId,
    apiEntityId,
    walletId,
    rechargeResponse,
  ) {
    const now = new Date();

    const [transaction] = await db
      .select({ amount: transactionTable.amount })
      .from(transactionTable)
      .where(eq(transactionTable.id, transactionId));

    const amountInPaise = Number(transaction.amount);

    await WalletService.debitBlockedAmount({
      walletId: walletId,
      amount: amountInPaise,
      transactionId: transactionId,
      reference: rechargeResponse.transid,
    });

    await db
      .update(transactionTable)
      .set({
        status: 'SUCCESS',
        completedAt: now,
        processedAt: now,
        providerResponse: JSON.stringify(rechargeResponse),
      })
      .where(eq(transactionTable.id, transactionId));

    await db
      .update(apiEntityTable)
      .set({
        status: 'COMPLETED',
        providerFinalData: JSON.stringify(rechargeResponse),
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(apiEntityTable.id, apiEntityId));
  }

  async _processRechargeFinancials({
    tenantId,
    userId,
    roleId,
    amount,
    providerMargin = 0,
    transactionId,
    serviceProviderMappingId,
    serviceId,
    walletId,
  }) {
    try {
      const amountInPaise = rupeesToPaise(amount);

      const result = await TransactionProcessor.processSurchargeAndCommission({
        tenantId,
        userId,
        roleId,
        serviceProviderMappingId,
        transactionAmount: amountInPaise,
        providerMargin,
        transactionId,
        serviceId,
        walletId,
        skipSurcharge: true,
        skipCommission: false,
      });

      return result;
    } catch (error) {
      console.error('Financial processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  async _markRechargeSuccess(transaction, mapping) {
    const wallet = await WalletService.getUserMainWallet(
      transaction.userId,
      transaction.tenantId,
    );

    const amountInPaise = Number(transaction.amount);

    await WalletService.debitBlockedAmount({
      walletId: wallet.id,
      amount: amountInPaise,
      transactionId: transaction.id,
      reference: transaction.txnId,
    });

    await db
      .update(transactionTable)
      .set({
        status: 'SUCCESS',
        completedAt: new Date(),
        processedAt: new Date(),
      })
      .where(eq(transactionTable.id, transaction.id));
  }

  async _markRechargeFailed(transaction, reason) {
    const wallet = await WalletService.getUserMainWallet(
      transaction.userId,
      transaction.tenantId,
    );

    const amountInPaise = Number(transaction.amount);

    await WalletService.releaseBlockedAmount({
      walletId: wallet.id,
      amount: amountInPaise,
      transactionId: transaction.id,
      reference: `${transaction.txnId}_FAILED`,
    });

    await db
      .update(transactionTable)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        providerResponse: JSON.stringify({ failureReason: reason }),
      })
      .where(eq(transactionTable.id, transaction.id));
  }
}

export default new RechargeService();
