import type { Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { setUserError } from "../entities/userErrors";

export interface UpdateUserTotalAmountInput {
    userId: string;
    companyId: string;
    newAmount: number;
}

export class UpdateUserTotalAmountCase {
    private userRepository: UserGateway;

    constructor(userRepository: UserGateway) {
        this.userRepository = userRepository;
    }

    async execute(input: UpdateUserTotalAmountInput): Promise<Result<void, setUserError>> {
        return await this.userRepository.updateTotalAmount(input.userId, input.companyId, input.newAmount);
    }
}
