import type { Result } from "../../../../core/helpers/ResultC"
import type { CreatePaymentError, CreatePaymentInput, CreatePaymentOutput } from "../business/useCases/payment/CreatePayment"
import type { GetPaymentError, GetPaymentInput, GetPaymentOutput } from "../business/useCases/payment/GetPaymentCase"


/** contrato de acceso a datos para payments */
export interface PaymentGateway {

  /** guarda un payment en la bd */
  create(
    input: CreatePaymentInput
  ): Promise<Result<CreatePaymentOutput, CreatePaymentError>>

  /** obtiene un payment por id, puede devolver null si no existe */
  getById(
    input: GetPaymentInput
  ): Promise<Result<GetPaymentOutput, GetPaymentError>>
}
