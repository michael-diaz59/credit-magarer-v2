import type { Result } from "../../../core/helpers/ResultC"
import type { GetCurrentUserError, LoginError, LogoutError } from "./AuthErrors"
import type { UserAuthentication } from "./UserAuthentication"

export interface AuthRepository {
  login(
  email: string,
  password: string
): Promise<Result<UserAuthentication, LoginError>>
  logout(): Promise<Result<void, LogoutError>>
  getCurrentUser(): Promise<Result<UserAuthentication | null, GetCurrentUserError>>

}
