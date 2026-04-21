import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";
import type { ProfitDetails } from "../entities/Summary";


export type GetProfitDetailsError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetProfitDetailsInput {
    companyId: string;
}

export interface GetProfitDetailsOutput {
    details: ProfitDetails;
}

export class GetProfitDetailsUseCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetProfitDetailsInput): Promise<Result<GetProfitDetailsOutput, GetProfitDetailsError>> {
        const result = await this.gateway.getProfitDetails(input);

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
