import type { Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment, PaymentStatus } from "../../entities/Payment";

export interface GetPaymentsByStatusInput {
    companyId: string;
    status: PaymentStatus;
}

export interface GetPaymentsByStatusOutput {
    state: Result<Payment[], { code: string }>;
}

export class GetPaymentsByStatusUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: GetPaymentsByStatusInput): Promise<GetPaymentsByStatusOutput> {
        return await this.paymentGateway.getByStatus(input);
    }
}
