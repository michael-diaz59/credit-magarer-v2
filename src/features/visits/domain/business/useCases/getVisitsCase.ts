import type { Result } from "../../../../../core/helpers/ResultC";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { visitErros } from "../entities/types";
import type Visit from "../entities/Visit";

export interface GetVisitsInput {
    idCompany: string
    idUser: string
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface GetVisitsOutput {
    state: Result<Visit[], visitErros>
}

export default class GetVisitsCase{
    private gateway: VisitGateway

    constructor(gateway: VisitGateway){
        this.gateway = gateway
    }
       async execute(input: GetVisitsInput): Promise<GetVisitsOutput> {
            // Implementation to get user details
            return await this.gateway.getVisits(
                input
            )
        }
} 