import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { AnotherPayment } from "../entities/AnotherPayment";
import type AnotherPaymentGateway from "../../infraestructure/AnotherPaymentGateway";

export interface UpdateAnotherPaymentInput {
    companyId: string;
    payment: AnotherPayment;
    file?: File;
}

export interface UpdateAnotherPaymentOutput {
    success: boolean;
}

export type UpdateAnotherPaymentError = 
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class UpdateAnotherPaymentUseCase {
    private gateway: AnotherPaymentGateway;

    constructor(gateway: AnotherPaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: UpdateAnotherPaymentInput): Promise<Result<UpdateAnotherPaymentOutput, UpdateAnotherPaymentError>> {
        try {
            const result = await this.gateway.update(input.companyId, input.payment, input.file);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ success: true });

        } catch (error) {
            console.error("Error in UpdateAnotherPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
