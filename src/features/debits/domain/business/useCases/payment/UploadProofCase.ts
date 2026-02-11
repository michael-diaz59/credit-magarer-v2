import type { Result } from "../../../../../../core/helpers/ResultC"
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway"

export interface UploadProofInput {
    file: File
    companyId: string
    paymentId: string
}

export type UploadProofError = Error

/** su función es subir el comprobante de pago a storage */
export class UploadProofCase {
    private readonly paymentGateway: PaymentGateway

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway
    }

    async execute(
        input: UploadProofInput
    ): Promise<Result<string, UploadProofError>> {
        return this.paymentGateway.uploadProof(
            input.file,
            input.companyId,
            input.paymentId
        )
    }
}
