import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type { AuthGateway } from "../../infraestructure/AuthenticationGateway"
import type { LoginError } from "../entities/AuthErrors"
import type { UserAuthentication } from "../entities/UserAuthentication"

//representa un inicio basico con correo y contraseña
export interface LoginInput {
    email: string
    password: string
}

//espera recibir el id del usuario que inicio sesion
export interface LoginOutput {
    userId: string
}

export class LoginUseCase {
    private authGateway: AuthGateway

    constructor(
        authGateway: AuthGateway,
    ) {
        this.authGateway = authGateway
    }

    async execute(
        input: LoginInput
    ): Promise<Result<LoginOutput, LoginError>> {
        const identityResult: Result<UserAuthentication, LoginError> = await this.authGateway.login(
            input.email,
            input.password
        )

        if (!identityResult.ok) {
            return fail({ code: identityResult.error.code })
        }
         return ok({ userId: identityResult.value.id })

       
    }
}