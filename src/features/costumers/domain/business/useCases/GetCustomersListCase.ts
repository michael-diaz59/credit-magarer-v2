import type { Result } from "../../../../../core/helpers/ResultC"
import type CostumerGateway from "../../infraestructure/CostumerGateway"
import type { Customer } from "../entities/Customer"
import type { GetCostumersErrors } from "../entities/utilities"


export interface GetCustomersListInput {
    idUser: string
    idCompany:string
}

export interface GetCustomersListOutput {
    state : Customer[]
}

export class GetCustomersListCase {
    private costumerGateway: CostumerGateway
    constructor(
        costumerGateway: CostumerGateway,
    ) {
        this.costumerGateway = costumerGateway
    }
    async execute(input: GetCustomersListInput): Promise<Result<GetCustomersListOutput,GetCostumersErrors>> {
        const deleteResult = await this.costumerGateway.getCustomersListCase(input)
        return deleteResult
    }

}