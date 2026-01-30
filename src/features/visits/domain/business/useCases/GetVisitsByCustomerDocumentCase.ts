import type { Result } from "../../../../../core/helpers/ResultC"
import type VisitGateway from "../../infraestructure/VisitGateway"
import type { visitErros } from "../entities/types"
import type Visit from "../entities/Visit"

export interface GetVisitsByCustomerDocumentInput {
    idCompany: string
    idUser: string
    customerDocument: string
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface GetVisitsByCustomerDocumentOutput {
    state:Visit[]
}

export class GetVisitsByCustomerDocumentCase {
    private gateway: VisitGateway

    constructor(
        gateway: VisitGateway
    ) {
        this.gateway = gateway
    }
    async execute(input: GetVisitsByCustomerDocumentInput): Promise<Result<GetVisitsByCustomerDocumentOutput,visitErros>> {
        // Implementation to get user details
        return await this.gateway.getVisitsByCustomerDocument(
            input
        )
    }

}