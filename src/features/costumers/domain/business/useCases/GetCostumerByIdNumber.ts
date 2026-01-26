import type { Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Costumer } from "../entities/Costumer"
import type { GetCostumersErrors } from "../entities/utilities"

export interface GetCostumerByIdNumberInput {
    companyId: string
    documentId: string
}

export interface GetCostumerByIdNumberOutput {
    state : Result<Costumer|null,GetCostumersErrors>
}

export class GetCostumerByIdNumberCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }
    async execute(input: GetCostumerByIdNumberInput): Promise<GetCostumerByIdNumberOutput> {
        const deleteResult = await this.costumerGateway.getCostumerByIdNumber(input)
        return deleteResult
    }

}