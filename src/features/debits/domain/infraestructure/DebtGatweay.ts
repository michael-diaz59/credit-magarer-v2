import type { CollectorRoute } from "../business/entities/CollectorRoute";
import type { UpdateDebitInput, UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import type { CreateDebtError, CreateDebtUInput, CreateDebtUOutput, createWithInstallmentsInput } from "../business/useCases/debt/CreateDebtUseCase";
import type { GetInstallmentsByDebtInput, GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import type { UpdateInstallmentByDebtInput, UpdateInstallmentByDebtOutput } from "../business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { CreateInstallmentsGatewayInput, CreateInstallmentsOutput } from "../business/useCases/installment/CreateInstallmentsUseCase";
import type { GetDebtsInput, GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../business/useCases/debt/GetByFiltersCase";
import type { GetByCollectorError, GetByCollectorInput, GetByCollectorOutput } from "../business/useCases/installment/GetByCollectorCase";
import type { GetByIdError, GetByIdInput, GetByIdOutput } from "../business/useCases/installment/GetByIdCase";
import type { UpdateByIdError, UpdateByIdInput, UpdateByIdOutput } from "../business/useCases/installment/UpdateByIdCase";


export interface DebtGateway {
  create(debt: 
    CreateDebtUInput
  ): Promise<Result<CreateDebtUOutput,CreateDebtError>>;

  update(debt: 
    UpdateDebitInput
  ): Promise<UpdateDebitOutput>;

  getByFilters(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput,GetByFiltersError>>

  getById(input: GetDebitByIdInput): Promise<GetDebitByIdOutput>;

  getDebts(input: GetDebtsInput): Promise<GetDebtsOutput>;

  getBycostumerDocument(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput>;
  createWithInstallments(input: createWithInstallmentsInput): Promise<Result<CreateDebtUOutput, CreateDebtError>>;


}

export interface InstallmentGateway {

  createForNewDebt(input: CreateInstallmentsGatewayInput): Promise<CreateInstallmentsOutput>

  getByCollector(input: GetByCollectorInput): Promise<Result<GetByCollectorOutput,GetByCollectorError>>

  updateByDebt(input: UpdateInstallmentByDebtInput):Promise<UpdateInstallmentByDebtOutput>;

  updateById(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>>


  getByDebt (input: GetInstallmentsByDebtInput) :Promise<GetInstallmentsByDebtOutput>;
  getById(input: GetByIdInput): Promise<Result<GetByIdOutput,GetByIdError>>

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
