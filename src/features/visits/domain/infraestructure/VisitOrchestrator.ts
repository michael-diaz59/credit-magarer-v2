import type { Result } from "../../../../core/helpers/ResultC"
import FirebaseVisitRepository from "../../repository/firebase/FirebaseVisitRepository"
import type { visitErros } from "../business/entities/types"
import { CreateVisitUseCase, type CreateVisitInput, type CreateVisitOutput } from "../business/useCases/CreateVisitUseCase"
import DeleteVisitCase, { type DeleteVisitInput, type DeleteVisitOutput } from "../business/useCases/deleteVisitCase"
import EditVisitCase, { type EditVisitInput, type EditVisitOutput } from "../business/useCases/EditVisitCase"
import GetVisitByCedulaCase, { type GetVisitByCedulaInput, type GetVisitByCedulaOutput } from "../business/useCases/getVisitByCedulaCase"
import { GetVisitByIdCase, type GetVisitByIdInput, type GetVisitByIdOutput } from "../business/useCases/GetVisitByIdCase"
import { GetVisitByStateCase, type GetVisitByStateInput, type GetVisitByStateOutput } from "../business/useCases/GetVisitByStateCase"
import { GetVisitsByCustomerDocumentCase, type GetVisitsByCustomerDocumentInput, type GetVisitsByCustomerDocumentOutput } from "../business/useCases/GetVisitsByCustomerDocumentCase"
import GetVisitsCase, { type GetVisitsInput, type GetVisitsOutput } from "../business/useCases/getVisitsCase"
import type VisitGateway from "./VisitGateway"
import { CreateVisitWithDebtUseCase, type CreateVisitWithDebtInput } from "../business/useCases/CreateVisitWithDebtUseCase"
import { FirebaseDebtRepository } from "../../../debits/provider/firebase/DebtRepository"
import type { DebtGateway } from "../../../debits/domain/infraestructure/DebtGatweay"


export default class VisitOrchestrator {

    private createVisitCase: CreateVisitUseCase
    private createVisitWithDebtCase: CreateVisitWithDebtUseCase
    private getVisitByIdCase: GetVisitByIdCase
    private getVisitByCedulaCase: GetVisitByCedulaCase
    private deleteVisitCase: DeleteVisitCase
    private editVisitCase: EditVisitCase
    private getVisitsCase: GetVisitsCase
    private getVisitByStateCase: GetVisitByStateCase
    private getVisitsByCustomerDocumentCase: GetVisitsByCustomerDocumentCase

    constructor(
    ) {
        const repository: VisitGateway = new FirebaseVisitRepository()
        const debtRepository: DebtGateway = new FirebaseDebtRepository()

        this.createVisitCase = new CreateVisitUseCase(repository)
        this.createVisitWithDebtCase = new CreateVisitWithDebtUseCase(repository, debtRepository)
        this.getVisitByStateCase = new GetVisitByStateCase(repository)
        this.getVisitsCase = new GetVisitsCase(repository)
        this.getVisitByIdCase = new GetVisitByIdCase(repository)
        this.getVisitsByCustomerDocumentCase = new GetVisitsByCustomerDocumentCase(repository)
        this.getVisitByCedulaCase = new GetVisitByCedulaCase(repository)
        this.deleteVisitCase = new DeleteVisitCase(repository)
        this.editVisitCase = new EditVisitCase(repository)
    }

    async createVisit(input: CreateVisitInput): Promise<CreateVisitOutput> {
        const result = await this.createVisitCase.execute(input)
        return result

    }

    async createVisitWithDebt(input: CreateVisitWithDebtInput): Promise<CreateVisitOutput> {
        return await this.createVisitWithDebtCase.execute(input)
    }
    async getVisitById(input: GetVisitByIdInput): Promise<GetVisitByIdOutput> {
        const result = await this.getVisitByIdCase.execute(input)
        return result

    }

    async getVisitByCedula(input: GetVisitByCedulaInput): Promise<GetVisitByCedulaOutput> {
        const result = await this.getVisitByCedulaCase.execute(input)
        return result
    }

    async getVisitByState(input: GetVisitByStateInput): Promise<GetVisitByStateOutput> {
        const result = await this.getVisitByStateCase.execute(input)
        return result
    }

    async getVisitsByCustomerDocument(input: GetVisitsByCustomerDocumentInput): Promise<Result<GetVisitsByCustomerDocumentOutput, visitErros>> {
        return await this.getVisitsByCustomerDocumentCase.execute(input)
    }

    async getVisits(input: GetVisitsInput): Promise<GetVisitsOutput> {
        const result = await this.getVisitsCase.execute(input)
        return result
    }

    async editVisit(input: EditVisitInput): Promise<EditVisitOutput> {
        const result = await this.editVisitCase.execute(input)
        return result
    }

    async deleVisit(input: DeleteVisitInput): Promise<DeleteVisitOutput> {
        const result = await this.deleteVisitCase.execute(input)
        return result
    }


}
