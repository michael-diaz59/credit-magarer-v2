import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { PaymentGateway, GetPaymentsByDateError } from "../../../infraestructure/PaymentGateway";

export interface GetPaymentsByDateInput {
    companyId: string;
    date: string;
}

export interface GetPaymentsByDateOutput {
    payments: Payment[];
}

export type { GetPaymentsByDateError };

export class GetPaymentsByDateUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: GetPaymentsByDateInput): Promise<Result<GetPaymentsByDateOutput, GetPaymentsByDateError>> {
        try {
            const result = await this.paymentGateway.getAllByDate(input.companyId, input.date);
            if (!result.ok) {
                return fail(result.error);
            }
            return ok({ payments: result.value });
        } catch (error) {
            console.error("[GetPaymentsByDateUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
