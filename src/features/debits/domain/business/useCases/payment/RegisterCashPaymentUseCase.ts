import type { Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt } from "../../entities/Debt";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";

export interface RegisterCashPaymentInput {
    payment: Payment;
    companyId: string;
    collectorId: string;
    currentCollectorAmount: number;
}

export interface RegisterCashPaymentOutput {
    payment: Payment;
    installment: Installment;
    debt: Debt;
    newCollectorAmount: number;
}

export type RegisterCashPaymentError =
    | { code: "DEBT_NOT_FOUND" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "EXCEEDS_TOTAL_DEBT"; maxAllowed: number }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export class RegisterCashPaymentUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(
        input: RegisterCashPaymentInput
    ): Promise<Result<RegisterCashPaymentOutput, RegisterCashPaymentError>> {
        return this.paymentGateway.registerCashPayment(input);
    }
}
