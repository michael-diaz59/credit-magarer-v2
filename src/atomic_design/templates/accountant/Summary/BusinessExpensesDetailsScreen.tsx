import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, useTheme, Grid, IconButton, Stack, Divider, CardActionArea } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import SummaryOrchestrator from "../../../../features/summary/domain/infraestructure/SummaryOrchestrator";
import { type GetExpensivesOutput } from "../../../../features/summary/domain/business/useCases/GetExpensivesCase";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

export const BusinessExpensesDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetExpensivesOutput | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      setLoading(true);
      const orchestrator = new SummaryOrchestrator();
      const result = await orchestrator.getExpensivesDetails({ companyId });

      if (result.ok && result.value) {
        setData(result.value);
      }
      setLoading(false);
    };
    fetchData();
  }, [companyId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={4} textAlign="center">
        <Typography>Error al cargar los datos de gastos.</Typography>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  const expenseItems = [
    {
      label: "Nómina",
      amount: data.payrollExpenses,
      color: theme.palette.info.main,
      path: ScreenPaths.accountant.rosterUsers
    },
    {
      label: "Financiamientos",
      amount: data.financingPayments,
      color: theme.palette.warning.main,
      path: ScreenPaths.accountant.financialDebts
    },
    {
      label: "Impuestos",
      amount: data.taxExpenses,
      color: theme.palette.error.main,
      path: ScreenPaths.accountant.taxtPayments
    },
    {
      label: "otros Pagos",
      amount: data.othersExpenses,
      color: theme.palette.secondary.main,
      path: ScreenPaths.accountant.anotherPayments
    },
    {
      label: "credito anulado",
      amount: data.othersExpenses,
      color: theme.palette.secondary.main,
      path: ScreenPaths.accountant.debits
    },
  ];

  return (
    <Box sx={{
      p: { xs: 2, md: 4 },
      minHeight: "100vh",
      backgroundColor: theme.palette.background.default,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <Box sx={{ maxWidth: 800, width: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <IconButton onClick={() => navigate(-1)} color="primary">
            <ArrowBackIcon fontSize="large" />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gastos de Negocio
          </Typography>
        </Stack>

        <Card sx={{
          mb: 4,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
          color: "white",
          boxShadow: 3
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ opacity: 0.8, mb: 1 }}>Total Gastos</Typography>
            <Typography variant="h3" fontWeight="bold">
              $ {FormatNumberToMoney(data.totalExpenses)}
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {expenseItems.map((item) => (
            <Grid key={item.label}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: 2,
                height: "100%",
                borderLeft: `6px solid ${item.color}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" }
              }}>
                <CardActionArea
                  onClick={() => navigate(item.path)}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      $ {FormatNumberToMoney(item.amount)}
                    </Typography>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                      Ver detalles →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="caption" color="textSecondary" sx={{ textAlign: "center", display: "block" }}>
          * Los datos de gastos corresponden al acumulado de pagos históricos de la compañía.
        </Typography>
      </Box>
    </Box>
  );
};
