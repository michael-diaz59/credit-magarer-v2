import type { Result } from "../../../../../../core/helpers/ResultC"
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway"

export type DeletePaymentError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "FORBIDDEN" }
    | { code: "PAYMENT_NOT_FOUND" }

export interface DeletePaymentInput {
    paymentId: string
    companyId: string
}

export interface DeletePaymentOutput {
    success: boolean
}

/** su función es eliminar un pago de la base de datos */
export class DeletePaymentCase {
    private paymentGateway: PaymentGateway

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway
    }

    async execute(
        input: DeletePaymentInput
    ): Promise<Result<DeletePaymentOutput, DeletePaymentError>> {
        return this.paymentGateway.delete(input)
    }
}
