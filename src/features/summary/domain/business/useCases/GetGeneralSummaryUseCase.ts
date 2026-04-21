import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";
import type { GeneralSummary } from "../entities/Summary";


export type GetGeneralSummaryError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetGeneralSummaryInput {
    companyId: string;
}

export interface GetGeneralSummaryOutput {
    summary: GeneralSummary;
}

export class GetGeneralSummaryUseCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }
    async execute(input: GetGeneralSummaryInput): Promise<Result<GetGeneralSummaryOutput, GetGeneralSummaryError>> {

        const result = await this.gateway.getGeneralSummary(input);

        if (result.ok) {
            return {
                ok: true,
                value: {
                    summary: result.value
                }
            };
        }

        return {
            ok: false,
            error: { code: "UNKNOWN_ERROR" }
        };
    }
}
