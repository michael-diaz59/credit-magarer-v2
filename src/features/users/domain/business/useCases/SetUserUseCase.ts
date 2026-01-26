import type { Result } from "../../../../../core/helpers/ResultC"
import type { UserGateway } from "../../infraestructure/UserGateway"
import type { User } from "../entities/User"
import type { setUserError } from "../entities/userErrors"


export interface SetUserInput {
    user: User
}
export class SetUserUseCase {
    private userRepository: UserGateway

    constructor(
        userRepository: UserGateway
    ) {
        this.userRepository = userRepository
    }

    async execute(setUserInput: SetUserInput): Promise<Result<void, setUserError>> {
        // Implementation to get user details
        return await this.userRepository.setUser(setUserInput.user)
    }

}