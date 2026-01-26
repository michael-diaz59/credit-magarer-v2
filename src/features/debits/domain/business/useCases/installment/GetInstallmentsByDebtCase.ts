import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Installment, InstallmentStatus } from "../../entities/Installment"

export type GetInstallmentsByDebtError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }


export interface GetInstallmentsByDebtInput {
    debtId: string
    //lo que llega como estado es para filtrar las cuotas que no tengan el estado indicado
    status: InstallmentStatus
    companyId:string
}

export interface GetInstallmentsByDebtOutput {
    state: Result<Installment[], GetInstallmentsByDebtError>
}



export class GetInstallmentsByDebtCase {
    private installmentGateway: InstallmentGateway

    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }

    /**su funcion es obtener los installments que no pertenezcan al status asignado, util para buscar installments con un estado que permita editarse */
    async execute(input: GetInstallmentsByDebtInput): Promise<GetInstallmentsByDebtOutput> {
         return this.installmentGateway.getByDebt(input)

    }
}
