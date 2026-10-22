import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment } from "../../entities/Payment";

export type UpdateMultiplePaymentsIsTightError =
    | { code: "PAYMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface UpdateMultiplePaymentsIsTightInput {
    companyId: string;
    payments: Payment[];
}

export interface UpdateMultiplePaymentsIsTightOutput {
    updatedCount: number;
}

/**validar pagos, afecta los debts, installments y payments */
export class UpdateMultiplePaymentsIsTightUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: UpdateMultiplePaymentsIsTightInput): Promise<Result<UpdateMultiplePaymentsIsTightOutput, UpdateMultiplePaymentsIsTightError>> {
        try {
            if (input.payments.length === 0) {
                return ok({ updatedCount: 0 });
            }

            // 1. Oficializar y actualizar los pagos a isTight: true, asentando cuotas y deudas
            const result = await this.paymentGateway.updateMultipleIsTight({
                companyId: input.companyId,
                payments: input.payments,
            });

            if (!result.ok) {
                return fail(result.error);
            }
            return ok({ updatedCount: result.value.updatedCount });
        } catch (error) {
            console.error("[UpdateMultiplePaymentsIsTightUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
