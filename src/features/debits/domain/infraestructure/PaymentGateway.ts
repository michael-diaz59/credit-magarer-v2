import type { Result } from "../../../../core/helpers/ResultC"
import type { CreatePaymentError, CreatePaymentInput, CreatePaymentOutput } from "../business/useCases/payment/CreatePayment"
import type { GetPaymentError, GetPaymentInput, GetPaymentOutput } from "../business/useCases/payment/GetPaymentByIdCase"
import type { DeletePaymentError, DeletePaymentInput, DeletePaymentOutput } from "../business/useCases/payment/DeletePaymentCase"
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../business/useCases/payment/GetPaymentsByInstallmentCaseTypes"
import type { Payment } from "../business/entities/Payment"
import type { UpdatePaymentInput, UpdatePaymentOutput, UpdatePaymentError } from "../business/useCases/payment/UpdatePaymentStatusUseCase"
import type { GetPaymentsByStatusInput, GetPaymentsByStatusOutput } from "../business/useCases/payment/GetPaymentsByStatusUseCase"
import type { Installment } from "../business/entities/Installment"
import type { Debt } from "../business/entities/Debt"
import type { BankAccount } from "../../../bankAccounts/domain/business/entities/BankAccount"

export interface UpdateMultiplePaymentsIsTightRepositoryInput {
  companyId: string;
  payments: Payment[];
}

export interface UpdateMultiplePaymentsIsTightRepositoryOutput {
  updatedCount: number;
}

export type UpdateMultiplePaymentsIsTightRepositoryError =
  | { code: "PAYMENT_NOT_FOUND" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface RegisterPaymentRepositoryInput {
  companyId: string;
  payment: Payment;
  bankAccount?: BankAccount;
  expectedInstallmentState: {
    capitalPaid: number;
    interestPaid: number;
    arrearsPaid: number;
    defermentPaid: number;
  };
  expectedDebtState: {
    capitalPaid: number;
    interestPaid: number;
    arrearsPaid: number;
    defermentPaid: number;
  };
  installmentOutstandingReceivables: {
    outstandingReceivablesAmount: number;
    outstandingReceivablesDeferment: number;
    outstandingReceivablesArrears: number;
    outstandingReceivables: number;
  };
  debtOutstandingReceivables: {
    outstandingReceivablesAmount: number;
    outstandingReceivablesDeferment: number;
    outstandingReceivablesArrears: number;
    outstandingReceivables: number;
  };
}

export interface RegisterPaymentRepositoryOutput {
  payment: Payment;
  installment: Installment;
  debt: Debt;
  bankAccount?: BankAccount;
}

export type RegisterPaymentRepositoryError =
  | { code: "BANK_ACCOUNT_NOT_FOUND" }
  | { code: "DEBT_NOT_FOUND" }
  | { code: "INSTALLMENT_NOT_FOUND" }
  | { code: "INSTALLMENT_STATE_MISMATCH" }
  | { code: "DEBT_STATE_MISMATCH" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface RegisterCashPaymentRepositoryInput {
  companyId: string;
  payment: Payment;
  collectorId?: string;
  expectedInstallmentState: {
    capitalPaid: number;
    interestPaid: number;
    arrearsPaid: number;
    defermentPaid: number;
  };
  expectedDebtState: {
    capitalPaid: number;
    interestPaid: number;
    arrearsPaid: number;
    defermentPaid: number;
  };
  installmentOutstandingReceivables: {
    outstandingReceivablesAmount: number;
    outstandingReceivablesDeferment: number;
    outstandingReceivablesArrears: number;
    outstandingReceivables: number;
  };
  debtOutstandingReceivables: {
    outstandingReceivablesAmount: number;
    outstandingReceivablesDeferment: number;
    outstandingReceivablesArrears: number;
    outstandingReceivables: number;
  };
}

export interface RegisterCashPaymentRepositoryOutput {
  payment: Payment;
  installment: Installment;
  debt: Debt;
  newCollectorAmount?: number;
}

export type RegisterCashPaymentRepositoryError =
  | { code: "USER_NOT_FOUND" }
  | { code: "DEBT_NOT_FOUND" }
  | { code: "INSTALLMENT_NOT_FOUND" }
  | { code: "INSTALLMENT_STATE_MISMATCH" }
  | { code: "DEBT_STATE_MISMATCH" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface CascadingPaymentItemInput {
  installment: Installment;
  payment: Payment;
}

export interface RegisterCascadingPaymentRepositoryInput {
  companyId: string;
  debt: Debt;
  items: CascadingPaymentItemInput[];
  collectorId: string;
  totalCollected: number;
  capitalCollected: number;
  interestCollected: number;
  arrearsCollected: number;
  defermentCollected: number;
  method: "efectivo" | "consignacion";
  bankAccount?: BankAccount;
}

export interface RegisterCascadingPaymentRepositoryOutput {
  payments: Payment[];
  installments: Installment[];
  debt: Debt;
  newCollectorAmount?: number;
  bankAccount?: BankAccount;
}

export type RegisterCascadingPaymentRepositoryError =
  | { code: "USER_NOT_FOUND" }
  | { code: "DEBT_NOT_FOUND" }
  | { code: "BANK_ACCOUNT_NOT_FOUND" }
  | { code: "INSTALLMENT_NOT_FOUND" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export type GetPaymentsByDateError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

/** contrato de acceso a datos para payments */
export interface PaymentGateway {


  getNewId(companyId: string): Promise<string>

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

  deleteProof(
    companyId: string,
    paymentId: string,
    fileName: string
  ): Promise<void>

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
  ): Promise<Result<Payment[], GetPaymentsByDateError>>
  /** Oficializa y actualiza el estado isTight de varios pagos, asentando sus cuotas y deudas */
  updateMultipleIsTight(
    input: UpdateMultiplePaymentsIsTightRepositoryInput
  ): Promise<Result<UpdateMultiplePaymentsIsTightRepositoryOutput, UpdateMultiplePaymentsIsTightRepositoryError>>;

  getSumPayments(companyId: string): Promise<Result<number, any>>;

  createMany(input: {
    companyId: string;
    payments: Payment[];
  }): Promise<Result<void, CreatePaymentError>>;

  registerCashPayment(
    input: RegisterCashPaymentRepositoryInput
  ): Promise<Result<RegisterCashPaymentRepositoryOutput, RegisterCashPaymentRepositoryError>>;


  registerPayment(
    input: RegisterPaymentRepositoryInput
  ): Promise<Result<RegisterPaymentRepositoryOutput, RegisterPaymentRepositoryError>>;

  registerCascadingPayment(
    input: RegisterCascadingPaymentRepositoryInput
  ): Promise<Result<RegisterCascadingPaymentRepositoryOutput, RegisterCascadingPaymentRepositoryError>>;
}
