import { fail, type Result } from "../../../../../core/helpers/ResultC";
import type { CompanyGateway } from "../../infraestructure/CompanyGateway";

export interface GetSumIncomesInput {
    companyId: string;
}

export interface GetSumIncomesOutput {
    totalIncomes: number;
}

export type GetSumIncomesError = { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" };

export class GetSumIncomesUseCase {
    private companyGateway: CompanyGateway;

    constructor(companyGateway: CompanyGateway) {
        this.companyGateway = companyGateway;
    }

    async execute(input: GetSumIncomesInput): Promise<Result<GetSumIncomesOutput, GetSumIncomesError>> {
        try {
            const result = await this.companyGateway.getSumIncomes(input.companyId);

            if (!result.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return {
                ok: true,
                value: {
                    totalIncomes: result.value
                }
            };
        } catch (error) {
            console.error("[GetSumIncomesUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
