import { createSlice } from "@reduxjs/toolkit";

const tenantSocialMediaSlice = createSlice({
  name: "tenantSocialMedia",
  initialState: {
    currentSocialMedia: null,
  },
  reducers: {
    setTenantSocialMedia(state, action) {
      state.currentSocialMedia = action.payload;
    },
    clearTenantSocialMedia(state) {
      state.currentSocialMedia = null;
    },
  },
});

export const { setTenantSocialMedia, clearTenantSocialMedia } =
  tenantSocialMediaSlice.actions;

export default tenantSocialMediaSlice.reducer;
    