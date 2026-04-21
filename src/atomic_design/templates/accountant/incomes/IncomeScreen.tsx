import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { useNavigate } from "react-router";
import type { Income } from "../../../../features/company/domain/business/entities/Income";
import CompanyOrchestrator from "../../../../features/company/domain/infraestructure/CompanyOrchestrator";
import { formatISOToInputDate } from "../../../../core/helpers/dates/dateConvert";







export const IncomeScreen = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const companyId = useAppSelector((state) => state.user.user?.companyId) || "";
  const companyOrchestrator = new CompanyOrchestrator();

  const onRegisterClick = () => {
    navigate(ScreenPaths.accountant.incomeRegistration);
  }

  const handleLoadIncomes = async () => {
    try {
      setLoading(true);
      const data = await companyOrchestrator.getIncomes({ companyId });
      if (data.ok) {
        setLoading(false);
        setIncomes(data.value.incomes);
      } else {
        setLoading(false);
        alert("error al cargar inversiones")
      }
    } catch (error) {
      console.error("Error cargando ingresos", error);
    } finally {
      setLoading(false);
    }
  };

  const onIncomeClick = (income: Income) => {
    navigate(ScreenPaths.accountant.incomeDetails(income.id));
  }

  return (
    <Box p={3}>
      {/* Botones superiores */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={onRegisterClick}
        >
          Registrar inversión
        </Button>

        <Button
          variant="outlined"
          onClick={handleLoadIncomes}
        >
          Cargar inversiones
        </Button>
      </Stack>

      {/* Estado de carga */}
      {loading && <CircularProgress />}

      {/* Lista */}
      {!loading && (
        <Paper elevation={2}>
          <List>
            {incomes.map((income) => (
              <ListItemButton
                key={income.id}
                onClick={() => onIncomeClick(income)}
              >
                <ListItemText
                  primary={`monto: $${income.amount}`}
                  secondary={`Inversionista: ${income.investorName} • Fecha: ${formatISOToInputDate(income.date)}`}
                />
              </ListItemButton>
            ))}

            {incomes.length === 0 && (
              <Typography p={2} textAlign="center">
                No hay inversiones cargadas
              </Typography>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};