
import type { Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { DebtStatus } from "../../entities/Debt";

export type UpdateDebtStatusError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "NOT_FOUND" };

export interface UpdateDebtStatusInput {
    companyId: string;
    idDebt: string;
    debtStatus: DebtStatus;
}

export interface UpdateDebtStatusOutput {
    success: boolean;
}

export class UpdateDebtStatusUseCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: UpdateDebtStatusInput): Promise<Result<UpdateDebtStatusOutput, UpdateDebtStatusError>> {
        return this.debtGateway.updateStatus(input);
    }
}
