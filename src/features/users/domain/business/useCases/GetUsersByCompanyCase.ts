import type { Role, User } from "../entities/User";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { getUserError } from "../entities/userErrors";
import type { Result } from "../../../../../core/helpers/ResultC";

export interface GetUserByCompanyInput {
    id: string
    rol?:Role
}

export interface GetUserByCompanyOutput {
    state: Result<User[], getUserError>
}

/**devuelve usuarios con un rol en especifico, si no se indica u rol devuelve todos los usuarios*/
export class GetUserByCompanyCase {
     private userRepository: UserGateway

     constructor(
             userRepository: UserGateway
         ) {
             this.userRepository = userRepository
         }

         /**devuelve usuarios con un rol en especifico, si no se indica u rol devuelve todos los usuarios*/
    async execute( input: GetUserByCompanyInput): Promise<GetUserByCompanyOutput>{
        // Implementation to get user details
           return this.userRepository.getUsersByCompany(
            input,
        )
    }

}