export interface GeneralSummary {
    cashOnHand: number;
    profitAfterExpenses: number;
    equityAfterExpenses: number;
    businessExpenses: number;
    acquiredDebt: number;
    overdueMoney: number;
}

export interface ProfitDetails {
    stationeryProfits: number;
    profitsBeforeExpenses: number;
}

export interface EquityDetails {
    socialContribution: number;
    profitAfterExpenses: number;
    totalFinancialDebts: number;
}

export interface GrossProfitDetails {
    collectionProfits: number;
    lateFeeProfits: number;
    stationeryProfits: number;
    totalGrossProfit: number;
}

