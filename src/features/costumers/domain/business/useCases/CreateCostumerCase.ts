import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Costumer } from "../entities/Costumer"
import type { SaveCostumerError } from "../entities/utilities"

export interface SaveCostumerInput {
    costumer: Costumer,
    companyId:string
}

export class CreateCostumerCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }

    async execute(saveCostumerInput: SaveCostumerInput): Promise<Result<null, SaveCostumerError>> {
        const saveResult = await this.costumerGateway.createCostumer(saveCostumerInput.costumer,saveCostumerInput.companyId)

        if (!saveResult.ok) {
            return fail({ code: saveResult.error.code })
        }
        return ok(null)
    }


}