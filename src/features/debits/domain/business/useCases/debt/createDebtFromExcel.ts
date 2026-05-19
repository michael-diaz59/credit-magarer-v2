
import type { Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";
import type { CreateDebtError } from "./CreateDebtUseCase";

export interface CreateDebtFromExcelInput {
    companyId: string;
    debts: Debt[];
}

export class CreateDebtFromExcelCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: CreateDebtFromExcelInput): Promise<Result<void, CreateDebtError>> {
        return this.debtGateway.createMany({
            companyId: input.companyId,
            debts: input.debts
        });
    }
}