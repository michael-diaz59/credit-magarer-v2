
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Button,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import FinancialDebtOrchestrator from "../../../../features/financialDebt/domain/infraestructure/FinancialDebtOrchestrator";
import type { FinancialDebt } from "../../../../features/financialDebt/domain/business/entities/FinancialDebt";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { MoneyTypography } from "../../../atoms/MoneyTypography";

export const FinancialDebtsListScreen: React.FC = () => {
  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";
  const [debts, setDebts] = useState<FinancialDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDebts = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const orchestrator = new FinancialDebtOrchestrator();
        const result = await orchestrator.getAllFinancialDebts({ companyId });
        if (result.ok) {
          setDebts(result.value);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDebts();
  }, [companyId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Financiamientos
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(ScreenPaths.accountant.financialDebtRegistration)}
        >
          Nuevo Financiamiento
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {debts.map((debt) => (
          <Grid key={debt.id}>
            <Card
              sx={{
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
              onClick={() => navigate(ScreenPaths.accountant.financialDebtEdit(debt.id))}
            >
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {debt.name}
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <MoneyTypography label="Monto:" value={debt.amount} fontWeight="bold" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <MoneyTypography label="Cuota:" value={debt.installmentAmount} />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Periodicidad:</Typography>
                    <Typography fontWeight={500}>{debt.periocidad}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Inicio:</Typography>
                    <Typography>{debt.startDate}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {debts.length === 0 && (
        <Typography textAlign="center" color="text.secondary" mt={4}>
          No se encontraron financiamientos registrados.
        </Typography>
      )}
    </Box>
  );
};
