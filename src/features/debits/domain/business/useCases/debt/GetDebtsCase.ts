import type { Result } from "../../../../../../core/helpers/ResultC"
import type { DebtGateway } from "../../../infraestructure/DebtGatweay"
import type { Debt } from "../../entities/Debt"

export type GetDebtsError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
| { code: "COLLECTOR_NOT_FOUND" }


export interface GetDebtsInput {
    companyId: string,
    collectorId?: string
}

export interface GetDebtsOutput {
    state: Result<Debt[], GetDebtsError>
}

export class GetDebtsCase {

    private debtGateway: DebtGateway

    constructor(
        debtGateway: DebtGateway,
    ) {
        this.debtGateway = debtGateway
    }

    /**devuelve todos los debts de la bd, si el input tiene un collector devuelve solo los debt que puede conocer ese collector*/
    async execute(input: GetDebtsInput):Promise<GetDebtsOutput> {
          return await this.debtGateway.getDebts(input)

    }

}