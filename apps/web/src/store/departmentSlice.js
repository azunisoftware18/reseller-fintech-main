import { createSlice } from "@reduxjs/toolkit";

const departmentSlice = createSlice({
  name: "department",
  initialState: {
    list: [],
    current: null,
  },
  reducers: {
    setDepartments(state, action) {
      state.list = action.payload;
    },
    setDepartment(state, action) {
      state.current = action.payload;
    },
    clearDepartment(state) {
      state.current = null;
    },
  },
});

export const { setDepartments, setDepartment, clearDepartment } =
  departmentSlice.actions;

export default departmentSlice.reducer;
