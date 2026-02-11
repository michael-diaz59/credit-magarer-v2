import type { Result } from "../../../../core/helpers/ResultC"
import type { CreatePaymentError, CreatePaymentInput, CreatePaymentOutput } from "../business/useCases/payment/CreatePayment"
import type { GetPaymentError, GetPaymentInput, GetPaymentOutput } from "../business/useCases/payment/GetPaymentByIdCase"
import type { DeletePaymentError, DeletePaymentInput, DeletePaymentOutput } from "../business/useCases/payment/DeletePaymentCase"
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../business/useCases/payment/GetPaymentsByInstallmentCaseTypes"


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

  /** elimina un payment de la bd */
  delete(
    input: DeletePaymentInput
  ): Promise<Result<DeletePaymentOutput, DeletePaymentError>>

  /** sube el comprobante de pago a storage */
  uploadProof(
    file: File,
    companyId: string,
    paymentId: string
  ): Promise<Result<string, Error>>

  getByInstallment(
    input: GetPaymentsByInstallmentInput
  ): Promise<GetPaymentsByInstallmentOutput>

  /** genera un id unico para el pago */
  generateId(
    companyId: string
  ): string
}
