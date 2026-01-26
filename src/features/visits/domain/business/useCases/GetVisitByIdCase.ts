import type { Result } from "../../../../../core/helpers/ResultC"
import type VisitGateway from "../../infraestructure/VisitGateway"
import type { visitErros } from "../entities/types"
import type Visit from "../entities/Visit"

export interface GetVisitByIdInput {
    idCompany: string
    idUser: string
    idVisit: string
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface GetVisitByIdOutput {
    state: Result< Visit | null, visitErros>
}

export class GetVisitByIdCase {
    private gateway: VisitGateway

    constructor(
        gateway: VisitGateway
    ) {
        this.gateway = gateway
    }
    async execute(input: GetVisitByIdInput): Promise<GetVisitByIdOutput> {
        // Implementation to get user details
        return await this.gateway.getVisitById(
            input
        )
    }

}