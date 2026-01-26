import type { Result } from "../../../../../core/helpers/ResultC"
import type { AuthGateway } from "../../infraestructure/AuthenticationGateway"
import type { LogoutError } from "../entities/AuthErrors"

export class LogOutUseCase {
    private authRepository: AuthGateway

    constructor(
        authRepository: AuthGateway,
    ) {
        this.authRepository = authRepository
    }

    async execute(): Promise<Result<void, LogoutError>> {
        return await this.authRepository.logout(
        )

    }
}