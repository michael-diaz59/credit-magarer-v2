import type { Result } from "../../../../core/helpers/ResultC";
import { CreatePaymentCase, type CreatePaymentError, type CreatePaymentInput, type CreatePaymentOutput } from "../business/useCases/payment/CreatePayment";
import { FirebasePaymentRepository } from "../../provider/firebase/FirebasePaymentRepository";
import type { Payment } from "../business/entities/Payment";
import type { PaymentGateway } from "./PaymentGateway";

import { DeletePaymentCase, type DeletePaymentError, type DeletePaymentInput, type DeletePaymentOutput } from "../business/useCases/payment/DeletePaymentCase";
import { UploadProofCase, type UploadProofError, type UploadProofInput } from "../business/useCases/payment/UploadProofCase";
import { GetPaymentsByInstallmentCase } from "../business/useCases/payment/GetPaymentsByInstallmentCase";
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../business/useCases/payment/GetPaymentsByInstallmentCaseTypes";
import { GetPaymentByIdCase, type GetPaymentError, type GetPaymentInput, type GetPaymentOutput } from "../business/useCases/payment/GetPaymentByIdCase";
import { RegisterPaymentUseCase, type RegisterPaymentInput, type RegisterPaymentOutput, type RegisterPaymentError } from "../business/useCases/payment/RegisterPaymentUseCase";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { GetPaymentsByStatusUseCase, type GetPaymentsByStatusInput, type GetPaymentsByStatusOutput } from "../business/useCases/payment/GetPaymentsByStatusUseCase";
import { UpdatePaymentStatusUseCase, type UpdatePaymentError } from "../business/useCases/payment/UpdatePaymentStatusUseCase";
import { FirebaseRouteRepository } from "../../../routes/provider/firebase/FirebaseRouteRepository";
import { UpdatePaymentUseCase, type UpdatePaymentInput as UpdatePaymentFullInput, type UpdatePaymentOutput as UpdatePaymentFullOutput, type UpdatePaymentError as UpdatePaymentFullError } from "../business/useCases/payment/UpdatePaymentUseCase";
import { UpdateMultiplePaymentsIsTightUseCase, type UpdateMultiplePaymentsIsTightError, type UpdateMultiplePaymentsIsTightInput, type UpdateMultiplePaymentsIsTightOutput } from "../business/useCases/payment/UpdateMultiplePaymentsIsTight";

export default class PaymentOrchestrator {
    private readonly paymentGateway: PaymentGateway;
    private readonly createPaymentCase: CreatePaymentCase;
    private readonly deletePaymentCase: DeletePaymentCase;
    private readonly getPaymentById: GetPaymentByIdCase;
    private readonly uploadProofCase: UploadProofCase;
    private readonly getByInstallmentCase: GetPaymentsByInstallmentCase;
    private readonly registerPaymentCase: RegisterPaymentUseCase;
    private readonly getPaymentsByStatusCase: GetPaymentsByStatusUseCase;
    private readonly updatePaymentStatusCase: UpdatePaymentStatusUseCase;
    private readonly updatePaymentUseCase: UpdatePaymentUseCase;
    private readonly updateMultiplePaymentsIsTightUseCase: UpdateMultiplePaymentsIsTightUseCase;

    constructor() {
        this.paymentGateway = new FirebasePaymentRepository();
        this.createPaymentCase = new CreatePaymentCase(this.paymentGateway);
        this.deletePaymentCase = new DeletePaymentCase(this.paymentGateway);
        this.getPaymentById = new GetPaymentByIdCase(this.paymentGateway)
        this.uploadProofCase = new UploadProofCase(this.paymentGateway);
        this.getByInstallmentCase = new GetPaymentsByInstallmentCase(this.paymentGateway);

        const installmentGateway = new FirebaseInstallmentRepository();
        const debtGateway = new FirebaseDebtRepository();
        this.registerPaymentCase = new RegisterPaymentUseCase(this.paymentGateway, installmentGateway, debtGateway);
        
        const routeGateway = new FirebaseRouteRepository();
        this.getPaymentsByStatusCase = new GetPaymentsByStatusUseCase(this.paymentGateway);
        this.updatePaymentStatusCase = new UpdatePaymentStatusUseCase(this.paymentGateway, routeGateway);
        this.updatePaymentUseCase = new UpdatePaymentUseCase(this.paymentGateway);
        this.updateMultiplePaymentsIsTightUseCase = new UpdateMultiplePaymentsIsTightUseCase(this.paymentGateway);
    }

    async registerPayment(input: RegisterPaymentInput): Promise<Result<RegisterPaymentOutput, RegisterPaymentError>> {
        return this.registerPaymentCase.execute(input);
    }

    async createPayment(input: CreatePaymentInput): Promise<Result<CreatePaymentOutput, CreatePaymentError>> {
        return this.createPaymentCase.execute(input);
    }

    async deletePayment(input: DeletePaymentInput): Promise<Result<DeletePaymentOutput, DeletePaymentError>> {
        return this.deletePaymentCase.execute(input);
    }

    async uploadProof(input: UploadProofInput): Promise<Result<string, UploadProofError>> {
        return this.uploadProofCase.execute(input);
    }

    async getByInstallment(input: GetPaymentsByInstallmentInput): Promise<GetPaymentsByInstallmentOutput> {
        return this.getByInstallmentCase.execute(input);
    }

    getById(
        input: GetPaymentInput
    ): Promise<Result<GetPaymentOutput, GetPaymentError>> {
        return this.getPaymentById.execute(input);
    }

    generatePaymentId(companyId: string): string {
        return this.paymentGateway.generateId(companyId);
    }

    async getByDate(companyId: string, date: string): Promise<Result<Payment[], any>> {
        return this.paymentGateway.getAllByDate(companyId, date);
    }

    async getByStatus(input: GetPaymentsByStatusInput): Promise<GetPaymentsByStatusOutput> {
        return this.getPaymentsByStatusCase.execute(input);
    }

    async updatePaymentsStatus(input: { companyId: string, payments: Payment[], newStatus: Payment["status"] }): Promise<Result<{ updatedCount: number }, UpdatePaymentError>> {
        return this.updatePaymentStatusCase.execute(input);
    }

    async updatePayment(input: UpdatePaymentFullInput): Promise<Result<UpdatePaymentFullOutput, UpdatePaymentFullError>> {
        return this.updatePaymentUseCase.execute(input);
    }

    async updateMultipleIsTight(input: UpdateMultiplePaymentsIsTightInput): Promise<Result<UpdateMultiplePaymentsIsTightOutput, UpdateMultiplePaymentsIsTightError>> {
        return this.updateMultiplePaymentsIsTightUseCase.execute(input);
    }
}
