import type { Result } from "../../../../core/helpers/ResultC"
import type { GetLogInErros, LoginError, LogoutError } from "../business/entities/AuthErrors"
import type { UserAuthentication } from "../business/entities/UserAuthentication"

export interface AuthGateway {
  login(
  email: string,
  password: string
): Promise<Result<UserAuthentication, LoginError>>
  logout(): Promise<Result<void, LogoutError>>
  getLogIn(): Promise<Result<UserAuthentication | null, GetLogInErros>>
}
