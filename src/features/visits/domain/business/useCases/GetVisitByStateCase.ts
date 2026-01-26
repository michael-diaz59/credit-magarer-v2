import type { Result } from "../../../../../core/helpers/ResultC"
import type VisitGateway from "../../infraestructure/VisitGateway"
import type { visitErros } from "../entities/types"
import type Visit from "../entities/Visit"
import type { StateVisit } from "../entities/Visit"

export interface GetVisitByStateInput {
    idCompany: string
    idUser: string
    state:StateVisit
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface GetVisitByStateOutput {
    state: Result<Visit[], visitErros>
}

export class GetVisitByStateCase {
    private gateway: VisitGateway

    constructor(
        gateway: VisitGateway
    ) {
        this.gateway = gateway
    }
    async execute(input: GetVisitByStateInput): Promise<GetVisitByStateOutput> {
        // Implementation to get user details
        return await this.gateway.getVisitByStateCase(
            input
        )
    }

}