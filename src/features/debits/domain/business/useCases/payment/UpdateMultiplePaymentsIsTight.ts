import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";

export type UpdateMultiplePaymentsIsTightError =
    | { code: "PAYMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface UpdateMultiplePaymentsIsTightInput {
    companyId: string;
    paymentIds: string[];
}

export interface UpdateMultiplePaymentsIsTightOutput {
    updatedCount: number;
}

export class UpdateMultiplePaymentsIsTightUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: UpdateMultiplePaymentsIsTightInput): Promise<Result<UpdateMultiplePaymentsIsTightOutput, UpdateMultiplePaymentsIsTightError>> {
        try {
            if (input.paymentIds.length === 0) {
                return ok({ updatedCount: 0 });
            }

            const result = await this.paymentGateway.updateMultipleIsTight(
                input.companyId,
                input.paymentIds
            );

            if (result.ok) {
                return ok({ updatedCount: input.paymentIds.length });
            } else {
                return fail(result.error);
            }
        } catch (error) {
            console.error("[UpdateMultiplePaymentsIsTightUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
