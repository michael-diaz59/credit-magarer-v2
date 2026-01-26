import type { Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { SaveCostumerError } from "../entities/utilities"

export interface DeleteCostumerInput {
    costumerId: string,
    companyId:string
    documentId:string
}

export class DeleteCostumerCase{
       private costumerGateway: CostumerGateway
        constructor(
            costumerGateway: CostumerGateway,
        ) {
            this.costumerGateway = costumerGateway
        }
         async execute(deleteCostumerinput: DeleteCostumerInput): Promise<Result<null, SaveCostumerError>> {
                const deleteResult = await this.costumerGateway.deleteCostumer(deleteCostumerinput)
                return deleteResult
            }

}