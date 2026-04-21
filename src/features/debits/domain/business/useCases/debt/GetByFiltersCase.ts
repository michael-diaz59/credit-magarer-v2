import { type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt, DebtStatus, delivered_status } from "../../entities/Debt";


export type GetByFiltersError =
    | { code: "WITHOUT_COLLECTOR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetByFiltersInput {
    companyId: string;
    statuses?: DebtStatus[];
    deliveredStatus?: delivered_status;
    customerId?: string;
    idVisit?: string;
    delivered?: boolean;
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
    async execute(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput, GetByFiltersError>> {
        console.log("input", input)

        return this.debtGateway.getByFilters(input)
    }
}