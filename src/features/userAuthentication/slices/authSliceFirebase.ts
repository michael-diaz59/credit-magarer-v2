import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "../../../store/redux/coreRedux";
import type { AuthState } from "../domain/infraestructure/AuthState";
import type { UserAuthentication } from "../domain/business/entities/UserAuthentication";

export class ReduxAuthSlice implements AuthState {
  private dispatch: AppDispatch
  
  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch
  }

  setAuthenticatedUser(user: UserAuthentication): void {
    this.dispatch(setAuthUser(user));
  }

  clearAuthenticatedUser(): void {
    this.dispatch(clearAuthUser());
  }
}

//esta interfaz define la estructura de datos del estado de autenticacion en Redux
interface AuthStateRedux {
  user: UserAuthentication | null;
  initialized: boolean;
}

const initialState: AuthStateRedux = {
  user: null,
  initialized: false,
};


const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserAuthentication | null>) {
      state.user = action.payload;
      state.initialized = true;
    },
    clearUser(state) {
      state.user = null;
      state.initialized = true;
    },
  },
});

export const { setUser: setAuthUser, clearUser: clearAuthUser } = authSlice.actions;
export default authSlice.reducer;
