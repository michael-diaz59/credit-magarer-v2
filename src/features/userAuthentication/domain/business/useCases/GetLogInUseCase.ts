import type { Result } from "../../../../../core/helpers/ResultC"
import type { AuthGateway } from "../../infraestructure/AuthenticationGateway"
import type { GetLogInErros } from "../entities/AuthErrors"
import type { UserAuthentication } from "../entities/UserAuthentication"

//recuperar logins guardados
export class GetLogInUseCase {
    private authGateway: AuthGateway
    constructor(
        authGateway: AuthGateway,
    ) {
        this.authGateway = authGateway
    }
    async execute(
    ): Promise<Result<UserAuthentication | null, GetLogInErros>> {
        return await this.authGateway.getLogIn()
    }
}