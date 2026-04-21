import { FirebaseAnotherPaymentRepository } from "../../repository/FirebaseAnotherPaymentRepository";
import { CreateAnotherPaymentUseCase, type CreateAnotherPaymentInput, type CreateAnotherPaymentOutput, type CreateAnotherPaymentError } from "../business/useCases/CreateAnotherPaymentUseCase";
import { GetAnotherPaymentsByCompanyUseCase, type GetAnotherPaymentsByCompanyInput, type GetAnotherPaymentsByCompanyOutput, type GetAnotherPaymentsByCompanyError } from "../business/useCases/GetAnotherPaymentsByCompanyUseCase";
import { UpdateAnotherPaymentUseCase, type UpdateAnotherPaymentInput, type UpdateAnotherPaymentOutput, type UpdateAnotherPaymentError } from "../business/useCases/UpdateAnotherPaymentUseCase";
import { GetAnotherPaymentByIdUseCase, type GetAnotherPaymentByIdInput, type GetAnotherPaymentByIdOutput, type GetAnotherPaymentByIdError } from "../business/useCases/GetAnotherPaymentByIdUseCase";
import { DeleteAnotherPaymentUseCase, type DeleteAnotherPaymentInput, type DeleteAnotherPaymentOutput, type DeleteAnotherPaymentError } from "../business/useCases/DeleteAnotherPaymentUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type AnotherPaymentGateway from "./AnotherPaymentGateway";

export default class AnotherPaymentOrchestrator {
    private createAnotherPaymentUseCase: CreateAnotherPaymentUseCase;
    private getAnotherPaymentsByCompanyUseCase: GetAnotherPaymentsByCompanyUseCase;
    private updateAnotherPaymentUseCase: UpdateAnotherPaymentUseCase;
    private getAnotherPaymentByIdUseCase: GetAnotherPaymentByIdUseCase;
    private deleteAnotherPaymentUseCase: DeleteAnotherPaymentUseCase;
    private gateway: AnotherPaymentGateway;

    constructor() {
        this.gateway = new FirebaseAnotherPaymentRepository();
        this.createAnotherPaymentUseCase = new CreateAnotherPaymentUseCase(this.gateway);
        this.getAnotherPaymentsByCompanyUseCase = new GetAnotherPaymentsByCompanyUseCase(this.gateway);
        this.updateAnotherPaymentUseCase = new UpdateAnotherPaymentUseCase(this.gateway);
        this.getAnotherPaymentByIdUseCase = new GetAnotherPaymentByIdUseCase(this.gateway);
        this.deleteAnotherPaymentUseCase = new DeleteAnotherPaymentUseCase(this.gateway);
    }

    async createAnotherPayment(input: CreateAnotherPaymentInput): Promise<Result<CreateAnotherPaymentOutput, CreateAnotherPaymentError>> {
        return this.createAnotherPaymentUseCase.execute(input);
    }

    async getAnotherPaymentsByCompany(input: GetAnotherPaymentsByCompanyInput): Promise<Result<GetAnotherPaymentsByCompanyOutput, GetAnotherPaymentsByCompanyError>> {
        return this.getAnotherPaymentsByCompanyUseCase.execute(input);
    }

    async updateAnotherPayment(input: UpdateAnotherPaymentInput): Promise<Result<UpdateAnotherPaymentOutput, UpdateAnotherPaymentError>> {
        return this.updateAnotherPaymentUseCase.execute(input);
    }

    async getAnotherPaymentById(input: GetAnotherPaymentByIdInput): Promise<Result<GetAnotherPaymentByIdOutput, GetAnotherPaymentByIdError>> {
        return this.getAnotherPaymentByIdUseCase.execute(input);
    }

    async deleteAnotherPayment(input: DeleteAnotherPaymentInput): Promise<Result<DeleteAnotherPaymentOutput, DeleteAnotherPaymentError>> {
        return this.deleteAnotherPaymentUseCase.execute(input);
    }
}
