import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { TaxtPayment } from "../entities/TaxtPayment";
import type TaxtGateway from "../../infraestructure/TaxtGateway";

export interface GetTaxtPaymentsByCompanyInput {
    companyId: string;
}

export interface GetTaxtPaymentsByCompanyOutput {
    payments: TaxtPayment[];
}

export type GetTaxtPaymentsByCompanyError = 
    | { code: "FETCH_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetTaxtPaymentsByCompanyUseCase {
    private gateway: TaxtGateway;

    constructor(gateway: TaxtGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetTaxtPaymentsByCompanyInput): Promise<Result<GetTaxtPaymentsByCompanyOutput, GetTaxtPaymentsByCompanyError>> {
        try {
            const result = await this.gateway.getAll(input.companyId);

            if (!result.ok) {
                return fail({ code: "FETCH_ERROR" });
            }

            return ok({ payments: result.value });

        } catch (error) {
            console.error("Error in GetTaxtPaymentsByCompanyUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
