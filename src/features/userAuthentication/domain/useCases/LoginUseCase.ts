import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import type { UserRepository } from "../../../users/domain/UserRepository"
import type { LoginError } from "../AuthErrors"
import type { AuthRepository } from "../AuthRepository"

//representa un inicio basico con correo y contraseña
export interface LoginInput {
    email: string
    password: string
}

//espera recibir el id del usuario que inicio sesion
export interface LoginResult {
    userId: string
}

export class LoginUseCase {
    private authRepository: AuthRepository
    private userRepository: UserRepository

    constructor(
        authRepository: AuthRepository,
        userRepository: UserRepository
    ) {
        this.authRepository = authRepository
        this.userRepository = userRepository
    }

    async execute(
        input: LoginInput
    ): Promise<Result<LoginResult, LoginError>> {
        const identityResult = await this.authRepository.login(
            input.email,
            input.password
        )

        if (!identityResult.ok) {
            return fail({ code: "INVALID_CREDENTIALS" })
        }

        const user = await this.userRepository.getById(
            identityResult.value.id
        )

        if (!user) {
            return fail({ code: "USER_NOT_REGISTERED" })
        }

        if (user.status !== "ACTIVE") {
            return fail({ code: "USER_NOT_ALLOWED" })
        }

        return ok({ userId: user.id })
    }
}