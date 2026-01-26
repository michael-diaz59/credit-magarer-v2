import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type {DebtGateway, InstallmentGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { GetInstallmentsByDebtCase } from "../installment/GetInstallmentsByDebtCase";
import { UpdateInstallmentByDebtCase } from "../installment/UpdateInstallmentsByDebtCase";


export type UpdateDebtError =
    | { code: "WITHOUT_COLLECTOR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "WITHOUT_ACTIVE_STATE" }
    | { code: "ERROR_INSTALLMENTS" }

export interface UpdateDebitInput {
    debt: Debt
    isNewCollector: boolean
    companyId:string
}

export interface UpdateDebitOutput {
    state: Result<null, UpdateDebtError>
}

export class UpdateDebtUseCase {
    private debtGateway: DebtGateway
    private updateInstallmentByDebtCase:UpdateInstallmentByDebtCase
    private getInstallmentsByDebtCase: GetInstallmentsByDebtCase
    private installmentGateway: InstallmentGateway

    constructor(
        debtGateway: DebtGateway,
        installmentGateway: InstallmentGateway,
    ) {
        this.debtGateway = debtGateway
        this.installmentGateway = installmentGateway
        this.getInstallmentsByDebtCase=new GetInstallmentsByDebtCase(this.installmentGateway)
        this.updateInstallmentByDebtCase=new UpdateInstallmentByDebtCase(this.installmentGateway)
    }

    /** su funcion es actualizar un debt, si el debt tiene un nuevo collector actualiza el collector de sus installments que no esten pagos o cancelados*/
    async execute(input: UpdateDebitInput): Promise<UpdateDebitOutput> {

        if (input.debt.status === "activa") {
            if (!input.debt.collectorId) {
                return { state: fail({ code: "WITHOUT_COLLECTOR" }) }
            }
        }
        //solo si se cambia al collector se deben actualizar los debits
        if(input.isNewCollector){
            //deuda tecnica: crear mecanismo de reversion de cuotas si falla la actualizacion de la deuda
            //actualiza todo los installments de un debt que no esten pagos
            const installments=await this.getInstallmentsByDebtCase.execute({companyId:input.companyId, debtId:input.debt.id,status:'pagada'})

            if(installments.state.ok){
                //actualiza el 
                    const updateIOnstallment= await this.updateInstallments(input,installments.state.value)
            if(!updateIOnstallment.ok){
                return {state:fail(updateIOnstallment.error)}
            }
            }
        }

        //deberia haber mecanismo para actualizar todos los installments al cambiar cosas como tasa de interes
        return this.debtGateway.update(input)
    }


    /**actualiza los installments(unicamente el collector de los installments)*/
    private async updateInstallments(input: UpdateDebitInput,installments:Installment[]): Promise<Result<null,UpdateDebtError>>{

        const updateInstallmentByDebtCase= await this.updateInstallmentByDebtCase.execute({installments:installments,debtId:input.debt.id,companyId:input.companyId})

        if(updateInstallmentByDebtCase.state.ok){
         return ok(null)
        }
        else{
            return fail<UpdateDebtError>({code:"ERROR_INSTALLMENTS"})
        }
    }
}
