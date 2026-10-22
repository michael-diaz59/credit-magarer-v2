import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { GetByCollectorCase, type GetByCollectorError, type GetByCollectorInput, type GetByCollectorOutput } from "../business/useCases/installment/GetByCollectorCase";
import { GetByIdCase, type GetByIdError, type GetByIdInput, type GetByIdOutput } from "../business/useCases/installment/GetByIdCase";
import { UpdateByIdCase, type UpdateByIdError, type UpdateByIdInput, type UpdateByIdOutput } from "../business/useCases/installment/UpdateByIdCase";
import type { DebtGateway } from "./DebtGatweay";
import { GetInstallmentsByDebtCase, type GetInstallmentsByDebtInput, type GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import { GetNextInstallmentsByRouteUseCase, type GetNextInstallmentsByRouteError, type GetNextInstallmentsByRouteInput, type GetNextInstallmentsByRouteOutput } from "../business/useCases/installment/GetNextInstallmentsByCollectorUseCase";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";

import { GetInstallmentsSummaryUseCase, type GetInstallmentsSummaryError, type GetInstallmentsSummaryInput, type GetInstallmentsSummaryOutput } from "../business/useCases/installment/GetInstallmentsSummaryUseCase";
import { GetManagementInstallmentsUseCase, type GetManagementInstallmentsError, type GetManagementInstallmentsInput, type GetManagementInstallmentsOutput } from "../business/useCases/installment/GetManagementInstallmentsUseCase";
import { GetManagementInstallmentsByRoutesUseCase, type GetManagementInstallmentsByRoutesError, type GetManagementInstallmentsByRoutesInput, type GetManagementInstallmentsByRoutesOutput } from "../business/useCases/installment/GetManagementInstallmentsByRoutesUseCase";
import { MarkInstallAsPaidCase, type MarkInstallAsPaidError, type MarkInstallAsPaidInput, type MarkInstallAsPaidOutput } from "../business/useCases/installment/MarkInstallAsPaidCase";
import { MarkInstallmentAsearringCase, type MarkInstallmentAsearringInput } from "../business/useCases/installment/MarkInstallmentAsearringCase";
import { MarkInstallmentAsCanceledCase, type MarkInstallmentAsCanceledInput } from "../business/useCases/installment/MarkInstallmentAsCanceledCase";
import type { InstallmentGateway } from "./InstallmentGateway";
import { BalancesDueFromInstallmentCase, type BalancesDueFromInstallmentError, type BalancesDueFromInstallmentInput, type BalancesDueFromInstallmentOutput } from "../business/useCases/installment/BalancesDueFromInstallmentCase";
import { MaxDueFromInstallmentCase, type MaxDueFromInstallmentError, type MaxDueFromInstallmentInput, type MaxDueFromInstallmentOutput } from "../business/useCases/installment/MaxDueFromInstallmentCase";
import {
  GetDebtPaymentCapacityCase,
  type GetDebtPaymentCapacityError,
  type GetDebtPaymentCapacityInput,
  type GetDebtPaymentCapacityOutput,
} from "../business/useCases/installment/GetDebtPaymentCapacityCase";
import {
  GetDebtsPaymentCapacitiesUseCase,
  type GetDebtsPaymentCapacitiesError,
  type GetDebtsPaymentCapacitiesInput,
  type GetDebtsPaymentCapacitiesOutput,
} from "../business/useCases/installment/GetDebtsPaymentCapacitiesUseCase";
import {
  GetInstallmentByDebtAndNumberUseCase,
  type GetInstallmentByDebtAndNumberError,
  type GetInstallmentByDebtAndNumberInput,
  type GetInstallmentByDebtAndNumberOutput,
} from "../business/useCases/installment/GetInstallmentByDebtAndNumberUseCase";

export default class InstallmentsOrchestrator {

  private readonly getByCollectorCase: GetByCollectorCase
  private readonly getByIdCase: GetByIdCase
  private readonly getManagementInstallmentsByRoutesUseCase: GetManagementInstallmentsByRoutesUseCase
  private readonly updateByIdCase: UpdateByIdCase
  private readonly markInstallAsPaidCase: MarkInstallAsPaidCase
  private readonly markInstallmentAsCanceledCase: MarkInstallmentAsCanceledCase
  private readonly markInstallmentAsearringCase: MarkInstallmentAsearringCase
  private readonly getByDebtCase: GetInstallmentsByDebtCase
  private readonly balancesDueFromInstallmentCase: BalancesDueFromInstallmentCase
  private readonly getNextByRouteCase: GetNextInstallmentsByRouteUseCase
  private readonly maxDueFromInstallmentCase: MaxDueFromInstallmentCase
  private readonly getDebtPaymentCapacityCase: GetDebtPaymentCapacityCase
  private readonly getDebtsPaymentCapacitiesCase: GetDebtsPaymentCapacitiesUseCase
  private readonly getInstallmentsSummaryCase: GetInstallmentsSummaryUseCase
  private readonly getManagementInstallmentsCase: GetManagementInstallmentsUseCase
  private readonly getByDebtAndNumberUseCase: GetInstallmentByDebtAndNumberUseCase


  constructor() {
    const installmentsGateway: InstallmentGateway = new FirebaseInstallmentRepository()
    const debtGateway: DebtGateway = new FirebaseDebtRepository()

    this.maxDueFromInstallmentCase = new MaxDueFromInstallmentCase(installmentsGateway)
    this.balancesDueFromInstallmentCase = new BalancesDueFromInstallmentCase(installmentsGateway)
    this.getDebtPaymentCapacityCase = new GetDebtPaymentCapacityCase(installmentsGateway, debtGateway)
    this.getDebtsPaymentCapacitiesCase = new GetDebtsPaymentCapacitiesUseCase(installmentsGateway, debtGateway)


    this.getManagementInstallmentsByRoutesUseCase = new GetManagementInstallmentsByRoutesUseCase(installmentsGateway)
    this.getByCollectorCase = new GetByCollectorCase(installmentsGateway)
    this.markInstallmentAsearringCase = new MarkInstallmentAsearringCase(installmentsGateway)
    this.getByIdCase = new GetByIdCase(installmentsGateway)
    this.markInstallmentAsCanceledCase = new MarkInstallmentAsCanceledCase(installmentsGateway)
    this.markInstallAsPaidCase = new MarkInstallAsPaidCase(installmentsGateway)
    this.updateByIdCase = new UpdateByIdCase(installmentsGateway)
    this.getByDebtCase = new GetInstallmentsByDebtCase(installmentsGateway)
    this.getNextByRouteCase = new GetNextInstallmentsByRouteUseCase(debtGateway, installmentsGateway)
    this.getInstallmentsSummaryCase = new GetInstallmentsSummaryUseCase(installmentsGateway)
    this.getManagementInstallmentsCase = new GetManagementInstallmentsUseCase(installmentsGateway)
    this.getByDebtAndNumberUseCase = new GetInstallmentByDebtAndNumberUseCase(installmentsGateway)
  }

  async getDebtPaymentCapacity(
    input: GetDebtPaymentCapacityInput
  ): Promise<Result<GetDebtPaymentCapacityOutput, GetDebtPaymentCapacityError>> {
    return this.getDebtPaymentCapacityCase.execute(input);
  }

  async getDebtsPaymentCapacities(
    input: GetDebtsPaymentCapacitiesInput
  ): Promise<Result<GetDebtsPaymentCapacitiesOutput, GetDebtsPaymentCapacitiesError>> {
    return this.getDebtsPaymentCapacitiesCase.execute(input);
  }

  async getInstallmentsSummary(input: GetInstallmentsSummaryInput): Promise<Result<GetInstallmentsSummaryOutput, GetInstallmentsSummaryError>> {
    return this.getInstallmentsSummaryCase.execute(input);
  }

  async balancesDueFromDebt(input: BalancesDueFromInstallmentInput): Promise<Result<BalancesDueFromInstallmentOutput, BalancesDueFromInstallmentError>> {
    return this.balancesDueFromInstallmentCase.execute(input);
  }

  async maxDueFromInstallment(input: MaxDueFromInstallmentInput): Promise<Result<MaxDueFromInstallmentOutput, MaxDueFromInstallmentError>> {
    return this.maxDueFromInstallmentCase.execute(input);
  }

  async updateById(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    return this.updateByIdCase.execute(input)
  }
  async markInstallmentAsCanceled(input: MarkInstallmentAsCanceledInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    return this.markInstallmentAsCanceledCase.execute(input);
  }

  async markInstallmentAsearring(input: MarkInstallmentAsearringInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    return this.markInstallmentAsearringCase.execute(input);
  }

  async getManagementInstallmentsByRoutes(input: GetManagementInstallmentsByRoutesInput): Promise<Result<GetManagementInstallmentsByRoutesOutput, GetManagementInstallmentsByRoutesError>> {
    return this.getManagementInstallmentsByRoutesUseCase.execute(input);
  }

  async markInstallAsPaid(input: MarkInstallAsPaidInput): Promise<Result<MarkInstallAsPaidOutput, MarkInstallAsPaidError>> {
    return this.markInstallAsPaidCase.execute(input);
  }

  async getByCollector(input: GetByCollectorInput): Promise<Result<GetByCollectorOutput, GetByCollectorError>> {
    return this.getByCollectorCase.execute(input);
  }

  async getById(input: GetByIdInput): Promise<Result<GetByIdOutput, GetByIdError>> {
    return this.getByIdCase.execute(input);
  }

  async getByDebt(input: GetInstallmentsByDebtInput): Promise<GetInstallmentsByDebtOutput> {
    return this.getByDebtCase.execute(input);
  }

  async getNextByRoute(input: GetNextInstallmentsByRouteInput): Promise<Result<GetNextInstallmentsByRouteOutput, GetNextInstallmentsByRouteError>> {
    return this.getNextByRouteCase.execute(input);
  }

  async getManagementInstallments(input: GetManagementInstallmentsInput): Promise<Result<GetManagementInstallmentsOutput, GetManagementInstallmentsError>> {
    return this.getManagementInstallmentsCase.execute(input);
  }

  async getByDebtAndNumber(
    input: GetInstallmentByDebtAndNumberInput
  ): Promise<Result<GetInstallmentByDebtAndNumberOutput, GetInstallmentByDebtAndNumberError>> {
    return this.getByDebtAndNumberUseCase.execute(input);
  }

};
