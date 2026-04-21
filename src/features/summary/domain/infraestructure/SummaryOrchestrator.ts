import type { Result } from "../../../../core/helpers/ResultC";
import { GetGeneralSummaryUseCase, type GetGeneralSummaryInput, type GetGeneralSummaryOutput, type GetGeneralSummaryError } from "../business/useCases/GetGeneralSummaryUseCase";
import { GetProfitDetailsUseCase, type GetProfitDetailsInput, type GetProfitDetailsOutput, type GetProfitDetailsError } from "../business/useCases/GetProfitDetailsUseCase";
import { GetEquityDetailsUseCase, type GetEquityDetailsInput, type GetEquityDetailsOutput, type GetEquityDetailsError } from "../business/useCases/GetEquityDetailsUseCase";
import type { SummaryGateway } from "./SummaryGateway";
import { FirebaseSummaryRepository } from "../../provider/firebase/FirebaseSummaryRepository";
import { GetExpensivesCase, type GetExpensivesError, type GetExpensivesInput, type GetExpensivesOutput } from "../business/useCases/GetExpensivesCase";
import { GetFinancialAggregatesByDateRangeUseCase, type GetFinancialAggregatesError, type GetFinancialAggregatesInput, type GetFinancialAggregatesOutput } from "../business/useCases/GetFinancialAggregatesByDateRangeUseCase";

export default class SummaryOrchestrator {
    private getGeneralSummaryUseCase: GetGeneralSummaryUseCase;
    private getProfitDetailsUseCase: GetProfitDetailsUseCase;
    private getEquityDetailsUseCase: GetEquityDetailsUseCase;
    private getExpensivesDetailsUseCase: GetExpensivesCase;
    private getFinancialAggregatesByDateRangeUseCase: GetFinancialAggregatesByDateRangeUseCase;
    private summaryGateway: SummaryGateway;

    constructor() {
        this.summaryGateway = new FirebaseSummaryRepository();
        this.getExpensivesDetailsUseCase = new GetExpensivesCase(this.summaryGateway);
        this.getGeneralSummaryUseCase = new GetGeneralSummaryUseCase(this.summaryGateway);
        this.getProfitDetailsUseCase = new GetProfitDetailsUseCase(this.summaryGateway);
        this.getEquityDetailsUseCase = new GetEquityDetailsUseCase(this.summaryGateway);
        this.getFinancialAggregatesByDateRangeUseCase = new GetFinancialAggregatesByDateRangeUseCase(this.summaryGateway);
    }

    async getGeneralSummary(input: GetGeneralSummaryInput): Promise<Result<GetGeneralSummaryOutput, GetGeneralSummaryError>> {
        return this.getGeneralSummaryUseCase.execute(input);
    }

    async getProfitDetails(input: GetProfitDetailsInput): Promise<Result<GetProfitDetailsOutput, GetProfitDetailsError>> {
        return this.getProfitDetailsUseCase.execute(input);
    }

    async getEquityDetails(input: GetEquityDetailsInput): Promise<Result<GetEquityDetailsOutput, GetEquityDetailsError>> {
        return this.getEquityDetailsUseCase.execute(input);
    }

    async getExpensivesDetails(input: GetExpensivesInput): Promise<Result<GetExpensivesOutput, GetExpensivesError>> {
        return this.getExpensivesDetailsUseCase.execute(input);
    }

    async getFinancialAggregatesByDateRange(input: GetFinancialAggregatesInput): Promise<Result<GetFinancialAggregatesOutput, GetFinancialAggregatesError>> {
        return this.getFinancialAggregatesByDateRangeUseCase.execute(input);
    }
}
