import { FirebaseError } from "firebase/app";
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";

export interface GetDebtsForPreparationInput {
    companyId: string;
}

export interface GetDebtsForPreparationError {
    code: "UNKNOWN_ERROR" | "NETWORK_ERROR" | "INVALID_INPUT";
}

export interface GetDebtsForPreparationOutput {
    state: Debt[];
}

export class GetDebtsForPreparationUseCase {
    private readonly debtGateway: DebtGateway;
    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: GetDebtsForPreparationInput): Promise<Result<GetDebtsForPreparationOutput, GetDebtsForPreparationError>> {
        try {
            const result = await this.debtGateway.getDebtsForPreparation({
                companyId: input.companyId,
                delivered: false,
                deliveredStatus: "true_preparacion",
            });
            return result;
        } catch (error) {
            console.error("[GetDebtsForPreparation]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}