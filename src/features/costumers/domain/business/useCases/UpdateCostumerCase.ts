import type { PendingDocuments } from "../../../../../atomic_design/molecules/CustomerDocumentActions"
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Customer } from "../entities/Customer"
import type { SaveCostumerError } from "../entities/utilities"

export interface UpdateCostumerInput {
    idUser:string
    costumer: Customer,
    isNameChange:boolean
    companyId:string,
     updateFiles?:boolean,
     pendingDocs?: PendingDocuments
}

export class UpdateCostumerCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }

    async execute(input: UpdateCostumerInput): Promise<Result<null, SaveCostumerError>> {
        const saveResult = await this.costumerGateway.UpdateCostumer(input)

        if (!saveResult.ok) {
            return fail({ code: saveResult.error.code })
        }
        return ok(null)
    }


}