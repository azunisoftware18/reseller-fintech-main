import { createSlice } from "@reduxjs/toolkit";

const permissionSlice = createSlice({
  name: "permission",
  initialState: {
    permissions: [], // logged-in user permissions
    loading: false,
  },
  reducers: {
    setPermissions(state, action) {
      state.permissions = action.payload;
    },
    clearPermissions(state) {
      state.permissions = [];
    },
    setPermissionLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setPermissions, clearPermissions, setPermissionLoading } =
  permissionSlice.actions;

export default permissionSlice.reducer;
