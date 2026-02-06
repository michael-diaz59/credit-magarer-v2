import { type Result } from "../../../../../../core/helpers/ResultC";
import type {DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt, DebtStatus } from "../../entities/Debt";


export type GetByFiltersError =
    | { code: "WITHOUT_COLLECTOR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetByFiltersInput {
     companyId: string;
      statuses?: DebtStatus[];
      customerId?: string;
      limit?: number;
}

export interface GetByFiltersOutput {
    state: Debt[]
}

/** su funcion es obtener un debt en base a un idDebt*/
export class GetByFiltersCase {
    private debtGateway: DebtGateway

    constructor(
        debtGateway: DebtGateway,
    ) {
        this.debtGateway = debtGateway
    }

    /** su funcion es obtener un debt en base a un idDebt*/
    async execute(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput,GetByFiltersError>> {

        return this.debtGateway.getByFilters(input)
    }
}