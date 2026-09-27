import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type DisbursementGateway from "../../../infraestructure/DisbursementGateway";

export interface MarkDisbursementAsDeliveredInput {
    companyId: string;
    disbursementId: string;
    pendingAmount: number
    deliveredAmount: number
}

export interface MarkDisbursementAsDeliveredOutput {
    state: boolean;
}

export type Errors = | "UNKNOWN_ERROR";

export interface MarkDisbursementAsDeliveredError {
    code: Errors;
}

export class MarkDisbursementAsDeliveredCase {
    private disbursementRepository: DisbursementGateway;
    constructor(disbursementRepository: DisbursementGateway) {
        this.disbursementRepository = disbursementRepository;
    }
    async execute(input: MarkDisbursementAsDeliveredInput): Promise<Result<MarkDisbursementAsDeliveredOutput, MarkDisbursementAsDeliveredError>> {
        try {
            const result = await this.disbursementRepository.markDisbursementAsDelivered(input);
            return result;
        } catch (error) {
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}