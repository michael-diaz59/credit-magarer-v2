import type { Result } from "../../../../../core/helpers/ResultC";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { visitErros } from "../entities/types";
import type Visit from "../entities/Visit";

export interface GetVisitByCedulaInput {
    idCompanie: string
    idUser: string
    cedula: string
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface GetVisitByCedulaOutput {
    state: Result<Visit[], visitErros>
}

export default class GetVisitByCedulaCase{
    private gateway: VisitGateway

    constructor(gateway: VisitGateway){
        this.gateway = gateway
    }
       async execute(input: GetVisitByCedulaInput): Promise<GetVisitByCedulaOutput> {
            // Implementation to get user details
            return await this.gateway.getVisitByCedula(
                input
            )
        }
} 
