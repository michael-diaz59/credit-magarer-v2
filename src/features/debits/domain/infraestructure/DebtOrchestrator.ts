import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { CreateDebtUseCase, type CreateDebtUInput, type CreateDebtUOutput } from "../business/useCases/debt/CreateDebtUseCase";
import { GetDebitByIdCase, type GetDebitByIdInput, type GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import { GetDebstByCostumerDocumentCase, type GetDebstByCostumerDocumentInput, type GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import { GetDebtsCase, type GetDebtsInput, type GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";
import { UpdateDebtUseCase, type UpdateDebitInput, type UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import { GetInstallmentsByDebtCase, type GetInstallmentsByDebtInput, type GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import { UpdateInstallmentByDebtCase, type UpdateInstallmentByDebtInput, type UpdateInstallmentByDebtOutput } from "../business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { DebtGateway, InstallmentGateway } from "./DebtGatweay";

export default class DebtOrchestrator {

    private createDebtCase:CreateDebtUseCase
    private getDebtsCase:GetDebtsCase
    private getDebitByIdCase:GetDebitByIdCase
    private getDebstByCostumerDocumentCase: GetDebstByCostumerDocumentCase
    private updateDebtUseCase:UpdateDebtUseCase
    private debtGateway:DebtGateway

    private getInstallmentsByDebtCase:GetInstallmentsByDebtCase
    private updateInstallmentByDebtCase: UpdateInstallmentByDebtCase
    private installmentGateway: InstallmentGateway


    constructor() {
            this.debtGateway = new FirebaseDebtRepository()
            this.installmentGateway = new FirebaseInstallmentRepository()
            this.createDebtCase = new CreateDebtUseCase(this.debtGateway)
            this.getDebitByIdCase= new GetDebitByIdCase(this.debtGateway)
            this.getDebtsCase= new GetDebtsCase(this.debtGateway)
            this.getDebstByCostumerDocumentCase = new GetDebstByCostumerDocumentCase(this.debtGateway)
            this.updateDebtUseCase= new UpdateDebtUseCase(this.debtGateway,this.installmentGateway)
            this.getInstallmentsByDebtCase=new GetInstallmentsByDebtCase(this.installmentGateway)
            this.updateInstallmentByDebtCase= new UpdateInstallmentByDebtCase(this.installmentGateway)
        }

        async  getDebts(input:GetDebtsInput ):Promise<GetDebtsOutput> {
              return this.getDebtsCase.execute(input)
        }

        async createDebt(input: CreateDebtUInput): Promise<CreateDebtUOutput>{
            return this.createDebtCase.execute(input)
        }

         async getDebitById(input: GetDebitByIdInput): Promise<GetDebitByIdOutput>{
            return this.getDebitByIdCase.execute(input)
        } 
         async getDebstByCostumerDocument(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput>{
            return this.getDebstByCostumerDocumentCase.execute(input)
        } 

          async updateDebtUse(input: UpdateDebitInput): Promise<UpdateDebitOutput>{
            return this.updateDebtUseCase.execute(input)
        } 
        

         async getInstallmentsByDebt(input: GetInstallmentsByDebtInput): Promise<GetInstallmentsByDebtOutput>{
            return this.getInstallmentsByDebtCase.execute(input)
        } 

         async updateInstallmentByDebt(input: UpdateInstallmentByDebtInput): Promise<UpdateInstallmentByDebtOutput>{
            return this.updateInstallmentByDebtCase.execute(input)
        } 
    

}