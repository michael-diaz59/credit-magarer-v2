import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Installment, InstallmentStatus } from "../../entities/Installment"

export type GetByCollectorError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }


export interface GetByCollectorInput {
    collectorId:string
    companyId:string
    status?: InstallmentStatus[];
}

export interface GetByCollectorOutput {
    state: Installment[]
}

/** su funcion es obtener varios installmentes asociados a un collector*/
export class GetByCollectorCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es obtener varios installmentes asociados a un collector*/
    async execute(input: GetByCollectorInput): Promise<Result<GetByCollectorOutput,GetByCollectorError>> {
         return this.installmentGateway.getByCollector(input)
    }
}