import type { Result } from "../../../../core/helpers/ResultC"
import type { GetCurrentUserError } from "../AuthErrors"
import type { AuthRepository } from "../AuthRepository"
import type { UserAuthentication } from "../UserAuthentication"

export class GetUserUseCase {
    private authRepository: AuthRepository
    constructor(
        authRepository: AuthRepository,
    ) {
        this.authRepository = authRepository
    }
    async execute(
    ): Promise<Result<UserAuthentication | null, GetCurrentUserError>> {
        return await this.authRepository.getCurrentUser()

    }
}