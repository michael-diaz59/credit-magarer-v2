import type { CollectorRoute } from "../business/entities/CollectorRoute";
import type { UpdateDebitInput, UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import type { CreateDebtError, CreateDebtUInput, CreateDebtUOutput, createWithInstallmentsInput } from "../business/useCases/debt/CreateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { GetDebtsInput, GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../business/useCases/debt/GetByFiltersCase";
import type { UpdateDebtStatusInput, UpdateDebtStatusOutput, UpdateDebtStatusError } from "../business/useCases/debt/UpdateDebtStatusUseCase";
import type { Debt, DebtStatus } from "../business/entities/Debt";
import type { MarkAsPaidError, MarkAsPaidOutput } from "../business/useCases/debt/MarkAsPaidUseCase";

export interface MarkAsPaidGateInput {
  debtId: string;
  companyId: string;
  auditorNotes: string;
  newStatus: DebtStatus;
}

export interface DebtGateway {
  create(debt:
    CreateDebtUInput
  ): Promise<Result<CreateDebtUOutput, CreateDebtError>>;

  markAsPaid(input: MarkAsPaidGateInput): Promise<Result<MarkAsPaidOutput, MarkAsPaidError>>

  update(debt:
    UpdateDebitInput
  ): Promise<UpdateDebitOutput>;

  updateStatus(
    input: UpdateDebtStatusInput
  ): Promise<Result<UpdateDebtStatusOutput, UpdateDebtStatusError>>;

  getByFilters(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput, GetByFiltersError>>

  confirmDebtsDelivery(input: { companyId: string, debtIds: string[] }): Promise<Result<null, any>>;

  getById(input: GetDebitByIdInput): Promise<GetDebitByIdOutput>;

  getDebts(input: GetDebtsInput): Promise<GetDebtsOutput>;

  getBycostumerDocument(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput>;
  createWithInstallments(input: createWithInstallmentsInput): Promise<Result<CreateDebtUOutput, CreateDebtError>>;

  getDebtsByRouteAndStatus(input: {
    companyId: string;
    routeIds: string[];
    statuses: DebtStatus[];
    dateLimit?: string;
  }): Promise<Result<GetDebtsOutput, any>>;

  getDebtsByRoute(input: {
    companyId: string;
    routeId: string;
  }): Promise<Result<Debt[], any>>;

  getSumOfDeliveredCapital(companyId: string): Promise<Result<number, any>>;
  getSumOfRenewalPayment(companyId: string): Promise<Result<number, any>>;

  createMany(input: {
    companyId: string;
    debts: Debt[];
  }): Promise<Result<void, CreateDebtError>>;
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
