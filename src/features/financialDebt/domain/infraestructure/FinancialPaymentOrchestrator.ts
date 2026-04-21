import { FirebaseFinancialPaymentRepository } from "../../repository/FirebaseFinancialPaymentRepository";
import { RegisterFinancialPaymentUseCase, type RegisterFinancialPaymentInput, type RegisterFinancialPaymentError } from "../business/useCases/RegisterFinancialPaymentUseCase";
import { GetFinancialPaymentsByDebtUseCase, type GetFinancialPaymentsByDebtInput, type GetFinancialPaymentsByDebtError } from "../business/useCases/GetFinancialPaymentsByDebtUseCase";
import { GetFinancialPaymentByIdUseCase, type GetFinancialPaymentByIdInput, type GetFinancialPaymentByIdError } from "../business/useCases/GetFinancialPaymentByIdUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type FinancialPaymentGateway from "./FinancialPaymentGateway";
import type { FinancialPayment } from "../business/entities/FinancialPayment";

export default class FinancialPaymentOrchestrator {
    private registerFinancialPaymentUseCase: RegisterFinancialPaymentUseCase;
    private getFinancialPaymentsByDebtUseCase: GetFinancialPaymentsByDebtUseCase;
    private getFinancialPaymentByIdUseCase: GetFinancialPaymentByIdUseCase;
    private financialPaymentGateway: FinancialPaymentGateway;

    constructor() {
        this.financialPaymentGateway = new FirebaseFinancialPaymentRepository();
        this.registerFinancialPaymentUseCase = new RegisterFinancialPaymentUseCase(this.financialPaymentGateway);
        this.getFinancialPaymentsByDebtUseCase = new GetFinancialPaymentsByDebtUseCase(this.financialPaymentGateway);
        this.getFinancialPaymentByIdUseCase = new GetFinancialPaymentByIdUseCase(this.financialPaymentGateway);
    }

    async registerPayment(input: RegisterFinancialPaymentInput): Promise<Result<void, RegisterFinancialPaymentError>> {
        return this.registerFinancialPaymentUseCase.execute(input);
    }

    async getPaymentsByDebtId(input: GetFinancialPaymentsByDebtInput): Promise<Result<FinancialPayment[], GetFinancialPaymentsByDebtError>> {
        return this.getFinancialPaymentsByDebtUseCase.execute(input);
    }

    async getPaymentById(input: GetFinancialPaymentByIdInput): Promise<Result<FinancialPayment, GetFinancialPaymentByIdError>> {
        return this.getFinancialPaymentByIdUseCase.execute(input);
    }
}
