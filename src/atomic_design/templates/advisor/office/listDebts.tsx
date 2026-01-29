import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Fab,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { DebtCard } from "../../../atoms/DebtCard";
import AddIcon from "@mui/icons-material/Add";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";

export const DebtsListScreen = () => {
  const navigate = useNavigate();
   const companyId = useAppSelector(
  (state) => state.user.user?.companyId
);

const [debts, setDebts] = useState<Debt[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

  
useEffect(() => {
  if(error)  return;
  if (!companyId) return;

  const orchestrator = new DebtOrchestrator();

  const loadDebts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await orchestrator.getDebts({
        companyId,
      });

      if (result.state.ok) {
        setDebts(result.state.value);
      } else {
        setError("No se pudieron cargar las deudas");
      }
    } catch {
      setError("Error inesperado al cargar las deudas");
    } finally {
      setLoading(false);
    }
  };

  loadDebts();
}, [companyId,error]);

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h6" mb={2}>
        Deudas
      </Typography>

      {debts.length === 0 ? (
        <Typography color="text.secondary">
          No hay deudas registradas
        </Typography>
      ) : (
        <Stack spacing={2}>
          {debts.map((debt:Debt) => (
    
            <DebtCard
              key={debt.id}
              debt={debt}
              onClick={(d) => navigate(ScreenPaths.advisor.office.debit.debit(d.id))}
            />
          ))}
        </Stack>
      )}
          {/* Botón flotante */}
    <Fab
      color="primary"
      aria-label="crear visita"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
      }}
      onClick={() => navigate(ScreenPaths.advisor.office.debit.CreateDebits)}
    >
      <AddIcon />
    </Fab>
    </Box>
  );
};
