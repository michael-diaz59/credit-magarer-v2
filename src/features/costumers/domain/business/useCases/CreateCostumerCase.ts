import type { PendingDocuments } from "../../../../../atomic_design/molecules/CustomerDocumentActions"
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Customer } from "../entities/Customer"
import type { SaveCostumerError } from "../entities/utilities"

export interface SaveCostumerInput {
    costumer: Customer,
    updateFiles:boolean,
    companyId:string,
    pendingDocs: PendingDocuments
}

export class CreateCostumerCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }

    async execute(saveCostumerInput: SaveCostumerInput): Promise<Result<null, SaveCostumerError>> {
        const saveResult = await this.costumerGateway.createCostumer(saveCostumerInput)

        if (!saveResult.ok) {
            return fail({ code: saveResult.error.code })
        }
        return ok(null)
    }


}