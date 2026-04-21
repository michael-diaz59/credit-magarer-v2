import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { TaxtPayment } from "../entities/TaxtPayment";
import type TaxtGateway from "../../infraestructure/TaxtGateway";

export interface GetTaxtPaymentByIdInput {
    companyId: string;
    id: string;
}

export interface GetTaxtPaymentByIdOutput {
    payment: TaxtPayment | null;
}

export type GetTaxtPaymentByIdError = 
    | { code: "FETCH_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetTaxtPaymentByIdUseCase {
    private gateway: TaxtGateway;

    constructor(gateway: TaxtGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetTaxtPaymentByIdInput): Promise<Result<GetTaxtPaymentByIdOutput, GetTaxtPaymentByIdError>> {
        try {
            const result = await this.gateway.getById(input.companyId, input.id);

            if (!result.ok) {
                return fail({ code: "FETCH_ERROR" });
            }

            return ok({ payment: result.value });

        } catch (error) {
            console.error("Error in GetTaxtPaymentByIdUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
