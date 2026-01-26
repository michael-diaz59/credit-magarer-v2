// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../theme/themeSlice.ts";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import  authSlice  from "../../features/userAuthentication/slices/authSliceFirebase.ts";
import userSlice from "../../features/users/slices/ReduxUserSlice.ts";

//configuracion del core de reducer y anexion de los slices
export const store = configureStore({
  reducer: {
    theme: themeReducer,
     auth: authSlice,
     user: userSlice,
  },
});

// Tipos para usar con hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 🔹 Hooks personalizados para que siempre tengan tipado
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
