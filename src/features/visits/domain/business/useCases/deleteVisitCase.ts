import type { Result } from "../../../../../core/helpers/ResultC";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { visitErros } from "../entities/types";
import type Visit from "../entities/Visit";

export interface DeleteVisitInput {
    idCompany: string
    idUser: string
    idVisit: string
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface DeleteVisitOutput {
    state: Result<Visit | null, visitErros>
}

export default class DeleteVisitCase{
    private gateway: VisitGateway

    constructor(gateway: VisitGateway){
        this.gateway = gateway
    }
       async execute(input: DeleteVisitInput): Promise<DeleteVisitOutput> {
            // Implementation to get user details
            return await this.gateway.deleteVisit(
                input
            )
        }
} 