import type { Result } from "../../../../core/helpers/ResultC"
import { FirebaseCostumerRepository } from "../../repository/FirebaseCostumerRepository"
import type { Customer } from "../business/entities/Customer"
import type { GetCostumersErrors, SaveCostumerError } from "../business/entities/utilities"
import { GetCostumerByIdCase } from "../business/useCases/GetCostumerByIdCase"
import { GetCostumersCase } from "../business/useCases/GetCostumersCase"
import { CreateCostumerCase, type SaveCostumerInput } from "../business/useCases/CreateCostumerCase"
import type CostumerGateway from "./CostumerGateway"
import { UpdateCostumerCase, type UpdateCostumerInput } from "../business/useCases/UpdateCostumerCase"
import { DeleteCostumerCase, type DeleteCostumerInput } from "../business/useCases/DeleteCostumerCase"
import { GetCostumerByIdNumberCase, type GetCostumerByIdNumberInput, type GetCostumerByIdNumberOutput } from "../business/useCases/GetCostumerByIdNumber"
import { GetCustomersListCase, type GetCustomersListInput, type GetCustomersListOutput } from "../business/useCases/GetCustomersListCase"
//import type VisitGateway from "../../../visits/domain/infraestructure/VisitGateway"
//import FirebaseVisitRepository from "../../../visits/repository/firebase/FirebaseVisitRepository"
//import GetVisitByCedulaCase from "../../../visits/domain/business/useCases/getVisitByCedulaCase"
//import { GetDebstByCostumerDocumentCase } from "../../../debits/domain/business/useCases/debt/GetDebstByCostumerDocumentCase"
//import type { DebtGateway } from "../../../debits/domain/infraestructure/DebtGatweay"
//import { FirebaseDebtRepository } from "../../../debits/provider/firebase/DebtRepository"

export default class CustomerOrchestrator {
    private createCostumerCase: CreateCostumerCase
    private getCostumersCase: GetCostumersCase
    private getCostumerByIdCase: GetCostumerByIdCase
    private updateCosatumerCase:UpdateCostumerCase
    private delateCostumercase:DeleteCostumerCase
    private getCustomersListCase: GetCustomersListCase

    //private getVisitByCedulaCase:GetVisitByCedulaCase
    //private debtGateway: DebtGateway
    //private getDebstByCostumerDocument:GetDebstByCostumerDocumentCase
    private costumerGateway: CostumerGateway
    //private visitGateway: VisitGateway
    private getCostumerByIdNumberCase: GetCostumerByIdNumberCase


    constructor() {
        //this.debtGateway= new FirebaseDebtRepository()
        //this.getDebstByCostumerDocument= new GetDebstByCostumerDocumentCase(this.debtGateway)
        this.costumerGateway = new FirebaseCostumerRepository()
        //this.visitGateway= new FirebaseVisitRepository()
        this.getCostumersCase = new GetCostumersCase(this.costumerGateway)
        this.getCostumerByIdNumberCase= new GetCostumerByIdNumberCase(this.costumerGateway)
        //this.getVisitByCedulaCase= new GetVisitByCedulaCase(this.visitGateway)
        this.createCostumerCase = new CreateCostumerCase(this.costumerGateway)
        this.getCustomersListCase= new GetCustomersListCase(this.costumerGateway)
        this.updateCosatumerCase= new UpdateCostumerCase(this.costumerGateway)
        this.delateCostumercase= new DeleteCostumerCase(this.costumerGateway)
        this.getCostumerByIdCase = new GetCostumerByIdCase(this.costumerGateway)
    }

    async getCostumerByIdNumber(input: GetCostumerByIdNumberInput):Promise<GetCostumerByIdNumberOutput>{
        const result= this.getCostumerByIdNumberCase.execute(input)

        return result
    }

    async getCustomersList( input: GetCustomersListInput): Promise<Result<GetCustomersListOutput,GetCostumersErrors>>{
        const customers= await this.getCustomersListCase.execute(input)
        return customers
    }




    //no se puede actualizar la cedula
    
    async updateCostumer(input :UpdateCostumerInput):Promise<Result<null, SaveCostumerError>>{
        const update=await this.updateCosatumerCase.execute(input)
         //al actualizar costumer se debe actualizar la informacion de direccion del debito 

        return update
    }

    async deleteCostumer(delateCostumerInput:DeleteCostumerInput): Promise<Result<null, SaveCostumerError>>{

        const deleteResult: Promise<Result<null, SaveCostumerError>> =  this.delateCostumercase.execute(delateCostumerInput)
        return deleteResult
    }

    async getCostumers(companyId: string): Promise<Result<Customer[], GetCostumersErrors>> {
        console.group("[CostumerOrchestrator] getCostumers")
        console.log("companyId:", companyId)
        const costumers: Result<Customer[], GetCostumersErrors> = await this.getCostumersCase.execute({ companyId: companyId })
        console.log("result.ok:", costumers.ok)
        if (costumers.ok) {
            console.log("costumers count:", costumers.value.length)
            console.table(
                costumers.value.map(c => ({
                    id: c.id,
                    applicant: c.applicant?.fullName ?? "N/A"
                }))
            )
        } else {
            console.error("error:", costumers.error)
        }

        return costumers
    }

    async createCostumer(input :SaveCostumerInput): Promise<Result<null, SaveCostumerError>> {
        const saveCostumer: Result<null, SaveCostumerError> = await this.createCostumerCase.execute(input)
        return saveCostumer
    }

    async getCostumerById(companyId: string, costumerId: string): Promise<Result<Customer | null, GetCostumersErrors>> {
        const costumers: Result<Customer | null, GetCostumersErrors> = await this.getCostumerByIdCase.execute({ companyId: companyId, costumerId: costumerId })
        return costumers
    }

}