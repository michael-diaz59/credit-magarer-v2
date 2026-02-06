import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Installment } from "../../entities/Installment"

export type UpdateByIdError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "fORBIDEN" }


export interface UpdateByIdInput {
    installment:Installment
    companyId:string
}

export interface UpdateByIdOutput {
    state: null
}

/** su funcion es actualizar varios installmentes*/
export class UpdateByIdCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es actualizar varios installmentes*/
    async execute(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
         return this.installmentGateway.updateById(input)
    }
}
