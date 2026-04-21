import { FirebaseTaxtRepository } from "../../repository/FirebaseTaxtRepository";
import { CreateTaxtPaymentUseCase, type CreateTaxtPaymentInput, type CreateTaxtPaymentOutput, type CreateTaxtPaymentError } from "../business/useCases/CreateTaxtPaymentUseCase";
import { GetTaxtPaymentsByCompanyUseCase, type GetTaxtPaymentsByCompanyInput, type GetTaxtPaymentsByCompanyOutput, type GetTaxtPaymentsByCompanyError } from "../business/useCases/GetTaxtPaymentsByCompanyUseCase";
import { UpdateTaxtPaymentUseCase, type UpdateTaxtPaymentInput, type UpdateTaxtPaymentOutput, type UpdateTaxtPaymentError } from "../business/useCases/UpdateTaxtPaymentUseCase";
import { GetTaxtPaymentByIdUseCase, type GetTaxtPaymentByIdInput, type GetTaxtPaymentByIdOutput, type GetTaxtPaymentByIdError } from "../business/useCases/GetTaxtPaymentByIdUseCase";
import { DeleteTaxtPaymentUseCase, type DeleteTaxtPaymentInput, type DeleteTaxtPaymentOutput, type DeleteTaxtPaymentError } from "../business/useCases/DeleteTaxtPaymentUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type TaxtGateway from "./TaxtGateway";

export default class TaxtOrchestrator {
    private createTaxtPaymentUseCase: CreateTaxtPaymentUseCase;
    private getTaxtPaymentsByCompanyUseCase: GetTaxtPaymentsByCompanyUseCase;
    private updateTaxtPaymentUseCase: UpdateTaxtPaymentUseCase;
    private getTaxtPaymentByIdUseCase: GetTaxtPaymentByIdUseCase;
    private deleteTaxtPaymentUseCase: DeleteTaxtPaymentUseCase;
    private gateway: TaxtGateway;

    constructor() {
        this.gateway = new FirebaseTaxtRepository();
        this.createTaxtPaymentUseCase = new CreateTaxtPaymentUseCase(this.gateway);
        this.getTaxtPaymentsByCompanyUseCase = new GetTaxtPaymentsByCompanyUseCase(this.gateway);
        this.updateTaxtPaymentUseCase = new UpdateTaxtPaymentUseCase(this.gateway);
        this.getTaxtPaymentByIdUseCase = new GetTaxtPaymentByIdUseCase(this.gateway);
        this.deleteTaxtPaymentUseCase = new DeleteTaxtPaymentUseCase(this.gateway);
    }

    async createTaxtPayment(input: CreateTaxtPaymentInput): Promise<Result<CreateTaxtPaymentOutput, CreateTaxtPaymentError>> {
        return this.createTaxtPaymentUseCase.execute(input);
    }

    async getTaxtPaymentsByCompany(input: GetTaxtPaymentsByCompanyInput): Promise<Result<GetTaxtPaymentsByCompanyOutput, GetTaxtPaymentsByCompanyError>> {
        return this.getTaxtPaymentsByCompanyUseCase.execute(input);
    }

    async updateTaxtPayment(input: UpdateTaxtPaymentInput): Promise<Result<UpdateTaxtPaymentOutput, UpdateTaxtPaymentError>> {
        return this.updateTaxtPaymentUseCase.execute(input);
    }

    async getTaxtPaymentById(input: GetTaxtPaymentByIdInput): Promise<Result<GetTaxtPaymentByIdOutput, GetTaxtPaymentByIdError>> {
        return this.getTaxtPaymentByIdUseCase.execute(input);
    }

    async deleteTaxtPayment(input: DeleteTaxtPaymentInput): Promise<Result<DeleteTaxtPaymentOutput, DeleteTaxtPaymentError>> {
        return this.deleteTaxtPaymentUseCase.execute(input);
    }
}
