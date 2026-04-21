import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { AnotherPayment } from "../entities/AnotherPayment";
import type AnotherPaymentGateway from "../../infraestructure/AnotherPaymentGateway";

export interface GetAnotherPaymentByIdInput {
    companyId: string;
    id: string;
}

export interface GetAnotherPaymentByIdOutput {
    payment: AnotherPayment | null;
}

export type GetAnotherPaymentByIdError = 
    | { code: "FETCH_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetAnotherPaymentByIdUseCase {
    private gateway: AnotherPaymentGateway;

    constructor(gateway: AnotherPaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetAnotherPaymentByIdInput): Promise<Result<GetAnotherPaymentByIdOutput, GetAnotherPaymentByIdError>> {
        try {
            const result = await this.gateway.getById(input.companyId, input.id);

            if (!result.ok) {
                return fail({ code: "FETCH_ERROR" });
            }

            return ok({ payment: result.value });

        } catch (error) {
            console.error("Error in GetAnotherPaymentByIdUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
