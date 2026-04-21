import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { TaxtPayment } from "../entities/TaxtPayment";
import type TaxtGateway from "../../infraestructure/TaxtGateway";

export interface UpdateTaxtPaymentInput {
    companyId: string;
    payment: TaxtPayment;
    file?: File;
}

export interface UpdateTaxtPaymentOutput {
    success: boolean;
}

export type UpdateTaxtPaymentError = 
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class UpdateTaxtPaymentUseCase {
    private gateway: TaxtGateway;

    constructor(gateway: TaxtGateway) {
        this.gateway = gateway;
    }

    async execute(input: UpdateTaxtPaymentInput): Promise<Result<UpdateTaxtPaymentOutput, UpdateTaxtPaymentError>> {
        try {
            const result = await this.gateway.update(input.companyId, input.payment, input.file);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ success: true });

        } catch (error) {
            console.error("Error in UpdateTaxtPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
