import { fail, type Result } from "../../../../../core/helpers/ResultC";
import type { CompanyGateway } from "../../infraestructure/CompanyGateway";
import type { Income } from "../entities/Income";

export interface GetIncomesInput {
    companyId: string;
}

export interface GetIncomesOutput {
    incomes: Income[];
}

export type GetIncomesError = { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" };

export class GetIncomesCase {
    private companyGateway: CompanyGateway;

    constructor(companyGateway: CompanyGateway) {
        this.companyGateway = companyGateway;
    }

    async execute(input: GetIncomesInput): Promise<Result<GetIncomesOutput, GetIncomesError>> {
        try {
            const result = await this.companyGateway.getIncomes(input);

            if (!result.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return {
                ok: true,
                value: result.value
            };
        } catch (error) {
            console.error("[GetSumIncomesUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
