import type { Result } from "../../../../../../core/helpers/ResultC"
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway"
import type { Payment } from "../../entities/Payment"

export type CreatePaymentError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" }
  | { code: "FORBIDDEN" }
  | { code: "INVALID_PAYMENT" }

export interface CreatePaymentInput {
  payment: Payment
  companyId: string
}

export interface CreatePaymentOutput {
  payment: Payment
}

/** su función es crear un pago y guardarlo en la base de datos */
export class CreatePaymentCase {
  private paymentGateway: PaymentGateway

  constructor(paymentGateway: PaymentGateway) {
    this.paymentGateway = paymentGateway
  }

  /** su función es crear un pago y guardarlo en la base de datos */
  async execute(
    input: CreatePaymentInput
  ): Promise<Result<CreatePaymentOutput, CreatePaymentError>> {
    return this.paymentGateway.create(input)
  }
}