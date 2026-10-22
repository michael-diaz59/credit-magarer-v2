import { Box, Typography, CircularProgress, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { DebtCard } from "../../../atoms/DebtCard";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import { DebtTableAccountant } from "../../../molecules/DebtTable";
import type { DebtPaymentCapacity } from "../../../../features/debits/domain/business/services/calculateDebtPaymentCapacity";
import InstallmentsOrchestrator from "../../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { getLocalDate } from "../../../../core/helpers/dates/calculateDays";

export const AccountantDebtsForCustomer = () => {
  const navigate = useNavigate();
  const { docCostumer } = useParams<{ docCostumer: string }>();

  const companyId = useAppSelector((state) => state.user.user?.companyId);

  // detectar tamaño de pantalla
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installmentsOrchestrator = useMemo(() => new InstallmentsOrchestrator(), []);
  const [capacities, setCapacities] = useState<Record<string, DebtPaymentCapacity>>({});
  const [loadingCapacities, setLoadingCapacities] = useState(false);

  useEffect(() => {
    if (!companyId || !docCostumer) return;

    const orchestrator = new DebtOrchestrator();

    const loadDebts = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await orchestrator.getDebstByCostumerDocument({
          companyId,
          costumerDocument: docCostumer,
        });

        if (result.state.ok) {
          const sortedDebts = [...result.state.value].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          setDebts(sortedDebts);

          // Cargar capacidades de pago con mora y aplazamiento a hoy
          try {
            setLoadingCapacities(true);
            const capResult = await installmentsOrchestrator.getDebtsPaymentCapacities({
              companyId,
              debts: sortedDebts,
              todayDateStr: getLocalDate(new Date()),
            });
            if (capResult.ok) {
              setCapacities(capResult.value.capacities);
            }
          } catch (capErr) {
            console.error("Error al calcular capacidades de pago:", capErr);
          } finally {
            setLoadingCapacities(false);
          }
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
  }, [companyId, docCostumer, installmentsOrchestrator]);

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
        <>
          {/* Mobile → Cards */}
          {isMobile && (
            <Grid container spacing={2}>
              {debts.map((debt: Debt) => (
                <Grid key={debt.id}>
                  <DebtCard
                    debt={debt}
                    onClick={(d) =>
                      navigate(ScreenPaths.accountant.payment(d.id))
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Desktop → Tabla de Contador */}
          {!isMobile && (
            <DebtTableAccountant
              debts={debts}
              onClick={(d) => navigate(ScreenPaths.accountant.payment(d.id))}
              capacities={capacities}
              loadingCapacities={loadingCapacities}
            />
          )}
        </>
      )}
    </Box>
  );
};
