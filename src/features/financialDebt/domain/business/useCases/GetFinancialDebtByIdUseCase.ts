
import { type Result } from "../../../../../core/helpers/ResultC";
import type FinancialDebtGateway from "../../infraestructure/FinancialDebtGateway";
import type { FinancialDebt } from "../entities/FinancialDebt";

export interface GetFinancialDebtByIdInput {
    companyId: string;
    id: string;
}

export class GetFinancialDebtByIdUseCase {
    private financialDebtGateway: FinancialDebtGateway;
    constructor(financialDebtGateway: FinancialDebtGateway) {
        this.financialDebtGateway = financialDebtGateway;
    }

    async execute(input: GetFinancialDebtByIdInput): Promise<Result<FinancialDebt | null, Error>> {
        return this.financialDebtGateway.getById(input.companyId, input.id);
    }
}
