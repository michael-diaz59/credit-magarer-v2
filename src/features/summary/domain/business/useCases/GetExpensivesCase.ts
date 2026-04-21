import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";

export type GetExpensivesError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetExpensivesInput {
    companyId: string;
}

export interface GetExpensivesOutput {
    //**pagos de nomina */
    payrollExpenses: number;
    //**pagos de financiamientos */
    financingPayments: number;
    //**pagos de impuestos */
    taxExpenses: number;
    //**otros pagos */
    othersExpenses: number;
    //**total de gastos */
    totalExpenses: number;
}

export class GetExpensivesCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetExpensivesInput): Promise<Result<GetExpensivesOutput, GetExpensivesError>> {
        return this.gateway.getExpensivesDetails(input);
    }
}
