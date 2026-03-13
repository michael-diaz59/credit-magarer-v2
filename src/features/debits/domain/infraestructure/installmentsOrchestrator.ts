import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { GetByCollectorCase, type GetByCollectorError, type GetByCollectorInput, type GetByCollectorOutput } from "../business/useCases/installment/GetByCollectorCase";
import { GetByIdCase, type GetByIdError, type GetByIdInput, type GetByIdOutput } from "../business/useCases/installment/GetByIdCase";
import { UpdateByIdCase, type UpdateByIdError, type UpdateByIdInput, type UpdateByIdOutput } from "../business/useCases/installment/UpdateByIdCase";
import type { InstallmentGateway, DebtGateway } from "./DebtGatweay";
import { GetInstallmentsByDebtCase, type GetInstallmentsByDebtInput, type GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import { GetNextInstallmentsByCollectorUseCase, type GetNextInstallmentsByCollectorError, type GetNextInstallmentsByCollectorInput, type GetNextInstallmentsByCollectorOutput } from "../business/useCases/installment/GetNextInstallmentsByCollectorUseCase";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";

export default class InstallmentsOrchestrator {

  private readonly getByCollectorCase: GetByCollectorCase
  private readonly getByIdCase: GetByIdCase
  private readonly updateByIdCase: UpdateByIdCase
  private readonly getByDebtCase: GetInstallmentsByDebtCase
  private readonly getNextByCollectorCase: GetNextInstallmentsByCollectorUseCase


  constructor() {
    const installmentsGateway: InstallmentGateway = new FirebaseInstallmentRepository()
    const debtGateway: DebtGateway = new FirebaseDebtRepository()
    this.getByCollectorCase = new GetByCollectorCase(installmentsGateway)
    this.getByIdCase = new GetByIdCase(installmentsGateway)
    this.updateByIdCase = new UpdateByIdCase(installmentsGateway)
    this.getByDebtCase = new GetInstallmentsByDebtCase(installmentsGateway)
    this.getNextByCollectorCase = new GetNextInstallmentsByCollectorUseCase(debtGateway, installmentsGateway)
  }

  async updateById(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    return this.updateByIdCase.execute(input)
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

  async getNextByCollector(input: GetNextInstallmentsByCollectorInput): Promise<Result<GetNextInstallmentsByCollectorOutput, GetNextInstallmentsByCollectorError>> {
    return this.getNextByCollectorCase.execute(input);
  }

};
