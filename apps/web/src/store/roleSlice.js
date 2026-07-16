import { createSlice } from "@reduxjs/toolkit";

const roleSlice = createSlice({
  name: "role",
  initialState: {
    list: [],
    current: null,
  },
  reducers: {
    setRoles(state, action) {
      state.list = action.payload;
    },
    setRole(state, action) {
      state.current = action.payload;
    },
    clearRole(state) {
      state.current = null;
    },
  },
});

export const { setRoles, setRole, clearRole } = roleSlice.actions;

export default roleSlice.reducer;
