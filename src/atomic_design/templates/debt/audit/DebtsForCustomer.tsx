import {
  Box,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { DebtCard } from "../../../atoms/DebtCard";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";

export const DebtsForCustomer = () => {
  const navigate = useNavigate();
  const { docCostumer } = useParams<{ docCostumer: string }>();

  const companyId = useAppSelector(
    (state) => state.user.user?.companyId
  );

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     console.log("init")
     console.log(companyId)
     console.log(docCostumer)

    if (!companyId || !docCostumer) return;

    const orchestrator = new DebtOrchestrator();

    const loadDebts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("obteniendo debts de cliente"+docCostumer )
        const result = await orchestrator.getDebstByCostumerDocument({
          companyId,
          // 🔥 si el backend soporta el filtro, mejor aquí
          costumerDocument: docCostumer,
        });

        if (result.state.ok) {
          console.log(result.state.value)
          setDebts(result.state.value);
        } else {
          setError("No se pudieron cargar las deudas del cliente");
        }
      } catch {
        setError("Error inesperado al cargar las deudas");
      } finally {
        setLoading(false);
      }
    };

    loadDebts();
  }, [companyId, docCostumer]);

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
        Deudas del cliente
      </Typography>

      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      {debts.length === 0 ? (
        <Typography color="text.secondary">
          Este cliente no tiene deudas registradas
        </Typography>
      ) : (
        <Stack spacing={2}>
          {debts.map((debt: Debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onClick={(d) =>
                navigate(
                  ScreenPaths.auditor.debit(d.id)
                )
              }
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};
