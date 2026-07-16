import { createSlice } from "@reduxjs/toolkit";

const smtpConfigSlice = createSlice({
  name: "smtpConfig",
  initialState: {
    currentSmtpConfig: null,
  },
  reducers: {
    setSmtpConfig(state, action) {
      state.currentSmtpConfig = action.payload;
    },
    clearSmtpConfig(state) {
      state.currentSmtpConfig = null;
    },
  },
});

export const { setSmtpConfig, clearSmtpConfig } = smtpConfigSlice.actions;
export default smtpConfigSlice.reducer;
