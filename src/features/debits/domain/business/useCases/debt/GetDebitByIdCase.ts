import { type Result } from "../../../../../../core/helpers/ResultC";
import type {DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";


export type GetDebitByIdError =
    | { code: "WITHOUT_COLLECTOR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "WITHOUT_ACTIVE_STATE" }
    | { code: "ERROR_INSTALLMENTS" }

export interface GetDebitByIdInput {
    idDebt:string 
    companyId:string
}

export interface GetDebitByIdOutput {
    state: Result<Debt|null, GetDebitByIdError>
}

/** su funcion es obtener un debt en base a un idDebt*/
export class GetDebitByIdCase {
    private debtGateway: DebtGateway

    constructor(
        debtGateway: DebtGateway,
    ) {
        this.debtGateway = debtGateway
    }

    /** su funcion es obtener un debt en base a un idDebt*/
    async execute(input: GetDebitByIdInput): Promise<GetDebitByIdOutput> {

        return this.debtGateway.getById(input)
    }
}
