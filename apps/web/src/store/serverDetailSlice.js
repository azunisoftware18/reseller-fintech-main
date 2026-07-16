import { createSlice } from "@reduxjs/toolkit";

const serverDetailSlice = createSlice({
  name: "serverDetail",
  initialState: {
    currentServerDetail: null,
  },
  reducers: {
    setServerDetail(state, action) {
      state.currentServerDetail = action.payload;
    },
    clearServerDetail(state) {
      state.currentServerDetail = null;
    },
  },
});

export const { setServerDetail, clearServerDetail } = serverDetailSlice.actions;

export default serverDetailSlice.reducer;
