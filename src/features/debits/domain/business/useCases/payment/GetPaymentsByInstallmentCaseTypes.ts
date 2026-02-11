import type { Result } from "../../../../../../core/helpers/ResultC"
import type { Payment } from "../../entities/Payment"

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
