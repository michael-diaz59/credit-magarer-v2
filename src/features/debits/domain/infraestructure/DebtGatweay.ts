import type { CollectorRoute } from "../business/entities/CollectorRoute";
import type { Payment } from "../business/entities/Payment";
import type { UpdateDebitInput, UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import type { CreateDebtUInput, CreateDebtUOutput } from "../business/useCases/debt/CreateDebtUseCase";
import type { GetInstallmentsByDebtInput, GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import type { UpdateInstallmentByDebtInput, UpdateInstallmentByDebtOutput } from "../business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { CreateInstallmentsGatewayInput, CreateInstallmentsOutput } from "../business/useCases/installment/CreateInstallmentsUseCase";
import type { GetDebtsInput, GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";


export interface DebtGateway {
  create(debt: 
    CreateDebtUInput
  ): Promise<CreateDebtUOutput>;

  update(debt: 
    UpdateDebitInput
  ): Promise<UpdateDebitOutput>;

  getById(input: GetDebitByIdInput): Promise<GetDebitByIdOutput>;

  getDebts(input: GetDebtsInput): Promise<GetDebtsOutput>;

  getBycostumerDocument(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput>;


}

export interface InstallmentGateway {

  createForNewDebt(input: CreateInstallmentsGatewayInput): Promise<CreateInstallmentsOutput>

  updateByDebt(input: UpdateInstallmentByDebtInput):Promise<UpdateInstallmentByDebtOutput>;


  getByDebt (input: GetInstallmentsByDebtInput) :Promise<GetInstallmentsByDebtOutput>;

}

export interface CollectionAssignmentGateway {
  assign(
    assignment: CollectorRoute
  ): Promise<void>;

  unassign(
    assignmentId: string,
    unassignedAt: Date
  ): Promise<void>;

  hasActiveAssignmentForDebt(
    debtId: string
  ): Promise<boolean>;

  hasActiveAssignmentForInstallment(
    installmentId: string
  ): Promise<boolean>;
}

export interface PaymentGateway {
  create(payment: Payment): Promise<void>;

  getByInstallmentId(
    installmentId: string
  ): Promise<Payment[]>;

  getByDebtId(
    debtId: string
  ): Promise<Payment[]>;
}
