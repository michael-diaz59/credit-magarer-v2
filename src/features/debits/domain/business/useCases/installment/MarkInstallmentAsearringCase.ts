import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway"
import type { Installment } from "../../entities/Installment"
import type { UpdateByIdError, UpdateByIdOutput } from "./UpdateByIdCase"


export interface MarkInstallmentAsearringInput {
    installment: Installment
    companyId: string
}



/** su funcion es actualizar varios installmentes*/
export class MarkInstallmentAsearringCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es actualizar varios installmentes*/
    async execute(input: MarkInstallmentAsearringInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
        input.installment.status = 'pendiente'
        return this.installmentGateway.updateById(input)
    }
}
