import { mergeDefined } from "../../../../../atomic_design/sub_atomic_particles/helpers";
import { fail, type Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { User } from "../entities/User";
import type { setUserError } from "../entities/userErrors";

export interface UpdateUserInput {
    idCompany: string;
    user: Partial<User>;
    idUser?: string;
}

export class UpdateUserUseCase {
    private userRepository: UserGateway;

    constructor(userRepository: UserGateway) {
        this.userRepository = userRepository;
    }

    async execute(input: UpdateUserInput): Promise<Result<void, setUserError>> {
        try {
            let finalUser: User;

            if (input.idUser) {
                // 1. Obtener el usuario actual
                const currentResult = await this.userRepository.getById2(input.idUser, input.idCompany);
                if (!currentResult.ok) {
                    return fail({ code: "USER_NOT_FOUND" });
                }

                const currentUser = currentResult.value;
                if (!currentUser) {
                    return fail({ code: "UNKNOWN_ERROR" });
                }

                // 2. Mezclar datos: tomar datos de 'user' que no sean nulos ni undefined
                finalUser = mergeDefined(currentUser, input.user);
            } else {
                // Si no hay idUser, entonces deben venir TODOS los campos
                if (!isValidUser(input.user)) {
                    return fail({ code: "INVALID_USER_DATA" });
                }

                finalUser = input.user as User;
            }

            // 3. Actualizar usuario en la base de datos
            return await this.userRepository.updateUser(input.idCompany, finalUser);

        } catch (error) {
            console.error("[UpdateUserUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }


}

export function isValidUser(user: Partial<User>): user is User {
    return (
        user.id !== undefined &&
        user.name !== undefined &&
        user.email !== undefined &&
        user.roles !== undefined &&
        user.companyId !== undefined
    );
}
