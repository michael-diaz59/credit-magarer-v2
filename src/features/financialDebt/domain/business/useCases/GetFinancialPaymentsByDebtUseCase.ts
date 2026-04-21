
import { ok, fail, type Result } from "../../../../../core/helpers/ResultC";
import type { FinancialPayment } from "../entities/FinancialPayment";
import type FinancialPaymentGateway from "../../infraestructure/FinancialPaymentGateway";

export interface GetFinancialPaymentsByDebtInput {
    companyId: string;
    financialDebtId: string;
}

export type GetFinancialPaymentsByDebtError = { code: "UNKNOWN_ERROR" };

export class GetFinancialPaymentsByDebtUseCase {
    private financialPaymentGateway: FinancialPaymentGateway;

    constructor(financialPaymentGateway: FinancialPaymentGateway) {
        this.financialPaymentGateway = financialPaymentGateway;
    }

    async execute(input: GetFinancialPaymentsByDebtInput): Promise<Result<FinancialPayment[], GetFinancialPaymentsByDebtError>> {
        try {
            const result = await this.financialPaymentGateway.getPaymentsByDebtId(input.companyId, input.financialDebtId);
            if (result.ok) {
                return ok(result.value);
            }
            return fail({ code: "UNKNOWN_ERROR" });
        } catch (error) {
            console.error("Error in GetFinancialPaymentsByDebtUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
