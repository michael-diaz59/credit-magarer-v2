// core/auth/AuthStatePort.ts

import type { UserAuthentication } from "../business/entities/UserAuthentication";

//puerto encargado de expresar las intenciones de gestion del estado de autenticacion
export interface AuthState {
  setAuthenticatedUser(user: UserAuthentication): void;
  clearAuthenticatedUser(): void;
}
