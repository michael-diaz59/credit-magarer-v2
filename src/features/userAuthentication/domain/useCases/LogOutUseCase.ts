import type { Result } from "../../../../core/helpers/ResultC"
import type { LogoutError } from "../AuthErrors"
import type { AuthRepository } from "../AuthRepository"

export class LogOutUseCase {
    private authRepository: AuthRepository

    constructor(
        authRepository: AuthRepository,
    ) {
        this.authRepository = authRepository
    }

    async execute(): Promise<Result<void, LogoutError>> {
        return await this.authRepository.logout(
        )

    }
}