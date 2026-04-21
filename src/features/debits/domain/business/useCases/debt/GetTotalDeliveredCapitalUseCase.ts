import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export interface GetTotalDeliveredCapitalInput {
    companyId: string;
}

export interface GetTotalDeliveredCapitalOutput {
    totalCapital: number;
}

export type GetTotalDeliveredCapitalError = { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" };

export class GetTotalDeliveredCapitalUseCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: GetTotalDeliveredCapitalInput): Promise<Result<GetTotalDeliveredCapitalOutput, GetTotalDeliveredCapitalError>> {
        try {
            const result = await this.debtGateway.getSumOfDeliveredCapital(input.companyId);

            if (!result.ok) {
                return fail(result.error);
            }

            return {
                ok: true,
                value: {
                    totalCapital: result.value
                }
            };
        } catch (error) {
            console.error("[GetTotalDeliveredCapitalUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
