import { createSlice } from "@reduxjs/toolkit";

const tenantSlice = createSlice({
  name: "tenant",
  initialState: {
    currentTenant: null,
  },
  reducers: {
    setTenant(state, action) {
      state.currentTenant = action.payload;
    },
    clearTenant(state) {
      state.currentTenant = null;
    },
  },
});

export const { setTenant, clearTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
