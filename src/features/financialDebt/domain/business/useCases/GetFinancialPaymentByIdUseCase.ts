
import { ok, fail, type Result } from "../../../../../core/helpers/ResultC";
import type { FinancialPayment } from "../entities/FinancialPayment";
import type FinancialPaymentGateway from "../../infraestructure/FinancialPaymentGateway";

export interface GetFinancialPaymentByIdInput {
    companyId: string;
    paymentId: string;
}

export type GetFinancialPaymentByIdError = { code: "NOT_FOUND" } | { code: "UNKNOWN_ERROR" };

export class GetFinancialPaymentByIdUseCase {
    private financialPaymentGateway: FinancialPaymentGateway;

    constructor(financialPaymentGateway: FinancialPaymentGateway) {
        this.financialPaymentGateway = financialPaymentGateway;
    }

    async execute(input: GetFinancialPaymentByIdInput): Promise<Result<FinancialPayment, GetFinancialPaymentByIdError>> {
        try {
            const result = await this.financialPaymentGateway.getPaymentById(input.companyId, input.paymentId);
            if (result.ok) {
                if (result.value) {
                    return ok(result.value);
                }
                return fail({ code: "NOT_FOUND" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        } catch (error) {
            console.error("Error in GetFinancialPaymentByIdUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
