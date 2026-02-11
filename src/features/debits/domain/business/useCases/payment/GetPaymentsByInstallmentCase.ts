import type { Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment } from "../../entities/Payment";

export type GetPaymentsByInstallmentError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }


export interface GetPaymentsByInstallmentInput {
    installmentId: string
    companyId: string
}

export interface GetPaymentsByInstallmentOutput {
    state: Result<Payment[], GetPaymentsByInstallmentError>
}


export class GetPaymentsByInstallmentCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(input: GetPaymentsByInstallmentInput): Promise<GetPaymentsByInstallmentOutput> {
        return this.paymentGateway.getByInstallment(input);
    }
}
