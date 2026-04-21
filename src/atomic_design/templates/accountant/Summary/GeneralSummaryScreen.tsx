import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, useTheme, CardActionArea, Divider, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import type { GeneralSummary } from "../../../../features/summary/domain/business/entities/Summary";

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PaymentsIcon from "@mui/icons-material/Payments";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const orchestrator = new SummaryOrchestrator();

export const GeneralSummaryScreen = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const companyAuth = useAppSelector((state) => state.user.user?.companyId ?? "");

    const [loading, setLoading] = useState<boolean>(true);
    const [summary, setSummary] = useState<GeneralSummary | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!companyAuth) return;
            setLoading(true);
            const result = await orchestrator.getGeneralSummary({ companyId: companyAuth });
            if (result.ok && result.value) {
                setSummary(result.value.summary);
            }
            setLoading(false);
        };
        fetchSummary();
    }, [companyAuth]);

    if (loading || !summary) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            p: { xs: 2, md: 4 },
            minHeight: "100vh",
            backgroundColor: theme.palette.background.default,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>

            <Box sx={{ maxWidth: 900, width: "100%" }}>
                <Box sx={{ textAlign: "center", mb: 5 }}>
                    <Typography variant="h4" mb={4} fontWeight="bold" color="primary" textAlign="center">
                        Resumen General
                    </Typography>
                </Box>

                {/*dinero en caja */}
                <Card
                    sx={{
                        m: 1,
                        mb: 4,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        color: "white",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                        position: "relative"
                    }}
                >
                    <Box sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}>
                        <AssessmentIcon sx={{ fontSize: 200 }} />
                    </Box>
                    <CardContent sx={{ p: 4, position: "relative" }}>
                        <Typography variant="h6" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                            dinero en la caja actualmente
                        </Typography>
                        <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
                            $ {FormatNumberToMoney(summary.cashOnHand)}
                        </Typography>
                        <Divider sx={{ bgcolor: theme.palette.success.main, mb: 2 }} />
                    </CardContent>
                </Card>


                {/* contenedor de tarjetas*/}
                <Grid container spacing={2} sx={{ justifyContent: "center" }} >

                    <Grid >
                        {/* Tarjeta mediana clicable - patrimonio después de gastos */}
                        <Card sx={{ boxShadow: 2, borderRadius: 3, height: "100%" }}>
                            <CardActionArea
                                onClick={() => navigate(ScreenPaths.accountant.equityDetails)}
                                sx={{ p: 2, textAlign: "center" }}
                            >
                                <Box sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1 }}>
                                    <TrendingUpIcon sx={{ fontSize: 200 }} />
                                </Box>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                        Patrimonio después de gastos
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        $ {FormatNumberToMoney(summary.equityAfterExpenses)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                        Presiona para ver desglose
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    <Grid>
                        <Card sx={{ boxShadow: 2, borderRadius: 2, position: "relative", height: "100%" }}>
                            <CardActionArea
                                onClick={() => navigate(ScreenPaths.accountant.businessExpenses)}
                                sx={{ height: "100%" }}
                            >
                                <Box sx={{ position: "absolute", opacity: 0.1 }}>
                                    <PaymentsIcon sx={{ fontSize: 150 }} />
                                </Box>
                                <CardContent sx={{ textAlign: "center", py: 3 }}>

                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Gastos de negocio
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" color="error.main">
                                        $ {FormatNumberToMoney(summary.businessExpenses)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                        Presiona para ver desglose
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    {/* Deuda adquirida */}
                    <Grid>
                        <Card sx={{ boxShadow: 2, borderRadius: 2, position: "relative", height: "100%" }}>
                            <CardActionArea
                                onClick={() => navigate(ScreenPaths.accountant.financialDebts)}
                                sx={{ height: "100%" }}
                            >
                                <CardContent sx={{ textAlign: "center", py: 3 }}>
                                    <Box sx={{ position: "absolute", right: 0, top: -20, opacity: 0.1 }}>
                                        <PaymentsIcon sx={{ fontSize: 150 }} />
                                    </Box>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        Deuda adquirida
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                                        $ {FormatNumberToMoney(summary.acquiredDebt)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                        Presiona para ver desglose
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                </Grid >

                {/*dinero atrasado */}
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
                        <Typography variant="h6" sx={{ opacity: 0.8, mb: 1, fontWeight: 500 }}>
                            Dinero atrasado
                        </Typography>
                        <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
                            $ {FormatNumberToMoney(summary.overdueMoney)}
                        </Typography>
                        <Divider sx={{ bgcolor: theme.palette.error.main, mb: 2 }} />
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};
