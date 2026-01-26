import type { Result } from "../../../../../core/helpers/ResultC";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { visitErros } from "../entities/types";
import type Visit from "../entities/Visit";

export interface EditVisitInput {
    idCompany: string
    idUser: string
    visit: Visit
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface EditVisitOutput {
    state: Result<null, visitErros>
}

export default class EditVisitCase{
    private gateway: VisitGateway

    constructor(gateway: VisitGateway){
        this.gateway = gateway
    }
       async execute(input: EditVisitInput): Promise<EditVisitOutput> {
            // Implementation to get user details
            return await this.gateway.editVisit(
                input
            )
        }
} 