import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../domain/business/entities/User";

interface UserStateRedux {
  user: User | null;
  initialState: boolean
}

const initialState: UserStateRedux = {
  user: null,
  initialState:false,
};

const userSlice = createSlice({
  name: "user",
   initialState:initialState,
  reducers: {
    createUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.initialState=true
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
       state.initialState=true
    },
    clearUser(state) {
       state.initialState=true
      state.user = null;
    },
  },
});

export const { setUser, clearUser, createUser } = userSlice.actions;
export default userSlice.reducer;
