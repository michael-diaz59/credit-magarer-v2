import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Button, useTheme, CardActionArea } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import type { EquityDetails } from "../../../../features/summary/domain/business/entities/Summary";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

const orchestrator = new SummaryOrchestrator();

export const EquityDetailsScreen = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const companyAuth = useAppSelector((state) => state.user.user?.companyId ?? "");

    const [loading, setLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<EquityDetails | null>(null);


    useEffect(() => {
        const fetchDetails = async () => {

            if (!companyAuth) return;

            setLoading(true);
            const result = await orchestrator.getEquityDetails({ companyId: companyAuth });
            if (result.ok && result.value) {
                setDetails(result.value.details);
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
                    Patrimonio después de gastos
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
                {/* Tarjeta mediana clicable - Ganancia después de gastos */}
                <Card sx={{ boxShadow: 3, borderRadius: 3, m: 1 }}>
                    <CardActionArea
                        onClick={() => navigate(ScreenPaths.accountant.profitDetails)}
                        sx={{ p: 2, textAlign: "center" }}
                    >
                        <CardContent>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                Ganancia después de gastos
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                $ {FormatNumberToMoney(details.profitAfterExpenses)}
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.8 }}>
                                Presiona para ver desglose
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                {/* Aporte Social */}
                <Card sx={{ boxShadow: 3, borderRadius: 3, bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}>
                    <CardActionArea
                        onClick={() => navigate(ScreenPaths.accountant.incomes)}
                        sx={{ p: 2, textAlign: "center" }}
                    >
                        <CardContent sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                Aporte social
                            </Typography>
                            <Typography variant="h3" fontWeight="bold">
                                $ {FormatNumberToMoney(details.socialContribution)}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>



            </Box>
        </Box>
    );
};
