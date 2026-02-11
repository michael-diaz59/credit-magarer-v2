import type { Result } from "../../../../core/helpers/ResultC";
import { CreatePaymentCase, type CreatePaymentError, type CreatePaymentInput, type CreatePaymentOutput } from "../business/useCases/payment/CreatePayment";
import { FirebasePaymentRepository } from "../../provider/firebase/FirebasePaymentRepository";
import type { PaymentGateway } from "./PaymentGateway";

import { DeletePaymentCase, type DeletePaymentError, type DeletePaymentInput, type DeletePaymentOutput } from "../business/useCases/payment/DeletePaymentCase";
import { UploadProofCase, type UploadProofError, type UploadProofInput } from "../business/useCases/payment/UploadProofCase";
import { GetPaymentsByInstallmentCase } from "../business/useCases/payment/GetPaymentsByInstallmentCase";
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../business/useCases/payment/GetPaymentsByInstallmentCaseTypes";
import { GetPaymentByIdCase, type GetPaymentError, type GetPaymentInput, type GetPaymentOutput } from "../business/useCases/payment/GetPaymentByIdCase";

export default class PaymentOrchestrator {
    private readonly paymentGateway: PaymentGateway;
    private readonly createPaymentCase: CreatePaymentCase;
    private readonly deletePaymentCase: DeletePaymentCase;
    private readonly getPaymentById: GetPaymentByIdCase;
    private readonly uploadProofCase: UploadProofCase;
    private readonly getByInstallmentCase: GetPaymentsByInstallmentCase;

    constructor() {
        this.paymentGateway = new FirebasePaymentRepository();
        this.createPaymentCase = new CreatePaymentCase(this.paymentGateway);
        this.deletePaymentCase = new DeletePaymentCase(this.paymentGateway);
        this.getPaymentById = new GetPaymentByIdCase(this.paymentGateway)
        this.uploadProofCase = new UploadProofCase(this.paymentGateway);
        this.getByInstallmentCase = new GetPaymentsByInstallmentCase(this.paymentGateway);
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
}
