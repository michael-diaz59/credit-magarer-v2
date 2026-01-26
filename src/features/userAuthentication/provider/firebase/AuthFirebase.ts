import { createContext } from "react";
import type { UserAuthentication } from "../../domain/business/entities/UserAuthentication";

export interface AuthContextValue {
  user: UserAuthentication | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
