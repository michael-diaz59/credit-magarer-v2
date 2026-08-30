import { type Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway"
import type { Installment } from "../../entities/Installment"


export interface MarkInstallAsPaidInput {
    installment: Installment
    idInstallment: string
    companyId: string
    auditorNotes: string
}

export interface MarkInstallAsPaidOutput {
    state: null
}

export type MarkInstallAsPaidError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "fORBIDEN" }
    | { code: "AUDITORNOTEREQUERIDE" }



/** su funcion es actualizar varios installmentes*/
export class MarkInstallAsPaidCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** su funcion es actualizar varios installmentes*/
    async execute(input: MarkInstallAsPaidInput): Promise<Result<MarkInstallAsPaidOutput, MarkInstallAsPaidError>> {
        return this.installmentGateway.markInstallAsPaid({
            payStatus: 'pagada',
            idInstallment: input.idInstallment,
            companyId: input.companyId,
            auditorNotes: input.auditorNotes
        })
    }
}
