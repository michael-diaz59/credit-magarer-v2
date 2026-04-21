import type { Result } from "../../../../core/helpers/ResultC"
import type { CreatePaymentError, CreatePaymentInput, CreatePaymentOutput } from "../business/useCases/payment/CreatePayment"
import type { GetPaymentError, GetPaymentInput, GetPaymentOutput } from "../business/useCases/payment/GetPaymentByIdCase"
import type { DeletePaymentError, DeletePaymentInput, DeletePaymentOutput } from "../business/useCases/payment/DeletePaymentCase"
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../business/useCases/payment/GetPaymentsByInstallmentCaseTypes"
import type { Payment } from "../business/entities/Payment"
import type { UpdatePaymentInput, UpdatePaymentOutput, UpdatePaymentError } from "../business/useCases/payment/UpdatePaymentStatusUseCase"
import type { UpdateMultiplePaymentsIsTightError } from "../business/useCases/payment/UpdateMultiplePaymentsIsTight"
import type { GetPaymentsByStatusInput, GetPaymentsByStatusOutput } from "../business/useCases/payment/GetPaymentsByStatusUseCase"


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

  getByStatus(
    input: GetPaymentsByStatusInput
  ): Promise<GetPaymentsByStatusOutput>

  update(
    input: UpdatePaymentInput
  ): Promise<Result<UpdatePaymentOutput, UpdatePaymentError>>

  /** genera un id unico para el pago */
  generateId(
    companyId: string
  ): string

  /** obtiene todos los pagos de una empresa por fecha */
  getAllByDate(
    companyId: string,
    date: string
  ): Promise<Result<Payment[], any>>
  /** actualiza el estado isTight de varios pagos */
  updateMultipleIsTight(
    companyId: string,
    paymentIds: string[]
  ): Promise<Result<void, UpdateMultiplePaymentsIsTightError>>

  getSumPayments(companyId: string): Promise<Result<number, any>>;
}
