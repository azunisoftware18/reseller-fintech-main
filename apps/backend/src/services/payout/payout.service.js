import { db } from '../../database/core/core-db.js';
import { ApiError } from '../../lib/ApiError.js';
import { getPayoutPlugin } from '../../plugin_registry/payout/pluginRegistry.js';
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

class PayoutService {
  /**
   * Generate RBL-compliant TranID
   * RBL Requirement: Max 10 characters, alphanumeric only
   */
  _generateRblTranId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomInt(10, 100);
    return `PY${timestamp}${random}`.slice(0, 10);
  }

  /**
   * Validate amount based on RBL payment mode requirements
   * RBL Requirements:
   * - NEFT/IMPS: Minimum amount 1
   * - RTGS: Minimum amount 200,000
   * - FT: Minimum amount > 0
   * - Max 2 decimal places
   * - Max 50 Crores (without LEI)
   */
  _validateAmountByMode(amount, mode) {
    // Check for max 2 decimal places
    if (!Number.isInteger(amount * 100)) {
      throw ApiError.badRequest('Amount can have at most 2 decimal places');
    }

    // Mode-specific minimum amounts
    if (mode === 'RTGS' && amount < 200000) {
      throw ApiError.badRequest('RTGS minimum amount is ₹200,000');
    }
    if ((mode === 'NEFT' || mode === 'IMPS') && amount < 1) {
      throw ApiError.badRequest(`${mode} minimum amount is ₹1`);
    }
    if (mode === 'FT' && amount <= 0) {
      throw ApiError.badRequest('FT amount must be greater than 0');
    }

    // Maximum amount check (50 Crores = 500,000,000)
    if (amount > 500000000) {
      throw ApiError.badRequest(
        'Amount exceeds 50 Crores limit. LEI number required for larger amounts',
      );
    }
  }

  /**
   * Validate RBL-specific field requirements
   */
  _validateRblFields(data, mode) {
    // Account number validation (max 16 chars, alphanumeric)
    if (
      data.beneficiaryAccount &&
      !/^[a-zA-Z0-9]+$/.test(data.beneficiaryAccount)
    ) {
      throw ApiError.badRequest(
        'Beneficiary account number must be alphanumeric (no special characters)',
      );
    }

    if (data.beneficiaryAccount && data.beneficiaryAccount.length > 16) {
      throw ApiError.badRequest(
        'Beneficiary account number must be max 16 characters',
      );
    }

    // IFSC validation (max 15 chars, alphanumeric)
    if (data.beneficiaryIfsc && !/^[a-zA-Z0-9]+$/.test(data.beneficiaryIfsc)) {
      throw ApiError.badRequest(
        'IFSC code must be alphanumeric (no special characters)',
      );
    }

    if (data.beneficiaryIfsc && data.beneficiaryIfsc.length > 15) {
      throw ApiError.badRequest('IFSC code must be max 15 characters');
    }

    // Beneficiary name validation (max 50 chars)
    if (data.beneficiaryName && data.beneficiaryName.length > 50) {
      throw ApiError.badRequest('Beneficiary name must be max 50 characters');
    }

    // Beneficiary bank name validation (max 100 chars)
    if (data.beneficiaryBankName && data.beneficiaryBankName.length > 100) {
      throw ApiError.badRequest(
        'Beneficiary bank name must be max 100 characters',
      );
    }

    // Optional: allow only alphabets, numbers, spaces
    if (
      data.beneficiaryBankName &&
      !/^[a-zA-Z0-9\s.&-]+$/.test(data.beneficiaryBankName)
    ) {
      throw ApiError.badRequest(
        'Beneficiary bank name contains invalid characters',
      );
    }

    // Beneficiary mobile validation (exactly 10 digits)
    if (data.beneficiaryMobile && !/^\d{10}$/.test(data.beneficiaryMobile)) {
      throw ApiError.badRequest(
        'Beneficiary mobile number must be exactly 10 digits',
      );
    }

    // Remarks validation (max 50 chars, no special characters for NEFT/RTGS/IMPS)
    if (data.remarks && mode !== 'FT') {
      if (data.remarks.length > 50) {
        throw ApiError.badRequest('Remarks must be max 50 characters');
      }

      if (!/^[a-zA-Z0-9\s]+$/.test(data.remarks)) {
        throw ApiError.badRequest(
          'Remarks cannot contain special characters for NEFT/RTGS/IMPS',
        );
      }
    }

    // // IMPS-specific validations
    // if (mode === 'IMPS') {
    //   if (data.debitMobile && !/^\d{10}$/.test(data.debitMobile)) {
    //     throw ApiError.badRequest(
    //       'Debit mobile number must be exactly 10 digits',
    //     );
    //   }
    // }
  }

  /**
   * Validate service provider mapping
   */
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

  /**
   * Process immediate success (for FT and instant transactions)
   */
  async _processImmediateSuccess(
    transactionId,
    apiEntityId,
    walletId,
    payoutResponse,
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
      reference:
        payoutResponse.utrNo || payoutResponse.rrn || payoutResponse.refNo,
    });

    // Update transaction with RBL-specific fields stored in serviceData
    const serviceData = {
      ...JSON.parse(transaction.serviceData || '{}'),
      utrNo: payoutResponse.utrNo,
      rrn: payoutResponse.rrn,
      providerReference: payoutResponse.providerReference,
    };

    await db
      .update(transactionTable)
      .set({
        status: 'SUCCESS',
        completedAt: now,
        processedAt: now,
        providerResponse: JSON.stringify(payoutResponse),
        providerReference: payoutResponse.providerReference,
        serviceData: JSON.stringify(serviceData),
        lastStatusCheckAt: now,
      })
      .where(eq(transactionTable.id, transactionId));

    await db
      .update(apiEntityTable)
      .set({
        status: 'COMPLETED',
        providerFinalData: JSON.stringify(payoutResponse),
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(apiEntityTable.id, apiEntityId));
  }

  /**
   * Process payout financials (commission, surcharge, etc.)
   */
  async _processPayoutFinancials({
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
      console.error('Payout financial processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark payout as success and update wallet
   */
  async _markPayoutSuccess(transaction, mapping, payoutResponse = null) {
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

    // Parse existing serviceData
    const serviceData = JSON.parse(transaction.serviceData || '{}');

    // Update serviceData with RBL-specific fields
    if (payoutResponse) {
      if (payoutResponse.utrNo) serviceData.utrNo = payoutResponse.utrNo;
      if (payoutResponse.rrn) serviceData.rrn = payoutResponse.rrn;
      if (payoutResponse.providerReference)
        serviceData.providerReference = payoutResponse.providerReference;
      if (payoutResponse.paymentStatus)
        serviceData.paymentStatus = payoutResponse.paymentStatus;
    }

    await db
      .update(transactionTable)
      .set({
        status: 'SUCCESS',
        completedAt: new Date(),
        processedAt: new Date(),
        lastStatusCheckAt: new Date(),
        providerReference:
          payoutResponse?.providerReference || transaction.providerReference,
        serviceData: JSON.stringify(serviceData),
        providerResponse: payoutResponse
          ? JSON.stringify(payoutResponse)
          : transaction.providerResponse,
      })
      .where(eq(transactionTable.id, transaction.id));
  }

  /**
   * Mark payout as failed and release blocked amount
   */
  async _markPayoutFailed(transaction, reason) {
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
        lastStatusCheckAt: new Date(),
        providerResponse: JSON.stringify({ failureReason: reason }),
      })
      .where(eq(transactionTable.id, transaction.id));

    await db
      .update(apiEntityTable)
      .set({
        status: 'FAILED',
        errorData: JSON.stringify({ message: reason }),
        updatedAt: new Date(),
      })
      .where(eq(apiEntityTable.id, transaction.apiEntityId));
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Perform payout via RBL API
   *
   * RBL Requirements:
   * - NEFT timing: 6:00 AM to 6:15 PM
   * - RTGS timing: 6:00 AM to 6:15 PM
   * - IMPS timing: 24x7
   * - FT timing: 24x7 (RBL to RBL transfers)
   */
  async performPayout(
    {
      beneficiaryAccount,
      beneficiaryIfsc,
      beneficiaryName,
      amount,
      mode,
      serviceProviderMappingId,
      remarks,
      beneficiaryBankName,
      beneficiaryMobile,
    },
    user,
  ) {
    // Validate amount based on mode
    this._validateAmountByMode(amount, mode);

    // Validate RBL-specific field requirements
    this._validateRblFields(
      {
        beneficiaryAccount,
        beneficiaryIfsc,
        beneficiaryName,
        remarks,
        beneficiaryBankName,
        beneficiaryMobile,
      },
      mode,
    );

    // Get user's main wallet
    const wallet = await WalletService.getUserMainWallet(
      user.id,
      user.tenantId,
    );
    const amountInPaise = rupeesToPaise(amount);
    await WalletService.validateWalletBalance(wallet.id, amountInPaise);

    // Validate service provider mapping
    const mapping = await this._validateMapping(serviceProviderMappingId);

    // Generate required IDs
    const txnId = this._generateRblTranId();
    const idempotencyKey = crypto.randomUUID();
    const apiEntityId = crypto.randomUUID();
    const orgTransactionId = crypto.randomUUID();
    const now = new Date();

    // Create API entity record
    await db.insert(apiEntityTable).values({
      id: apiEntityId,
      tenantId: user.tenantId,
      reference: txnId,
      userId: user.id,
      serviceProviderMappingId,
      status: 'PENDING',
      requestPayload: JSON.stringify({
        beneficiaryAccount,
        beneficiaryIfsc,
        beneficiaryName,
        amount,
        mode,
        remarks,
        orgTransactionId,
        beneficiaryBankName,
        beneficiaryMobile,
      }),
      createdAt: now,
      updatedAt: now,
    });

    // Block amount in wallet
    await WalletService.blockAmount({
      walletId: wallet.id,
      amount: amountInPaise,
      apiEntityId: apiEntityId,
      reference: txnId,
    });

    // Create transaction record
    const transactionId = crypto.randomUUID();

    // Prepare serviceData JSON
    const serviceData = {
      beneficiaryAccount,
      beneficiaryIfsc,
      beneficiaryName,
      beneficiaryBankName,
      beneficiaryMobile,
      mode,
      remarks,
      orgTransactionId,
    };

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
      serviceType: 'PAYOUT',
      serviceData: JSON.stringify(serviceData),
      initiatedAt: now,
      lastStatusCheckAt: now,
    });

    let payoutResponse;
    try {
      const plugin = getPayoutPlugin(mapping.providerCode, mapping.config);

      // Call RBL plugin
      payoutResponse = await plugin.payout({
        tranId: txnId,
        orgTransactionId,
        amount,
        beneficiaryAccount,
        beneficiaryIfsc,
        beneficiaryName,
        beneficiaryBankName,
        beneficiaryMobile,
        mode,
        remarks: remarks || '',
      });

      const providerStatus = String(payoutResponse.status || '').toUpperCase();
      const providerRef = payoutResponse.providerReference;

      // Update provider reference
      if (providerRef) {
        await db
          .update(transactionTable)
          .set({ providerReference: String(providerRef) })
          .where(eq(transactionTable.id, transactionId));
      }

      // Handle FAILURE response
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
            providerInitData: JSON.stringify(payoutResponse),
            errorData: JSON.stringify({
              message: payoutResponse.statusDesc || 'Provider rejected request',
            }),
            updatedAt: new Date(),
          })
          .where(eq(apiEntityTable.id, apiEntityId));

        await db
          .update(transactionTable)
          .set({
            status: 'FAILED',
            completedAt: new Date(),
            providerResponse: JSON.stringify(payoutResponse),
            lastStatusCheckAt: new Date(),
          })
          .where(eq(transactionTable.id, transactionId));

        throw ApiError.badRequest(
          `Payout failed: ${payoutResponse.statusDesc || 'Provider error'}`,
        );
      }

      // Handle SUCCESS response (FT transactions are immediate)
      if (providerStatus === 'SUCCESS') {
        await db
          .update(apiEntityTable)
          .set({
            status: 'COMPLETED',
            providerInitData: JSON.stringify(payoutResponse),
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(apiEntityTable.id, apiEntityId));

        await this._processImmediateSuccess(
          transactionId,
          apiEntityId,
          wallet.id,
          payoutResponse,
        );

        const providerMargin = payoutResponse.margin || 0;

        // Update serviceData with UTR/RRN
        const updatedServiceData = {
          ...serviceData,
          utrNo: payoutResponse.utrNo,
          rrn: payoutResponse.rrn,
        };

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
            serviceData: JSON.stringify(updatedServiceData),
          })
          .where(eq(transactionTable.id, transactionId));

        await this._processPayoutFinancials({
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
              payoutResponse.statusDesc || 'Payout completed successfully',
            beneficiaryAccount,
            beneficiaryName,
            amount,
            mode,
            providerReference: String(providerRef),
            utrNo: payoutResponse.utrNo,
            rrn: payoutResponse.rrn,
          },
        };
      }

      // Handle PENDING / PROCESSING response (NEFT/RTGS/IMPS)
      await db
        .update(apiEntityTable)
        .set({
          status: 'PROCESSING',
          providerInitData: JSON.stringify(payoutResponse),
          updatedAt: new Date(),
        })
        .where(eq(apiEntityTable.id, apiEntityId));

      return {
        success: true,
        data: {
          transactionId,
          txnId,
          status: 'PENDING',
          message: payoutResponse.statusDesc || 'Payout initiated successfully',
          beneficiaryAccount,
          beneficiaryName,
          amount,
          mode,
          providerReference: String(providerRef),
          utrNo: payoutResponse.utrNo,
          rrn: payoutResponse.rrn,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Release blocked amount on error
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
          lastStatusCheckAt: new Date(),
        })
        .where(eq(transactionTable.id, transactionId));

      console.log(
        JSON.stringify(
          {
            fullUrl: `${error?.config?.baseURL || ''}${error?.config?.url || ''}`,

            method: error?.config?.method,

            config: {
              baseURL: error?.config?.baseURL,
              url: error?.config?.url,
              timeout: error?.config?.timeout,
              params: error?.config?.params,
              auth: error?.config?.auth,
            },

            headers: error?.config?.headers,

            body: JSON.parse(error?.config?.data || '{}'),

            response: {
              status: error?.response?.status,
              statusText: error?.response?.statusText,
              headers: error?.response?.headers,
              data: error?.response?.data,
            },
          },
          null,
          2,
        ),
      );
      throw ApiError.internal(`Payout failed: ${error.message}`);
    }
  }

  /**
   * Get payout history with filters
   */
  async getHistory(query, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const status = query.status === 'ALL' ? null : query.status;

    const conditions = [
      eq(transactionTable.userId, user.id),
      eq(transactionTable.tenantId, user.tenantId),
      eq(transactionTable.serviceType, 'PAYOUT'),
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

    if (query.beneficiaryAccount) {
      conditions.push(
        like(transactionTable.serviceData, `%${query.beneficiaryAccount}%`),
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

    // Get total count
    const [{ total }] = await db
      .select({ total: sql`COUNT(*)`.mapWith(Number) })
      .from(transactionTable)
      .where(and(...conditions));

    // Get statistics
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
          eq(transactionTable.serviceType, 'PAYOUT'),
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
        amount: Number(row.totalAmount) || 0,
      };
    });

    // Get transactions
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
        beneficiaryAccount: serviceData.beneficiaryAccount,
        beneficiaryIfsc: serviceData.beneficiaryIfsc,
        beneficiaryName: serviceData.beneficiaryName,
        mode: serviceData.mode,
        amount: paiseToRupees(Number(tx.amount)),
        netAmount: paiseToRupees(Number(tx.netAmount)),
        status: tx.status,
        providerReference: tx.providerReference,
        utrNo: serviceData.utrNo,
        rrn: serviceData.rrn,
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

  /**
   * Get single payout details
   */
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
          eq(transactionTable.serviceType, 'PAYOUT'),
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
        beneficiaryAccount: serviceData.beneficiaryAccount,
        beneficiaryIfsc: serviceData.beneficiaryIfsc,
        beneficiaryName: serviceData.beneficiaryName,
        mode: serviceData.mode,
        remarks: serviceData.remarks,
        amount: paiseToRupees(Number(transaction.amount)),
        netAmount: paiseToRupees(Number(transaction.netAmount)),
        status: transaction.status,
        providerReference: transaction.providerReference,
        utrNo: serviceData.utrNo,
        rrn: serviceData.rrn,
        paymentStatus: serviceData.paymentStatus,
        serviceName: transaction.serviceName,
        providerName: transaction.providerName,
        pricing: {
          baseAmount:
            pricing.baseAmount || paiseToRupees(Number(transaction.amount)),
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

  /**
   * Check payout status via RBL Status API
   *
   * RBL Recommendations:
   * - Time gap between Payment API & Status Check API: 15-20 min
   * - For IMPS Deemed Success (PaymentStatus 9): Check every 6 hours
   * - For NEFT/RTGS In Progress: Check every 2.5-3 hours
   */
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

    // Return immediately if transaction is in terminal state
    if (['SUCCESS', 'FAILED', 'REFUNDED'].includes(transaction.status)) {
      const serviceData = JSON.parse(transaction.serviceData || '{}');

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          txnId: transaction.txnId,
          status: transaction.status,
          providerReference: transaction.providerReference,
          utrNo: serviceData.utrNo,
          rrn: serviceData.rrn,
          amount: paiseToRupees(Number(transaction.amount)),
          completedAt: transaction.completedAt,
        },
      };
    }

    // For pending/processing transactions, query RBL
    const mapping = await this._validateMapping(
      transaction.serviceProviderMappingId,
    );
    const plugin = getPayoutPlugin(mapping.providerCode, mapping.config);
    const serviceData = JSON.parse(transaction.serviceData || '{}');
    const hoursSinceInitiation =
      (Date.now() - new Date(transaction.initiatedAt).getTime()) /
      (1000 * 60 * 60);

    try {
      const statusResponse = await plugin.checkStatus({
        refNo: transaction.providerReference,
        orgTransactionId: serviceData.orgTransactionId,
        utrNo: serviceData.utrNo,
        rrn: serviceData.rrn,
      });

      // Handle IMPS Deemed Success (PaymentStatus 9)
      // RBL recommends checking every 6 hours for deemed success cases
      if (statusResponse.paymentStatus === '9') {
        if (hoursSinceInitiation < 6) {
          await db
            .update(transactionTable)
            .set({ lastStatusCheckAt: new Date() })
            .where(eq(transactionTable.id, transaction.id));

          return {
            success: true,
            data: {
              transactionId: transaction.id,
              txnId: transaction.txnId,
              status: 'PENDING',
              providerReference: transaction.providerReference,
              amount: paiseToRupees(Number(transaction.amount)),
              paymentStatus: '9',
              message:
                'Transaction is in deemed success state. Awaiting confirmation from NPCI. Please check back after 6 hours.',
            },
          };
        }
      }

      // Handle NEFT/RTGS In Progress
      // RBL recommends checking every 2.5-3 hours for in-progress cases
      if (statusResponse.status === 'PROCESSING') {
        if (hoursSinceInitiation < 2.5) {
          await db
            .update(transactionTable)
            .set({ lastStatusCheckAt: new Date() })
            .where(eq(transactionTable.id, transaction.id));

          return {
            success: true,
            data: {
              transactionId: transaction.id,
              txnId: transaction.txnId,
              status: 'PROCESSING',
              providerReference: transaction.providerReference,
              amount: paiseToRupees(Number(transaction.amount)),
              message:
                'Transaction is being processed. Please check back after 2.5 hours.',
            },
          };
        }
      }

      // Update transaction based on status
      if (statusResponse.status === 'SUCCESS') {
        await this._markPayoutSuccess(transaction, mapping, statusResponse);
      } else if (statusResponse.status === 'FAILED') {
        await this._markPayoutFailed(
          transaction,
          statusResponse.statusDesc || 'Provider failed',
        );
      } else {
        // Update last status check time
        await db
          .update(transactionTable)
          .set({ lastStatusCheckAt: new Date() })
          .where(eq(transactionTable.id, transaction.id));
      }

      // Get updated transaction
      const [updatedTransaction] = await db
        .select()
        .from(transactionTable)
        .where(eq(transactionTable.id, transaction.id))
        .limit(1);

      const updatedServiceData = JSON.parse(
        updatedTransaction.serviceData || '{}',
      );

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          txnId: transaction.txnId,
          status: updatedTransaction.status,
          providerReference: updatedTransaction.providerReference,
          utrNo: updatedServiceData.utrNo,
          rrn: updatedServiceData.rrn,
          amount: paiseToRupees(Number(updatedTransaction.amount)),
          statusDesc: statusResponse.statusDesc,
          paymentStatus: statusResponse.paymentStatus,
          completedAt: updatedTransaction.completedAt,
        },
      };
    } catch (error) {
      // Handle RBL-specific error codes
      if (error.message?.includes('ER009')) {
        throw ApiError.notFound(
          'Transaction reference not found. Please verify the transaction ID.',
        );
      }
      if (
        error.message?.includes('ER010') ||
        error.message?.includes('ER011')
      ) {
        throw ApiError.notFound('Transaction not found in RBL system');
      }

      // Log error but return cached status
      console.error('Status check error:', error.message);

      await db
        .update(transactionTable)
        .set({ lastStatusCheckAt: new Date() })
        .where(eq(transactionTable.id, transaction.id));

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          txnId: transaction.txnId,
          status: transaction.status,
          providerReference: transaction.providerReference,
          amount: paiseToRupees(Number(transaction.amount)),
          message:
            'Status check temporarily failed, returning cached status. Please try again later.',
        },
      };
    }
  }
}

export default new PayoutService();
