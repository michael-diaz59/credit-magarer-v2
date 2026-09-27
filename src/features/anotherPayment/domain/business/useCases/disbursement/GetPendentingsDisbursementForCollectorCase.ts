import type { Result } from "../../../../../../core/helpers/ResultC"
import type DisbursementGateway from "../../../infraestructure/DisbursementGateway"
import type { Disbursement } from "../../entities/Disbursement";



export interface GetPendentingsDisbursementForCollectorInput {
    collectorId: string;
    companyId: string;
}

export interface GetPendentingsDisbursementForCollectorOutput {
    disbursements: Disbursement[];
}

export type Errors = "NOT_FOUND" | "NOT_EXISTS_ROUTE_WITH_COLLECTOR" | "INTERNAL_SERVER_ERROR"


export interface GetPendentingsDisbursementForCollectorError {
    code: Errors
}

export class GetPendentingsDisbursementForCollectorCase {
    private disbursementGateway: DisbursementGateway
    constructor(disbursementGateway: DisbursementGateway) {
        this.disbursementGateway = disbursementGateway
    }

    execute(input: GetPendentingsDisbursementForCollectorInput): Promise<Result<GetPendentingsDisbursementForCollectorOutput, GetPendentingsDisbursementForCollectorError>> {
        return this.disbursementGateway.getPendentingsDisbursementForCollector(input)
    }
}