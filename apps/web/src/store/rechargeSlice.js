import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  plans: [],
  offers: [],
  transactions: [],
  selectedTransactionId: null,
  loading: false,
  error: null,
};

const rechargeSlice = createSlice({
  name: "recharge",
  initialState,
  reducers: {
    /* ================= Loading ================= */

    setLoading(state, action) {
      state.loading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
    },

    clearError(state) {
      state.error = null;
    },

    /* ================= Plans ================= */

    setPlans(state, action) {
      state.plans = action.payload;
    },

    clearPlans(state) {
      state.plans = [];
    },

    /* ================= Offers ================= */

    setOffers(state, action) {
      state.offers = action.payload;
    },

    clearOffers(state) {
      state.offers = [];
    },

    /* ================= Transactions ================= */

    setTransactions(state, action) {
      state.transactions = action.payload;
    },

    addTransaction(state, action) {
      state.transactions.unshift(action.payload);
    },

    updateTransactionStatus(state, action) {
      const { id, status } = action.payload;
      const txn = state.transactions.find((t) => t.id === id);
      if (txn) txn.status = status;
    },

    /* ================= Selection ================= */

    setSelectedTransaction(state, action) {
      state.selectedTransactionId = action.payload;
    },

    /* ================= Reset ================= */

    clearRechargeState() {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setPlans,
  clearPlans,
  setOffers,
  clearOffers,
  setTransactions,
  addTransaction,
  updateTransactionStatus,
  setSelectedTransaction,
  clearRechargeState,
} = rechargeSlice.actions;

export default rechargeSlice.reducer;
