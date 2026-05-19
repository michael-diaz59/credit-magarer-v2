import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";
import type { GrossProfitDetails } from "../entities/Summary";

export type GetGrossProfitDetailsError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetGrossProfitDetailsInput {
    companyId: string;
}

export interface GetGrossProfitDetailsOutput {
    details: GrossProfitDetails;
}

export class GetGrossProfitDetailsUseCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetGrossProfitDetailsInput): Promise<Result<GetGrossProfitDetailsOutput, GetGrossProfitDetailsError>> {
        const result = await this.gateway.getGrossProfitDetails(input);

        if (result.ok) {
            return {
                ok: true,
                value: {
                    details: result.value
                }
            };
        }

        return {
            ok: false,
            error: { code: "UNKNOWN_ERROR" }
        };
    }
}
