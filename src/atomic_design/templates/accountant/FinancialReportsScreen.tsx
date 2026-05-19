import { Box, Divider, Typography, useTheme } from "@mui/material";
import { GeneralSummaryScreen } from "./Summary/GeneralSummaryScreen.tsx";
import { BalanceSheetScreen } from "./BalanceSheet/BalanceSheetScreen.tsx";
import { ForecastScreen } from "./Forecast/ForecastScreen.tsx";

export const FinancialReportsScreen = () => {
    const theme = useTheme();

    return (
        <Box sx={{ 
            backgroundColor: theme.palette.background.default,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            pb: 8
        }}>
            <Box sx={{ pt: 4, px: 4, textAlign: "center" }}>
                <Typography variant="h2" fontWeight="900" color="primary">
                    Informe Financiero Consolidado
                </Typography>
                <Typography variant="h6" color="textSecondary">
                    Vista unificada de resumen, balance y pronósticos
                </Typography>
            </Box>

            <Box id="general-summary-section">
                <GeneralSummaryScreen />
            </Box>

            <Divider sx={{ my: 4, mx: 10, borderBottomWidth: 2, borderStyle: 'dashed' }} />

            <Box id="balance-sheet-section">
                <BalanceSheetScreen />
            </Box>

            <Divider sx={{ my: 4, mx: 10, borderBottomWidth: 2, borderStyle: 'dashed' }} />

            <Box id="forecast-section">
                <ForecastScreen />
            </Box>
        </Box>
    );
};
