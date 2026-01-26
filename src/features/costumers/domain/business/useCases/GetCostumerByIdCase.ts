import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Costumer } from "../entities/Costumer"
import type { GetCostumersErrors } from "../entities/utilities"


export interface GetCostumerByIdInput {
    companyId: string
    costumerId: string
}

export class GetCostumerByIdCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }

    async execute(getCostumerByIdInpit: GetCostumerByIdInput): Promise<Result<Costumer | null, GetCostumersErrors>> {
        const getResult = await this.costumerGateway.getCostumerById(getCostumerByIdInpit.companyId,getCostumerByIdInpit.costumerId)

        if (!getResult.ok) {
            return fail({ code: getResult.error.code })
        }
        return ok(getResult.value)
    }

}