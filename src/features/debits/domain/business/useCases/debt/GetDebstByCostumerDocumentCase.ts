import { type Result } from "../../../../../../core/helpers/ResultC";
import type {DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";


export type GetDebstByCostumerDocumentError =
    | { code: "WITHOUT_COLLECTOR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "WITHOUT_ACTIVE_STATE" }
    | { code: "ERROR_INSTALLMENTS" }

export interface GetDebstByCostumerDocumentInput {
    costumerDocument:string 
    companyId:string
}

export interface GetDebstByCostumerDocumentOutput {
    state: Result<Debt[], GetDebstByCostumerDocumentError>
}

/** su funcion es obtener todos los debts de un usuario en base a su document*/
export class GetDebstByCostumerDocumentCase {
    private debtGateway: DebtGateway

    constructor(
        debtGateway: DebtGateway,
    ) {
        this.debtGateway = debtGateway
    }

    /** su funcion es obtener todos los debts de un usuario en base a su document */
    async execute(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput> {

        return this.debtGateway.getBycostumerDocument(input)
    }
}
