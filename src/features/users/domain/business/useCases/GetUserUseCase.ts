import type { User } from "../entities/User";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { getUserError } from "../entities/userErrors";
import type { Result } from "../../../../../core/helpers/ResultC";

export interface GetUserInput {
    id: string
}
export class GetUserUseCase {
     private userRepository: UserGateway

     constructor(
             userRepository: UserGateway
         ) {
             this.userRepository = userRepository
         }

    async execute( getUserInput: GetUserInput): Promise<Result<User | null, getUserError>>{
        // Implementation to get user details
           return await this.userRepository.getById(
            getUserInput.id,
        )
    }

}