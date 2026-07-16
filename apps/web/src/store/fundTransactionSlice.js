import { createSlice } from "@reduxjs/toolkit";

const fundTransactionSlice = createSlice({
  name: "fundTransaction",
  initialState: {
    list: [],
    current: null,
    meta: {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      stats: {
        SUCCESS: 0,
        PENDING: 0,
        FAILED: 0,
        REJECTED: 0,
      },
    },
  },
  reducers: {
    /* ================= SET LIST ================= */
    setFundTransactions(state, action) {
      state.list = action.payload.data;
      state.meta = action.payload.meta;
    },

    /* ================= SET SINGLE ================= */
    setFundTransaction(state, action) {
      state.current = action.payload;
    },

    /* ================= CLEAR CURRENT ================= */
    clearFundTransaction(state) {
      state.current = null;
    },

    /* ================= CLEAR ALL ================= */
    clearFundTransactions(state) {
      state.list = [];
      state.meta = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        stats: {
          SUCCESS: 0,
          PENDING: 0,
          FAILED: 0,
          REJECTED: 0,
        },
      };
    },
  },
});

export const {
  setFundTransactions,
  setFundTransaction,
  clearFundTransaction,
  clearFundTransactions,
} = fundTransactionSlice.actions;

export default fundTransactionSlice.reducer;
