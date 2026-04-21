
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type FinancialPaymentGateway from "../../infraestructure/FinancialPaymentGateway";
import type { FinancialPayment } from "../entities/FinancialPayment";

export interface RegisterFinancialPaymentInput {
    companyId: string;
    payment: Omit<FinancialPayment, "id" | "idProofOfPayment">;
    file?: File;
}

export type RegisterFinancialPaymentError =
    | { code: "UPLOAD_ERROR" }
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class RegisterFinancialPaymentUseCase {
    private financialPaymentGateway: FinancialPaymentGateway;
    constructor(financialPaymentGateway: FinancialPaymentGateway) {
        this.financialPaymentGateway = financialPaymentGateway;
    }

    async execute(input: RegisterFinancialPaymentInput): Promise<Result<void, RegisterFinancialPaymentError>> {
        try {
            const id = this.financialPaymentGateway.generateId(input.companyId);
            let idProofOfPayment = "";

            if (input.file) {
                const uploadResult = await this.financialPaymentGateway.uploadProof(
                    input.companyId,
                    id,
                    input.file
                );

                if (!uploadResult.ok) {
                    return fail({ code: "UPLOAD_ERROR" });
                }
                idProofOfPayment = uploadResult.value;
            }

            const payment: FinancialPayment = {
                ...input.payment,
                id,
                idProofOfPayment,
            };

            const result = await this.financialPaymentGateway.registerPayment(input.companyId, payment);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok(undefined);

        } catch (error) {
            console.error("Error in RegisterFinancialPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
