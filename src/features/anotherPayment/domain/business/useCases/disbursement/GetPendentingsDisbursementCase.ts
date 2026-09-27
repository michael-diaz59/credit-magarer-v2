import type { Result } from "../../../../../../core/helpers/ResultC";
import type DisbursementGateway from "../../../infraestructure/DisbursementGateway";
import type { Disbursement } from "../../entities/Disbursement";

export interface GetPendentingsDisbursementInput {
    companyId: string;
    accountantId: string;
}

export interface GetPendentingsDisbursementOutput {
    disbursements: Disbursement[];
}

export type Errors = "NOT_FOUND" | "NOT_EXISTS_ROUTE_WITH_COLLECTOR" | "INTERNAL_SERVER_ERROR";
export interface GetPendentingsDisbursementError {
    code: Errors;
}
/**devuelve todos los desembolsos que estan poendientes por gestionarse por el contador*/
export class GetPendentingsDisbursementCase {
    private readonly disbursementRepository: DisbursementGateway
    constructor(disbursementRepository: DisbursementGateway) {
        this.disbursementRepository = disbursementRepository
    }

    async execute(input: GetPendentingsDisbursementInput): Promise<Result<GetPendentingsDisbursementOutput, GetPendentingsDisbursementError>> {
        return await this.disbursementRepository.getPendentingsDisbursement(input);
    }
}