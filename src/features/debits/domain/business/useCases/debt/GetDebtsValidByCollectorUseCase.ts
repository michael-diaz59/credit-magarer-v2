import type { Result } from "../../../../../../core/helpers/ResultC";
import { ok, fail } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";

export interface GetDebtsValidByCollectorInput {
    companyId: string;
    collectorId: string;
}

export interface GetDebtsValidByCollectorOutput {
    state: Debt[];
}

export type GetDebtsValidByCollectorError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetDebtsValidByCollectorUseCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: GetDebtsValidByCollectorInput): Promise<Result<GetDebtsValidByCollectorOutput, GetDebtsValidByCollectorError>> {
        try {
            const result = await this.debtGateway.getDebtsByRouteAndStatus({
                companyId: input.companyId,
                routeIds: [input.collectorId],
                statuses: ["activa", "en_mora"]
            });

            if (!result.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const debtsResult = result.value.state;

            if (!debtsResult.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return ok({ state: debtsResult.value });
        } catch (error) {
            console.error("[GetDebtsValidByCollectorUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
