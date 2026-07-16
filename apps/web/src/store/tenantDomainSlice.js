import { createSlice } from "@reduxjs/toolkit";

const tenantDomainSlice = createSlice({
  name: "tenantDomain",
  initialState: {
    currentDomain: null,
  },
  reducers: {
    setTenantDomain(state, action) {
      state.currentDomain = action.payload;
    },
    clearTenantDomain(state) {
      state.currentDomain = null;
    },
  },
});

export const { setTenantDomain, clearTenantDomain } = tenantDomainSlice.actions;

export default tenantDomainSlice.reducer;
