import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EquityDetails, GeneralSummary, ProfitDetails } from "../../features/summary/domain/business/entities/Summary";

interface SummaryState {
    generalSummary: GeneralSummary | null;
    profitDetails: ProfitDetails | null;
    equityDetails: EquityDetails | null;
}

const initialState: SummaryState = {
    generalSummary: null,
    profitDetails: null,
    equityDetails: null,
};

const summarySlice = createSlice({
    name: "summary",
    initialState,
    reducers: {
        setSummaryData(
            state,
            action: PayloadAction<{
                generalSummary: GeneralSummary;
                profitDetails: ProfitDetails;
                equityDetails: EquityDetails;
            }>
        ) {
            state.generalSummary = action.payload.generalSummary;
            state.profitDetails = action.payload.profitDetails;
            state.equityDetails = action.payload.equityDetails;
        },
        clearSummaryData(state) {
            state.generalSummary = null;
            state.profitDetails = null;
            state.equityDetails = null;
        },
    },
});

export const { setSummaryData, clearSummaryData } = summarySlice.actions;
export default summarySlice.reducer;
