import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byTenant: {}, // { [tenantId]: services[] }
  allServices: [], // listAll result
  selectedTenantId: null,
  loading: false,
  error: null,
};

const tenantServiceSlice = createSlice({
  name: "tenantService",
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

    /* ================= Tenant Scoped ================= */
    setTenantServices(state, action) {
      const { tenantId, services } = action.payload;
      state.byTenant[tenantId] = services;
    },

    /* ================= List All ================= */
    setAllTenantServices(state, action) {
      state.allServices = action.payload;
    },

    /* ================= Selection ================= */
    setSelectedTenant(state, action) {
      state.selectedTenantId = action.payload;
    },

    /* ================= Reset ================= */
    clearTenantServices(state) {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setTenantServices,
  setAllTenantServices,
  setSelectedTenant,
  clearTenantServices,
} = tenantServiceSlice.actions;

export default tenantServiceSlice.reducer;
