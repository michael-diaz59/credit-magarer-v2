import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Button, useTheme, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import type { GrossProfitDetails } from "../../../../features/summary/domain/business/entities/Summary";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventNoteIcon from "@mui/icons-material/EventNote";
import InventoryIcon from "@mui/icons-material/Inventory";

const orchestrator = new SummaryOrchestrator();

export const GrossProfitDetailsScreen: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const companyAuth = useAppSelector((state) => state.user.user?.companyId ?? "");

    const [loading, setLoading] = useState<boolean>(true);
    const [details, setDetails] = useState<GrossProfitDetails | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!companyAuth) return;
            setLoading(true);
            const result = await orchestrator.getGrossProfitDetails({ companyId: companyAuth });
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

    const cards = [
        {
            title: "Ganancia por Intereses",
            value: details.collectionProfits,
            icon: <TrendingUpIcon sx={{ fontSize: 60, opacity: 0.2 }} />,
            color: theme.palette.primary.main,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        },
        {
            title: "Ganancia por Atrasos",
            value: details.lateFeeProfits,
            icon: <EventNoteIcon sx={{ fontSize: 60, opacity: 0.2 }} />,
            color: theme.palette.warning.main,
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        },
        {
            title: "Ganancia por Papelería",
            value: details.stationeryProfits,
            icon: <InventoryIcon sx={{ fontSize: 60, opacity: 0.2 }} />,
            color: theme.palette.success.main,
            gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, margin: "auto" }}>
            <Box display="flex" alignItems="center" mb={4}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2 }}
                >
                    Volver
                </Button>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Ganancias Brutas
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {cards.map((card, index) => (
                    <Grid key={index}>
                        <Card sx={{
                            height: '100%',
                            borderRadius: 4,
                            background: card.gradient,
                            color: 'white',
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.3s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                            }
                        }}>
                            <Box sx={{ position: "absolute", right: -10, top: -10 }}>
                                {card.icon}
                            </Box>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight="medium" gutterBottom sx={{ opacity: 0.9 }}>
                                    {card.title}
                                </Typography>
                                <Typography variant="h4" fontWeight="bold">
                                    $ {FormatNumberToMoney(card.value)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
