
import { FirebaseFinancialDebtRepository } from "../../repository/FirebaseFinancialDebtRepository";
import { CreateFinancialDebtUseCase, type CreateFinancialDebtInput, type CreateFinancialDebtOutput, type CreateFinancialDebtError } from "../business/useCases/CreateFinancialDebtUseCase";
import { UpdateFinancialDebtUseCase, type UpdateFinancialDebtInput, type UpdateFinancialDebtError } from "../business/useCases/UpdateFinancialDebtUseCase";
import { GetFinancialDebtsUseCase, type GetFinancialDebtsInput } from "../business/useCases/GetFinancialDebtsUseCase";
import { GetFinancialDebtByIdUseCase, type GetFinancialDebtByIdInput } from "../business/useCases/GetFinancialDebtByIdUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type FinancialDebtGateway from "./FinancialDebtGateway";
import type { FinancialDebt } from "../business/entities/FinancialDebt";

export default class FinancialDebtOrchestrator {
    private createFinancialDebtUseCase: CreateFinancialDebtUseCase;
    private updateFinancialDebtUseCase: UpdateFinancialDebtUseCase;
    private getFinancialDebtsUseCase: GetFinancialDebtsUseCase;
    private getFinancialDebtByIdUseCase: GetFinancialDebtByIdUseCase;
    private financialDebtGateway: FinancialDebtGateway;

    constructor() {
        this.financialDebtGateway = new FirebaseFinancialDebtRepository();
        this.createFinancialDebtUseCase = new CreateFinancialDebtUseCase(this.financialDebtGateway);
        this.updateFinancialDebtUseCase = new UpdateFinancialDebtUseCase(this.financialDebtGateway);
        this.getFinancialDebtsUseCase = new GetFinancialDebtsUseCase(this.financialDebtGateway);
        this.getFinancialDebtByIdUseCase = new GetFinancialDebtByIdUseCase(this.financialDebtGateway);
    }

    async createFinancialDebt(input: CreateFinancialDebtInput): Promise<Result<CreateFinancialDebtOutput, CreateFinancialDebtError>> {
        return this.createFinancialDebtUseCase.execute(input);
    }

    async updateFinancialDebt(input: UpdateFinancialDebtInput): Promise<Result<void, UpdateFinancialDebtError>> {
        return this.updateFinancialDebtUseCase.execute(input);
    }

    async getAllFinancialDebts(input: GetFinancialDebtsInput): Promise<Result<FinancialDebt[], Error>> {
        return this.getFinancialDebtsUseCase.execute(input);
    }

    async getFinancialDebtById(input: GetFinancialDebtByIdInput): Promise<Result<FinancialDebt | null, Error>> {
        return this.getFinancialDebtByIdUseCase.execute(input);
    }
}
