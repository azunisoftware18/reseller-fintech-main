import { createSlice } from "@reduxjs/toolkit";

const employeeSlice = createSlice({
  name: "employee",
  initialState: {
    currentEmployee: null,
  },
  reducers: {
    setEmployees(state, action) {
      state.list = action.payload;
    },
    setEmployee(state, action) {
      state.current = action.payload;
    },
    clearEmployee(state) {
      state.current = null;
    },
  },
});

export const { setEmployees, setEmployee, clearEmployee } =
  employeeSlice.actions;

export default employeeSlice.reducer;
