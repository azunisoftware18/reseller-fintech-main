import axios from 'axios';
import RblPayoutPluginInterface from './rbl.interface.js';
import { ApiError } from '../../lib/ApiError.js';

/**
 * RBL Bank Single Payment Corp Plugin
 * Supports: NEFT, RTGS, IMPS, FT
 *
 * NEW APIs:
 * - Account Statement Date Range API: /cs/statement
 * - Account Balance Inquiry API: /accounts/balance/query
 *
 * RBL API Documentation Reference:
 * - Single Payment API: RBLBank_API_SinglePayment_V1.03 copy.docx
 * - Status API: RBLBank_API_SinglePayment_Status_V1.03 (4).docx
 * - Account Statement API: api_specification_-_acc_stmt_date_range_v2.4_0.docx
 * - Account Balance API: Account Balance API.docx
 *
 * Important Notes from RBL Docs:
 * - Client_id and Client_secret must NOT have spaces before/after
 * - Request type must be application/json
 * - Basic Authorization with LDAP credentials
 * - All tags are mandatory in request as stated in documentation
 * - For NEFT/RTGS minimum amount: RTGS = 200000, NEFT/IMPS = 1
 * - For RBL to RBL transfers, use FT mode with RBL IFSC
 *
 * Config expected from ServiceProviderMappingTable.config:
 * {
 *   baseUrl?: string, // Default: 'https://gateway.rbl.bank.in'
 *   ldapUser: string, // Basic Auth username
 *   ldapPass: string, // Basic Auth password
 *   clientId: string, // Portal generated Client ID (no spaces)
 *   clientSecret: string, // Portal generated Client Secret (no spaces)
 *   corpId: string, // RBL assigned Corp ID (4-20 chars, alphanumeric)
 *   makerId?: string, // Optional, based on corporate onboarding
 *   checkerId?: string, // Optional, based on corporate onboarding
 *   approverId?: string, // Optional, based on corporate onboarding (USED for Statement & Balance APIs)
 *   debitAccountNumber: string, // Debit account number (max 16 chars)
 *   debitAccountName?: string, // Optional debit account holder name
 *   debitIfsc?: string // Required for IMPS only
 * }
 */
class RblPayoutPlugin extends RblPayoutPluginInterface {
  constructor(config) {
    super(config);

    // Validate required config
    if (!config.ldapUser || !config.ldapPass) {
      throw new Error('RBL Plugin: LDAP credentials are required');
    }
    if (!config.clientId || !config.clientSecret) {
      throw new Error('RBL Plugin: Client ID and Secret are required');
    }
    if (!config.corpId) {
      throw new Error('RBL Plugin: Corp ID is required');
    }
    if (!config.debitAccountNumber) {
      throw new Error('RBL Plugin: Debit Account Number is required');
    }

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://gateway.rbl.bank.in',

      timeout: 190000, // RBL recommends 190 sec timeout (IMPS can take 130 sec)
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: config.ldapUser,
        password: config.ldapPass,
      },
    });
  }

  /**
   * Initiate payout based on RBL Single Payment API
   * API Endpoint: /payments/corp/payment
   *
   * According to RBL docs:
   * - NEFT timing: 6:00 AM to 6:15 PM
   * - RTGS timing: 6:00 AM to 6:15 PM
   * - IMPS timing: 24x7
   * - FT timing: 24x7 (RBL to RBL transfers)
   */
  async payout({
    tranId,
    orgTransactionId,
    amount,
    beneficiaryAccount,
    beneficiaryIfsc,
    beneficiaryName,
    beneficiaryBankName,
    beneficiaryMobile,
    mode,
    remarks,
  }) {
    // Validate amount based on mode
    this._validateAmountByMode(amount, mode);

    // Generate required IDs
    const refNo = `SP${this.config.corpId}${orgTransactionId}`;

    // Build payload according to RBL spec
    const payload = {
      Single_Payment_Corp_Req: {
        Header: {
          TranID: tranId,
          Corp_ID: this.config.corpId,
          Maker_ID: this.config.makerId || '',
          Checker_ID: this.config.checkerId || '',
          Approver_ID: this.config.approverId || '',
        },
        Body: this._buildRequestBody({
          tranId,
          orgTransactionId,
          refNo,
          amount,
          beneficiaryAccount,
          beneficiaryIfsc,
          beneficiaryName,
          beneficiaryBankName,
          beneficiaryMobile,
          mode,
          remarks,
        }),
        Signature: {
          Signature: 'Signature',
        },
      },
    };

    const params = {
      client_id: this.config.clientId.trim(),
      client_secret: this.config.clientSecret.trim(),
    };

    try {
      const res = await this.client.post('/payments/corp/payment', payload, {
        params,
      });
      return this._normalizePayoutResponse(res.data, {
        refNo,
        orgTransactionId,
      });
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        // Handle HTTP error responses
        if (errorData.httpCode === '400') {
          throw ApiError.badRequest(
            `RBL Schema Error: ${errorData.moreInformation || 'Invalid request format'}`,
          );
        }
        if (errorData.httpCode === '401') {
          throw ApiError.unauthorized(
            `RBL Auth Error: ${errorData.httpMessage || 'Authentication failed'}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Build request body based on payment mode
   * According to RBL docs, different modes have different mandatory fields
   */
  _buildRequestBody({
    tranId,
    orgTransactionId,
    refNo,
    amount,
    beneficiaryAccount,
    beneficiaryIfsc,
    beneficiaryName,
    beneficiaryBankName,
    beneficiaryMobile,
    mode,
    remarks,
  }) {
    const baseBody = {
      OrgTransactionID: orgTransactionId,
      RefNo: refNo,
      Amount: String(amount),
      Debit_Acct_No: this.config.debitAccountNumber,
      Debit_Acct_Name: this.config.debitAccountName,
      Ben_Acct_No: beneficiaryAccount,
      Ben_Name: beneficiaryName,
      Mode_of_Pay: mode,
    };

    // Add mode-specific mandatory fields
    switch (mode) {
      case 'NEFT':
      case 'RTGS':
        baseBody.Ben_IFSC = beneficiaryIfsc;
        baseBody.Remarks = remarks || '';
        baseBody.Debit_TrnParticulars = remarks || 'NEFT/RTGS Payment';
        break;

      case 'IMPS':
        baseBody.Ben_IFSC = beneficiaryIfsc;
        baseBody.Remarks = remarks || '';
        baseBody.Ben_BankName = beneficiaryBankName;
        baseBody.Debit_IFSC = this.config.debitIfsc; // Required for IMPS
        baseBody.Debit_Mobile = this.config.debitMobile || ''; // Required for IMPS
        baseBody.Ben_Mobile = beneficiaryMobile;
        break;

      case 'FT': // Fund Transfer (RBL to RBL)
        baseBody.Ben_IFSC = beneficiaryIfsc;
        baseBody.Debit_TrnParticulars = remarks || 'FT Payment';
        baseBody.Ben_TrnParticulars = remarks || 'FT Payment';
        break;

      default:
        throw ApiError.badRequest(`Unsupported payment mode: ${mode}`);
    }

    return baseBody;
  }

  /**
   * Validate amount based on payment mode
   * According to RBL docs:
   * - NEFT/IMPS: min 1
   * - RTGS: min 200000
   * - FT: min > 0
   */
  _validateAmountByMode(amount, mode) {
    if (mode === 'RTGS' && amount < 200000) {
      throw ApiError.badRequest('RTGS minimum amount is 200,000');
    }
    if ((mode === 'NEFT' || mode === 'IMPS') && amount < 1) {
      throw ApiError.badRequest(`${mode} minimum amount is 1`);
    }
    if (mode === 'FT' && amount <= 0) {
      throw ApiError.badRequest('FT amount must be greater than 0');
    }
    if (amount > 500000000) {
      // 50 Crores
      throw ApiError.badRequest(
        'Amount exceeds 50 Crores limit. LEI number required for larger amounts',
      );
    }
  }

  /**
   * Check payout status using RBL Status API
   * API Endpoint: /payments/corp/payment/query
   *
   * According to RBL docs:
   * - Time gap between Payment API & Status Check API should be 15-20 min
   * - For IMPS deemed success (status 9), check every 6 hours
   * - For NEFT/RTGS InProgress, check every 2.5-3 hours
   */
  async checkStatus({ refNo, utrNo, rrn, orgTransactionId }) {
    const params = {
      client_id: this.config.clientId.trim(),
      client_secret: this.config.clientSecret.trim(),
    };

    const body = {};
    if (utrNo) body.UTRNo = utrNo;
    if (rrn) body.RRN = rrn;
    if (refNo) body.RefNo = refNo;
    if (orgTransactionId) body.OrgTransactionID = orgTransactionId;

    // At least one identifier is required
    if (Object.keys(body).length === 0) {
      throw ApiError.badRequest(
        'At least one identifier (refNo, utrNo, rrn, orgTransactionId) is required',
      );
    }

    const payload = {
      get_Single_Payment_Status_Corp_Req: {
        Header: {
          TranID: `STS${Date.now()}`,
          Corp_ID: this.config.corpId,
          Maker_ID: this.config.makerId || '',
          Checker_ID: this.config.checkerId || '',
          Approver_ID: this.config.approverId || '',
        },
        Body: body,
        Signature: { Signature: 'Signature' },
      },
    };

    try {
      const res = await this.client.post(
        '/payments/corp/payment/query',
        payload,
        { params },
      );
      return this._normalizeStatusResponse(res.data);
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.httpCode === '400') {
          throw ApiError.badRequest(
            `RBL Status Error: ${errorData.moreInformation}`,
          );
        }
        if (errorData.httpCode === '401') {
          throw ApiError.unauthorized(
            `RBL Auth Error: ${errorData.httpMessage}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * ============================================================
   * Account Balance Inquiry API
   * ============================================================
   *
   * Get account balance for a particular Account Number.
   *
   * API Endpoint: /accounts/balance/query
   * Uses SAME baseUrl as payout/status APIs.
   *
   * According to RBL docs:
   * - Mandatory field: AcctId (Account Number)
   * - Returns effective available balance with currency code
   */
  async getAccountBalance({ accountNumber }) {
    if (!accountNumber) {
      throw ApiError.badRequest('Account number (AcctId) is required');
    }

    const params = {
      client_id: this.config.clientId.trim(),
      client_secret: this.config.clientSecret.trim(),
    };

    const payload = {
      getAccountBalanceReq: {
        Header: {
          TranID: `BAL${Date.now()}`,
          Corp_ID: this.config.corpId,
          Approver_ID: this.config.approverId || '',
        },
        Body: {
          AcctId: accountNumber,
        },
        Signature: {
          Signature: 'Signature',
        },
      },
    };

    try {
      const res = await this.client.post('/accounts/balance/query', payload, {
        params,
      });
      return this._normalizeBalanceResponse(res.data);
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.httpCode === '400') {
          throw ApiError.badRequest(
            `RBL Balance Schema Error: ${errorData.moreInformation || 'Invalid request format'}`,
          );
        }
        if (errorData.httpCode === '401') {
          throw ApiError.unauthorized(
            `RBL Balance Auth Error: ${errorData.httpMessage || 'Authentication failed'}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * ============================================================
   * Account Statement Date Range API
   * ============================================================
   *
   * Get account statement for a specified date range.
   * Supports: Debit (D), Credit (C), or Both (B) transactions.
   *
   * API Endpoint: /cs/statement
   * Uses SAME baseUrl as payout/status APIs.
   *
   * According to RBL docs:
   * - Mandatory fields: Acc_No, Tran_Type, From_Dt, To_Dt
   * - Supports pagination via Pagination_Details (last transaction data)
   * - hasMoreData: 'Y' means more pages available
   *
   * @returns {Object} Normalized response with nextPaginationDetails
   *                   (auto-built if hasMoreData=true, null otherwise)
   */
  async getAccountStatement({
    accountNumber,
    tranType = 'B',
    fromDate,
    toDate,
    paginationDetails = null,
  }) {
    // Validate required params per RBL spec
    if (!accountNumber) {
      throw ApiError.badRequest('Account number (Acc_No) is required');
    }
    if (!fromDate || !toDate) {
      throw ApiError.badRequest(
        'From date (From_Dt) and To date (To_Dt) are required',
      );
    }
    if (!['D', 'C', 'B'].includes(tranType)) {
      throw ApiError.badRequest(
        'Tran_Type must be D (Debit), C (Credit), or B (Both)',
      );
    }

    const params = {
      client_id: this.config.clientId.trim(),
      client_secret: this.config.clientSecret.trim(),
    };

    const body = {
      Acc_No: accountNumber,
      Tran_Type: tranType,
      From_Dt: fromDate,
      To_Dt: toDate,
    };

    // Add pagination details for subsequent calls (when hasMoreData = 'Y')
    if (paginationDetails) {
      body.Pagination_Details = paginationDetails;
    }

    const payload = {
      Acc_Stmt_DtRng_Req: {
        Header: {
          TranID: `STM${Date.now()}`,
          Corp_ID: this.config.corpId,
          Approver_ID: this.config.approverId || '',
        },
        Body: body,
        Signature: {
          Signature: 'Signature',
        },
      },
    };

    try {
      // Uses SAME baseUrl via this.client (config.baseUrl || 'https://gateway.rbl.bank.in')
      const res = await this.client.post('/cs/statement', payload, { params });
      return this._normalizeStatementResponse(res.data);
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.httpCode === '400') {
          throw ApiError.badRequest(
            `RBL Statement Schema Error: ${errorData.moreInformation || 'Invalid request format'}`,
          );
        }
        if (errorData.httpCode === '401') {
          throw ApiError.unauthorized(
            `RBL Statement Auth Error: ${errorData.httpMessage || 'Authentication failed'}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Fetch COMPLETE account statement — auto-paginates through all pages.
   *
   * @param {Object} options - Same as getAccountStatement (WITHOUT paginationDetails)
   * @param {Object} options.accountNumber - Account number
   * @param {string} options.tranType - D/C/B
   * @param {string} options.fromDate - YYYY-MM-DD
   * @param {string} options.toDate - YYYY-MM-DD
   * @returns {Object} Merged response with ALL transactions and final balances
   *
   * Usage:
   * const fullStmt = await plugin.getAccountStatementAll({
   *   accountNumber: '1008810030000236',
   *   tranType: 'B',
   *   fromDate: '2024-01-01',
   *   toDate: '2024-01-31',
   * });
   * console.log(fullStmt.transactions); // All pages combined
   */
  async getAccountStatementAll({
    accountNumber,
    tranType = 'B',
    fromDate,
    toDate,
  }) {
    let allTransactions = [];
    let paginationDetails = null;
    let pageCount = 0;
    const MAX_PAGES = 50; // Safety limit to prevent infinite loops

    do {
      pageCount++;
      if (pageCount > MAX_PAGES) {
        throw ApiError.internal(
          `Statement pagination exceeded maximum ${MAX_PAGES} pages. Possible infinite loop.`,
        );
      }

      const page = await this.getAccountStatement({
        accountNumber,
        tranType,
        fromDate,
        toDate,
        paginationDetails,
      });

      // Append transactions
      if (page.transactions && page.transactions.length > 0) {
        allTransactions = allTransactions.concat(page.transactions);
      }

      // Prepare next page if needed
      if (page.hasMoreData && page.transactions.length > 0) {
        const lastTxn = page.transactions[page.transactions.length - 1];
        paginationDetails = this._buildPaginationDetails(lastTxn);
      } else {
        paginationDetails = null;
      }

      // On first page, capture balances; subsequent pages keep first page balances
      if (pageCount === 1) {
        var firstPageBalances = page.accountBalances;
        var firstPageMeta = {
          status: page.status,
          transactionId: page.transactionId,
          corpId: page.corpId,
          approverId: page.approverId,
        };
      }
    } while (paginationDetails !== null);

    return {
      ...firstPageMeta,
      accountBalances: firstPageBalances,
      transactions: allTransactions,
      totalTransactions: allTransactions.length,
      pagesFetched: pageCount,
      hasMoreData: false,
      raw: null, // Too large to merge raw responses, set null or keep array if needed
    };
  }

  /**
   * Build pagination details from the last transaction of previous response.
   * Used INTERNALLY by getAccountStatementAll() and getAccountStatement().
   *
   * @param {Object} lastTransaction - Last transaction from previous response
   * @returns {Object} Pagination_Details object for next request
   */
  _buildPaginationDetails(lastTransaction) {
    if (!lastTransaction) return null;

    return {
      Last_Balance: {
        Amount_Value: lastTransaction.txnBalance?.amountValue || '',
        Currency_Code: lastTransaction.txnBalance?.currencyCode || '',
      },
      Last_Pstd_Date: lastTransaction.pstdDate || '',
      Last_Txn_Date: lastTransaction.transactionSummary?.txnDate || '',
      Last_Txn_Id: lastTransaction.txnId || '',
      Last_Txn_SrlNo: lastTransaction.txnSrlNo || '',
    };
  }

  /**
   * Normalize payout response according to RBL documentation
   */
  _normalizePayoutResponse(data, { refNo, orgTransactionId }) {
    const responseKey = Object.keys(data).find((k) =>
      k.includes('Single_Payment_Corp_Resp'),
    );
    const response = data[responseKey] || data;
    const header = response?.Header || {};
    const body = response?.Body || {};

    // Check for RBL header-level failure
    if (header.Status === 'FAILED') {
      throw ApiError.badRequest(
        `RBL Error [${header.Error_Cde || 'N/A'}]: ${header.Error_Desc || 'Unknown error'}`,
      );
    }

    // Map RBL status to internal status
    const rblStatus = header.Status?.toUpperCase() || '';
    let internalStatus = 'PENDING';

    if (rblStatus === 'SUCCESS') {
      internalStatus = 'SUCCESS';
    } else if (rblStatus === 'FAILED') {
      internalStatus = 'FAILED';
    } else if (rblStatus === 'INITIATED' || rblStatus === 'ON HOLD') {
      internalStatus = 'PENDING';
    }

    // Extract provider reference
    const providerRef = body.UTRNo || body.RRN || body.RefNo || refNo;

    return {
      status: internalStatus,
      statusDesc:
        header.Error_Desc ||
        (internalStatus === 'SUCCESS' ? 'Payment initiated successfully' : ''),
      transactionId: body.RefNo || refNo,
      orgTransactionId: body.OrgTransactionID || orgTransactionId,
      providerReference: providerRef ? String(providerRef) : null,
      utrNo: body.UTRNo || null,
      rrn: body.RRN || null,
      refNo: body.RefNo || refNo,
      amount: body.Amount ? Number(body.Amount) : null,
      raw: response,
    };
  }

  /**
   * Normalize status response according to RBL documentation
   *
   * RBL Status Types:
   * - For NEFT/RTGS: Initiated, In Progress, Success, Failure, On Hold, Returned
   * - For IMPS: PaymentStatus 7 (Success), 8 (Failure), 9 (Deemed Success/Pending)
   * - For FT: Always Success
   */
  _normalizeStatusResponse(data) {
    const responseKey = Object.keys(data).find((k) =>
      k.includes('get_Single_Payment_Status_Corp_Res'),
    );
    const response = data[responseKey] || data;
    const header = response?.Header || {};
    const body = response?.Body || {};

    // Check for RBL header-level failure
    if (header.Status === 'FAILED') {
      const errorCode = header.Error_Cde;
      const errorDesc = header.Error_Desc;

      // Handle specific error codes per documentation
      if (errorCode === 'ER009') {
        throw ApiError.notFound(`RefNo does not exist: ${errorDesc}`);
      }
      if (errorCode === 'ER010') {
        throw ApiError.notFound(`UTRNo does not exist: ${errorDesc}`);
      }
      if (errorCode === 'ER011') {
        throw ApiError.notFound(`RRN does not exist: ${errorDesc}`);
      }

      throw ApiError.badRequest(`RBL Error [${errorCode}]: ${errorDesc}`);
    }

    // Determine status based on RBL response
    let internalStatus = 'PENDING';
    let statusDesc = body.STATUSDESC || '';

    // IMPS Payment Status (numeric)
    const paymentStatus = body.PAYMENTSTATUS;
    if (paymentStatus) {
      if (paymentStatus === '7') {
        internalStatus = 'SUCCESS';
        statusDesc = 'Payment confirmed success';
      } else if (paymentStatus === '8') {
        internalStatus = 'FAILED';
        statusDesc = statusDesc || 'Payment confirmed failure';
      } else if (paymentStatus === '9') {
        internalStatus = 'PENDING';
        statusDesc = statusDesc || 'Deemed success - awaiting confirmation';
      }
    }
    // NEFT/RTGS/FT Status
    else {
      const txnStatus = body.TXNSTATUS?.toUpperCase() || '';

      switch (txnStatus) {
        case 'SUCCESS':
          internalStatus = 'SUCCESS';
          break;
        case 'FAILURE':
          internalStatus = 'FAILED';
          break;
        case 'IN PROGRESS':
          internalStatus = 'PROCESSING';
          statusDesc = statusDesc || 'Transaction is being processed';
          break;
        case 'INITIATED':
          internalStatus = 'PENDING';
          statusDesc = statusDesc || 'Transaction initiated';
          break;
        case 'ON HOLD':
          internalStatus = 'PENDING';
          statusDesc =
            statusDesc ||
            'Transaction on hold - will be processed next working day';
          break;
        case 'RETURNED':
          internalStatus = 'FAILED';
          statusDesc = statusDesc || 'Transaction returned by beneficiary bank';
          break;
        default:
          internalStatus = 'PENDING';
      }
    }

    // Build response object
    const result = {
      status: internalStatus,
      statusDesc: statusDesc,
      transactionId: body.RefNo || body.ORGTRANSACTIONID,
      orgTransactionId: body.ORGTRANSACTIONID,
      providerReference: body.UTRNo || body.RRN || body.RefNo,
      utrNo: body.UTRNo || null,
      rrn: body.RRN || null,
      refNo: body.RefNo,
      amount: body.AMOUNT ? Number(body.AMOUNT) : null,
      beneficiaryAccount: body.BEN_ACCT_NO || null,
      beneficiaryIfsc: body.BENIFSC || body.IFSCCODE || null,
      beneficiaryName: body.BENEFICIARYNAME || null,
      txnTime: body.TXNTIME || null,
      raw: response,
    };

    // Add NEFT-specific fields
    if (body.BEN_CONF_RECEIVED) {
      result.beneficiaryConfirmationReceived = body.BEN_CONF_RECEIVED === 'Y';
    }

    // Add IMPS-specific fields
    if (paymentStatus) {
      result.paymentStatus = paymentStatus;
      result.remitterName = body.REMITTERNAME;
      result.remitterMobile = body.REMITTERMBLNO;
      result.beneficiaryBank = body.BANK;
    }

    return result;
  }

  /**
   * Normalize account balance response according to RBL documentation
   */
  _normalizeBalanceResponse(data) {
    const responseKey = Object.keys(data).find((k) =>
      k.includes('getAccountBalanceRes'),
    );
    const response = data[responseKey] || data;
    const header = response?.Header || {};
    const body = response?.Body || {};

    // Check for RBL header-level failure
    if (header.Status === 'FAILURE') {
      const errorCode = header.Error_Cde;
      const errorDesc = header.Error_Desc;

      // Handle specific error codes per balance API documentation
      if (errorCode === 'ER008') {
        throw ApiError.badRequest(
          `Invalid Account Hierarchy: ${errorDesc || 'Account number does not belong to valid corporate hierarchy'}`,
        );
      }
      if (errorCode === 'ER003') {
        throw ApiError.unauthorized(
          `Invalid CorpId: ${errorDesc || 'Corporate ID validation failed'}`,
        );
      }
      if (errorCode === 'ER001' || errorCode === 'ER002') {
        throw ApiError.badRequest(
          `RBL Balance Validation Error [${errorCode}]: ${errorDesc || 'Invalid request format'}`,
        );
      }
      if (
        errorCode === 'ER004' ||
        errorCode === 'ER006' ||
        errorCode === 'ER017' ||
        errorCode === 'ER018'
      ) {
        throw ApiError.internal(
          `RBL Balance Technical Error [${errorCode}]: ${errorDesc || 'Technical failure occurred'}`,
        );
      }

      throw ApiError.badRequest(
        `RBL Balance Error [${errorCode || 'N/A'}]: ${errorDesc || 'Unknown error'}`,
      );
    }

    const balAmt = body.BalAmt || {};

    return {
      status: header.Status === 'SUCCESS' ? 'SUCCESS' : 'UNKNOWN',
      transactionId: header.TranID,
      corpId: header.Corp_ID,
      approverId: header.Approver_ID,
      balance: {
        amount: balAmt.amountValue ? Number(balAmt.amountValue) : null,
        currencyCode: balAmt.currencyCode || null,
      },
      raw: response,
    };
  }

  /**
   * Normalize account statement response according to RBL documentation
   */
  _normalizeStatementResponse(data) {
    const responseKey = Object.keys(data).find((k) =>
      k.includes('Acc_Stmt_DtRng_Res'),
    );
    const response = data[responseKey] || data;
    const header = response?.Header || {};
    const body = response?.Body || {};

    // Check for RBL header-level failure
    if (header.Status === 'FAILURE') {
      const errorCode = header.Error_Cde;
      const errorDesc = header.Error_Desc;

      // Handle specific error codes per statement API documentation
      if (errorCode === 'ER034') {
        throw ApiError.badRequest(
          `Invalid Account Number: ${errorDesc || 'Request not valid for the given Account Number'}`,
        );
      }
      if (errorCode === 'ER003') {
        throw ApiError.unauthorized(
          `Invalid CorpId: ${errorDesc || 'Corporate ID validation failed'}`,
        );
      }
      if (errorCode === 'ER001' || errorCode === 'ER002') {
        throw ApiError.badRequest(
          `RBL Statement Validation Error [${errorCode}]: ${errorDesc || 'Invalid request format'}`,
        );
      }
      if (
        errorCode === 'ER004' ||
        errorCode === 'ER006' ||
        errorCode === 'ER017' ||
        errorCode === 'ER018'
      ) {
        throw ApiError.internal(
          `RBL Statement Technical Error [${errorCode}]: ${errorDesc || 'Technical failure occurred'}`,
        );
      }

      throw ApiError.badRequest(
        `RBL Statement Error [${errorCode || 'N/A'}]: ${errorDesc || 'Unknown error'}`,
      );
    }

    const transactions = body.transactionDetails || [];
    const hasMoreData = body.hasMoreData === 'Y';

    // Auto-build next page pagination details if more data exists
    let nextPaginationDetails = null;
    if (hasMoreData && transactions.length > 0) {
      const lastTxn = transactions[transactions.length - 1];
      nextPaginationDetails = this._buildPaginationDetails(lastTxn);
    }

    return {
      status: header.Status === 'SUCCESS' ? 'SUCCESS' : 'UNKNOWN',
      transactionId: header.TranID,
      corpId: header.Corp_ID,
      approverId: header.Approver_ID,
      accountBalances: body.accountBalances || null,
      hasMoreData: hasMoreData,
      transactions: transactions,
      nextPaginationDetails: nextPaginationDetails, // Auto-built, ready for next call
      raw: response,
    };
  }
}

export default RblPayoutPlugin;
