import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment } from "../../entities/Payment";

export type UpdatePaymentError =
    | { code: "PAYMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface UpdatePaymentInput {
    companyId: string;
    payment: Payment;
}

export interface UpdatePaymentOutput {
    payment: Payment;
}

export class UpdatePaymentUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: UpdatePaymentInput): Promise<Result<UpdatePaymentOutput, UpdatePaymentError>> {
        try {
            const result = await this.paymentGateway.update(input);
            return result;
        } catch (error) {
            console.error("[UpdatePaymentUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
