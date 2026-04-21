import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Button, useTheme, CardActionArea } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import type { ProfitDetails } from "../../../../features/summary/domain/business/entities/Summary";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Divider from "@mui/material/Divider";
import type { GetExpensivesOutput } from "../../../../features/summary/domain/business/useCases/GetExpensivesCase";

const orchestrator = new SummaryOrchestrator();

export const ProfitDetailsScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const companyAuth = useAppSelector((state) => state.user.user?.companyId ?? "");
    const [expenses, setExpenses] = useState<GetExpensivesOutput | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<ProfitDetails | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!companyAuth) return;
            setLoading(true);
            const result = await orchestrator.getProfitDetails({ companyId: companyAuth });
            if (result.ok && result.value) {
                setDetails(result.value.details);
            }
            const resultExpenses = await orchestrator.getExpensivesDetails({ companyId: companyAuth });
            if (resultExpenses.ok && resultExpenses.value) {
                setExpenses(resultExpenses.value);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [companyAuth]);

    if (loading || !details) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, margin: "auto" }}>
            <Box display="flex" alignItems="center" mb={4}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2 }}
                >
                    Volver
                </Button>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Desglose de Ganancias
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>

                {/* Ganancias con papeleria */}
                <Card sx={{ boxShadow: 3, borderRadius: 3, bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText }}>
                    <CardActionArea onClick={() => navigate(ScreenPaths.accountant.debits)}>
                        <CardContent sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                Ganancias en papelería
                            </Typography>
                            <Typography variant="h3" fontWeight="bold">
                                $ {FormatNumberToMoney(details.stationeryProfits)}
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                Presiona para ver detalles de créditos
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {/* Ganancias antes de gastos */}
                <Card sx={{ boxShadow: 3, borderRadius: 3, bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}>
                    <CardActionArea onClick={() => navigate(ScreenPaths.accountant.debits)}>
                        <CardContent sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                Ganancias antes de gastos(sin papeleria)
                            </Typography>
                            <Typography variant="h3" fontWeight="bold">
                                $ {FormatNumberToMoney(details.profitsBeforeExpenses)}
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                Presiona para ver detalles de créditos
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {/*Gastos del negocio */}
                <Card
                    sx={{
                        m: 1,
                        mb: 4,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                        color: "white",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                        position: "relative"
                    }}
                >
                    <Box sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}>
                        <SwapHorizIcon sx={{ fontSize: 200 }} />
                    </Box>
                    <CardContent sx={{ p: 4, position: "relative" }}>
                        <CardActionArea onClick={() => navigate(ScreenPaths.accountant.businessExpenses)}>
                            <Typography variant="h6" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                                Gastos del negocio
                            </Typography>
                            <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
                                $ {FormatNumberToMoney(expenses?.totalExpenses)}
                            </Typography>
                        </CardActionArea>
                        <Divider sx={{ bgcolor: theme.palette.error.main, mb: 2 }} />
                    </CardContent>
                </Card>

            </Box>
        </Box>
    );
};
