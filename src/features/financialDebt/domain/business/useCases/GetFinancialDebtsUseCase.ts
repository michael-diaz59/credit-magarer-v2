
import { type Result } from "../../../../../core/helpers/ResultC";
import type FinancialDebtGateway from "../../infraestructure/FinancialDebtGateway";
import type { FinancialDebt } from "../entities/FinancialDebt";

export interface GetFinancialDebtsInput {
    companyId: string;
}

export class GetFinancialDebtsUseCase {
    private financialDebtGateway: FinancialDebtGateway;
    constructor(financialDebtGateway: FinancialDebtGateway) {
        this.financialDebtGateway = financialDebtGateway;
    }

    async execute(input: GetFinancialDebtsInput): Promise<Result<FinancialDebt[], Error>> {
        return this.financialDebtGateway.getAll(input.companyId);
    }
}
