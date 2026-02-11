import type { Result } from "../../../../../../core/helpers/ResultC"
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway"
import type { Payment } from "../../entities/Payment"

export type GetPaymentError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" }
  | { code: "FORBIDDEN" }

export interface GetPaymentInput {
  paymentId: string
  companyId: string
}

export interface GetPaymentOutput {
  payment: Payment | null
}

/** su función es obtener un payment por id */
export class GetPaymentByIdCase {
  private paymentGateway: PaymentGateway

  constructor(paymentGateway: PaymentGateway) {
    this.paymentGateway = paymentGateway
  }

  /** su función es obtener un payment por id */
  async execute(
    input: GetPaymentInput
  ): Promise<Result<GetPaymentOutput, GetPaymentError>> {
    return this.paymentGateway.getById(input)
  }
}
