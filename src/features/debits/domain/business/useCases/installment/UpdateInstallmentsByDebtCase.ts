import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Installment } from "../../entities/Installment"

export type UpdateInstallmentByDebtError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }


export interface UpdateInstallmentByDebtInput {
    debtId:string
    installments:Installment[]
    companyId:string

}

export interface UpdateInstallmentByDebtOutput {
    state: Result<null, UpdateInstallmentByDebtError>
}

/** su funcion es actualizar varios installmentes*/
export class UpdateInstallmentByDebtCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es actualizar varios installmentes*/
    async execute(input: UpdateInstallmentByDebtInput): Promise<UpdateInstallmentByDebtOutput> {
         return this.installmentGateway.updateByDebt(input)
    }
}
