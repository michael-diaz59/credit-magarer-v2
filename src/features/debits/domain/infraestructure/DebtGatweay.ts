import type { UpdateDebitInput, UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import type { CreateDebtError2, CreateDebtUInput2, CreateDebtUOutput2, CreateWithInstallmentsInput2 } from "../business/useCases/debt/CreateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { GetDebtsInput, GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../business/useCases/debt/GetByFiltersCase";
import type { UpdateDebtStatusInput, UpdateDebtStatusOutput, UpdateDebtStatusError } from "../business/useCases/debt/UpdateDebtStatusUseCase";
import type { Debt, DebtStatus, delivered_status } from "../business/entities/Debt";
import type { MarkAsPaidError, MarkAsPaidOutput } from "../business/useCases/debt/MarkAsPaidUseCase";
import type { GetDebtsForPreparationError, GetDebtsForPreparationOutput } from "../business/useCases/debt/GetDebtsForPreparationCase";
import type { GoToActivateError, GoToActivateOutput } from "../business/useCases/debt/GoToActivateUseCase";
import type { Installment } from "../business/entities/Installment";

export interface MarkAsPaidGateInput {
  debtId: string;
  companyId: string;
  auditorNotes: string;
  newStatus: DebtStatus;
}

export interface GetDebtsForPreparationGateInput {
  companyId: string;
  deliveredStatus: delivered_status;
  delivered: boolean
}

export interface GoToActivateGateInput {
  companyId: string;
  debtId: string;
  installments: Installment[];
}

export interface DebtGateway {
  create(debt:
    CreateDebtUInput2
  ): Promise<Result<CreateDebtUOutput2, CreateDebtError2>>;

  goToActivate(
    input: GoToActivateGateInput
  ): Promise<Result<GoToActivateOutput, GoToActivateError>>

  goToReactivate(
    input: GoToActivateGateInput
  ): Promise<Result<GoToActivateOutput, GoToActivateError>>

  getDebtsForPreparation(input: GetDebtsForPreparationGateInput): Promise<Result<GetDebtsForPreparationOutput, GetDebtsForPreparationError>>

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
  createWithInstallments(input: CreateWithInstallmentsInput2): Promise<Result<CreateDebtUOutput2, CreateDebtError2>>;

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
  }): Promise<Result<void, CreateDebtError2>>;

  getDebtsByIds(input: {
    companyId: string;
    debtIds: string[];
  }): Promise<Result<Debt[], { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" }>>;
}


