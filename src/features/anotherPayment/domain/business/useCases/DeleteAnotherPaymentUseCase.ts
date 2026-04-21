import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type AnotherPaymentGateway from "../../infraestructure/AnotherPaymentGateway";

export interface DeleteAnotherPaymentInput {
    companyId: string;
    id: string;
}

export interface DeleteAnotherPaymentOutput {
    success: boolean;
}

export type DeleteAnotherPaymentError = 
    | { code: "DELETE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class DeleteAnotherPaymentUseCase {
    private gateway: AnotherPaymentGateway;

    constructor(gateway: AnotherPaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: DeleteAnotherPaymentInput): Promise<Result<DeleteAnotherPaymentOutput, DeleteAnotherPaymentError>> {
        try {
            const result = await this.gateway.delete(input.companyId, input.id);

            if (!result.ok) {
                return fail({ code: "DELETE_ERROR" });
            }

            return ok({ success: true });

        } catch (error) {
            console.error("Error in DeleteAnotherPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
