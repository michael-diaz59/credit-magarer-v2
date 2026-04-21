import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";
import type { EquityDetails } from "../entities/Summary";

export type GetEquityDetailsError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetEquityDetailsInput {
    companyId: string;
}

export interface GetEquityDetailsOutput {
    details: EquityDetails;
}

export class GetEquityDetailsUseCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetEquityDetailsInput): Promise<Result<GetEquityDetailsOutput, GetEquityDetailsError>> {
        const result = await this.gateway.getEquityDetails(input);

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
