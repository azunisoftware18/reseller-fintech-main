import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    usersList: [],
  },
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
    },
    clearUser(state) {
      state.currentUser = null;
    },
    setUsers(state, action) {
      state.usersList = action.payload;
    },
    clearUsers(state) {
      state.usersList = [];
    },
  },
});

export const { setUser, clearUser, setUsers, clearUsers } = userSlice.actions;

export default userSlice.reducer;
