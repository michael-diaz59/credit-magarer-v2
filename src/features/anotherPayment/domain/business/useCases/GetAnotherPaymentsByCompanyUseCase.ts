import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { AnotherPayment } from "../entities/AnotherPayment";
import type AnotherPaymentGateway from "../../infraestructure/AnotherPaymentGateway";

export interface GetAnotherPaymentsByCompanyInput {
    companyId: string;
}

export interface GetAnotherPaymentsByCompanyOutput {
    payments: AnotherPayment[];
}

export type GetAnotherPaymentsByCompanyError = 
    | { code: "FETCH_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetAnotherPaymentsByCompanyUseCase {
    private gateway: AnotherPaymentGateway;

    constructor(gateway: AnotherPaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetAnotherPaymentsByCompanyInput): Promise<Result<GetAnotherPaymentsByCompanyOutput, GetAnotherPaymentsByCompanyError>> {
        try {
            const result = await this.gateway.getAll(input.companyId);

            if (!result.ok) {
                return fail({ code: "FETCH_ERROR" });
            }

            return ok({ payments: result.value });

        } catch (error) {
            console.error("Error in GetAnotherPaymentsByCompanyUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
