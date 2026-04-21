
import type { Result } from "../../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../infraestructure/SummaryGateway";

export type GetFinancialAggregatesError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface GetFinancialAggregatesInput {
    companyId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export interface GetFinancialAggregatesOutput {
    payments: number;
    taxtPayments: number;
    payroll: number;
    financialPayments: number;
    anotherPayments: number;
    financialDebts: number;
    incomes: number;
}

export class GetFinancialAggregatesByDateRangeUseCase {
    private gateway: SummaryGateway;

    constructor(gateway: SummaryGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetFinancialAggregatesInput): Promise<Result<GetFinancialAggregatesOutput, GetFinancialAggregatesError>> {
        return this.gateway.getFinancialAggregatesByDateRange(input);
    }
}
