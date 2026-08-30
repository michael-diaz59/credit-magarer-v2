import type { Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway"
import type { Installment } from "../../entities/Installment"
import type { UpdateByIdError, UpdateByIdOutput } from "./UpdateByIdCase"


export interface MarkInstallmentAsCanceledInput {
    installment: Installment
    companyId: string
}



/** su funcion es actualizar varios installmentes*/
export class MarkInstallmentAsCanceledCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es actualizar varios installmentes*/
    async execute(input: MarkInstallmentAsCanceledInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
        input.installment.status = 'pagada'
        return this.installmentGateway.updateById(input)
    }
}
