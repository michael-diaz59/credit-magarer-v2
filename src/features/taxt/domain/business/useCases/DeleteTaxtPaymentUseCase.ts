import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type TaxtGateway from "../../infraestructure/TaxtGateway";

export interface DeleteTaxtPaymentInput {
    companyId: string;
    id: string;
}

export interface DeleteTaxtPaymentOutput {
    success: boolean;
}

export type DeleteTaxtPaymentError = 
    | { code: "DELETE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class DeleteTaxtPaymentUseCase {
    private gateway: TaxtGateway;

    constructor(gateway: TaxtGateway) {
        this.gateway = gateway;
    }

    async execute(input: DeleteTaxtPaymentInput): Promise<Result<DeleteTaxtPaymentOutput, DeleteTaxtPaymentError>> {
        try {
            const result = await this.gateway.delete(input.companyId, input.id);

            if (!result.ok) {
                return fail({ code: "DELETE_ERROR" });
            }

            return ok({ success: true });

        } catch (error) {
            console.error("Error in DeleteTaxtPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
