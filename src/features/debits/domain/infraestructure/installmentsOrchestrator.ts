import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { GetByCollectorCase, type GetByCollectorError, type GetByCollectorInput, type GetByCollectorOutput } from "../business/useCases/installment/GetByCollectorCase";
import { GetByIdCase, type GetByIdError, type GetByIdInput, type GetByIdOutput } from "../business/useCases/installment/GetByIdCase";
import { UpdateByIdCase, type UpdateByIdError, type UpdateByIdInput, type UpdateByIdOutput } from "../business/useCases/installment/UpdateByIdCase";
import type { InstallmentGateway, DebtGateway } from "./DebtGatweay";
import { GetInstallmentsByDebtCase, type GetInstallmentsByDebtInput, type GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import { GetNextInstallmentsByRouteUseCase, type GetNextInstallmentsByRouteError, type GetNextInstallmentsByRouteInput, type GetNextInstallmentsByRouteOutput } from "../business/useCases/installment/GetNextInstallmentsByCollectorUseCase";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";

import { GetInstallmentsSummaryUseCase, type GetInstallmentsSummaryError, type GetInstallmentsSummaryInput, type GetInstallmentsSummaryOutput } from "../business/useCases/installment/GetInstallmentsSummaryUseCase";
import { GetManagementInstallmentsUseCase, type GetManagementInstallmentsError, type GetManagementInstallmentsInput, type GetManagementInstallmentsOutput } from "../business/useCases/installment/GetManagementInstallmentsUseCase";
import { GetManagementInstallmentsByRoutesUseCase, type GetManagementInstallmentsByRoutesError, type GetManagementInstallmentsByRoutesInput, type GetManagementInstallmentsByRoutesOutput } from "../business/useCases/installment/GetManagementInstallmentsByRoutesUseCase";

export default class InstallmentsOrchestrator {

  private readonly getByCollectorCase: GetByCollectorCase
  private readonly getByIdCase: GetByIdCase
  private readonly getManagementInstallmentsByRoutesUseCase: GetManagementInstallmentsByRoutesUseCase
  private readonly updateByIdCase: UpdateByIdCase
  private readonly getByDebtCase: GetInstallmentsByDebtCase
  private readonly getNextByRouteCase: GetNextInstallmentsByRouteUseCase
  private readonly getInstallmentsSummaryCase: GetInstallmentsSummaryUseCase
  private readonly getManagementInstallmentsCase: GetManagementInstallmentsUseCase


  constructor() {
    const installmentsGateway: InstallmentGateway = new FirebaseInstallmentRepository()
    const debtGateway: DebtGateway = new FirebaseDebtRepository()


    this.getManagementInstallmentsByRoutesUseCase = new GetManagementInstallmentsByRoutesUseCase(installmentsGateway)
    this.getByCollectorCase = new GetByCollectorCase(installmentsGateway)
    this.getByIdCase = new GetByIdCase(installmentsGateway)
    this.updateByIdCase = new UpdateByIdCase(installmentsGateway)
    this.getByDebtCase = new GetInstallmentsByDebtCase(installmentsGateway)
    this.getNextByRouteCase = new GetNextInstallmentsByRouteUseCase(debtGateway, installmentsGateway)
    this.getInstallmentsSummaryCase = new GetInstallmentsSummaryUseCase(installmentsGateway)
    this.getManagementInstallmentsCase = new GetManagementInstallmentsUseCase(installmentsGateway)
  }

  async getInstallmentsSummary(input: GetInstallmentsSummaryInput): Promise<Result<GetInstallmentsSummaryOutput, GetInstallmentsSummaryError>> {
    return this.getInstallmentsSummaryCase.execute(input);
  }

  async updateById(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    return this.updateByIdCase.execute(input)
  }

  async getManagementInstallmentsByRoutes(input: GetManagementInstallmentsByRoutesInput): Promise<Result<GetManagementInstallmentsByRoutesOutput, GetManagementInstallmentsByRoutesError>> {
    return this.getManagementInstallmentsByRoutesUseCase.execute(input);
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

};
