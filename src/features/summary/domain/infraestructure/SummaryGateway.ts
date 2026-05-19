import type { Result } from "../../../../core/helpers/ResultC";
import type { GeneralSummary, ProfitDetails, EquityDetails, GrossProfitDetails } from "../business/entities/Summary";
import type { GetExpensivesError, GetExpensivesInput, GetExpensivesOutput } from "../business/useCases/GetExpensivesCase";
import type { GetFinancialAggregatesError, GetFinancialAggregatesInput, GetFinancialAggregatesOutput } from "../business/useCases/GetFinancialAggregatesByDateRangeUseCase";

export interface SummaryGateway {
    getGeneralSummary(input: { companyId: string }): Promise<Result<GeneralSummary, { code: string }>>;
    getProfitDetails(input: { companyId: string }): Promise<Result<ProfitDetails, { code: string }>>;
    getGrossProfitDetails(input: { companyId: string }): Promise<Result<GrossProfitDetails, { code: string }>>;
    getEquityDetails(input: { companyId: string }): Promise<Result<EquityDetails, { code: string }>>;
    getExpensivesDetails(input: GetExpensivesInput): Promise<Result<GetExpensivesOutput, GetExpensivesError>>;
    getFinancialAggregatesByDateRange(input: GetFinancialAggregatesInput): Promise<Result<GetFinancialAggregatesOutput, GetFinancialAggregatesError>>;
}