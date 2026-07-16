import { createSlice } from "@reduxjs/toolkit";

const tenantWebsiteSlice = createSlice({
  name: "tenantWebsite",
  initialState: {
    currentWebsite: null,
  },
  reducers: {
    setTenantWebsite(state, action) {
      state.currentWebsite = action.payload;
    },
    clearTenantWebsite(state) {
      state.currentWebsite = null;
    },
  },
});

export const { setTenantWebsite, clearTenantWebsite } =
  tenantWebsiteSlice.actions;

export default tenantWebsiteSlice.reducer;
