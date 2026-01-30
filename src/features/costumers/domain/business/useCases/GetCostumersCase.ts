import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Customer } from "../entities/Customer"
import type { GetCostumersErrors } from "../entities/utilities"


export interface GetCostumerInput {
    companyId: string
}

export class GetCostumersCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }

    async execute(getCostumerInput: GetCostumerInput): Promise<Result<Customer[], GetCostumersErrors>> {
        const getResult = await this.costumerGateway.getCostumers(getCostumerInput.companyId)

        if (!getResult.ok) {
            return fail({ code: getResult.error.code })
        }
        return ok(getResult.value)
    }


}