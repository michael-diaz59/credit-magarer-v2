import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { ScreenPaths } from "../../../core/helpers/name_routes";

/* =======================
   Tipos
======================= */

export type DebtStatus =
  | "preAprobada"
  | "tentativa"
  | "preparacion"
  | "activa"
  | "pagada"
  | "en_mora"
  | "cancelada";

/* =======================
   Config
======================= */

const ALL_STATUSES: DebtStatus[] = [
  "preAprobada",
  "preparacion",
  "activa",
  "pagada",
  "tentativa",
  "en_mora",
  "cancelada",
];

/* =======================
   Screen
======================= */

export const AuditorDebtsFiltersScreen = () => {
  const navigate = useNavigate();

  const companyId: string = useAppSelector(
    (state) => state.user.user?.companyId ?? "",
  );

  const debtOrchestrator = useMemo(
    () => new DebtOrchestrator(),
    [],
  );

  const [statuses, setStatuses] = useState<DebtStatus[]>([
    "preAprobada",
    "preparacion",
    "activa",
    "en_mora",
  ]);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadDebts = async (): Promise<void> => {
      if (!companyId) return;

      setLoading(true);

      const result = await debtOrchestrator.getByFilters({
        companyId,
        statuses,
        limit: 30,
      });

      if (!isMounted) return;

      if (result.ok) {
        setDebts(result.value.state);
      }

      setLoading(false);
    };

    loadDebts();

    return () => {
      isMounted = false;
    };
  }, [companyId, statuses, debtOrchestrator]);

  const isActive = (status: DebtStatus): boolean =>
    statuses.includes(status);

  const goToDebt = (debtId: string): void => {
    navigate(ScreenPaths.auditor.debit(debtId));
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600}>
        Auditoría de deudas
      </Typography>

      <Paper sx={{ p: 2, my: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {ALL_STATUSES.map((status) => {
            const active = isActive(status);

            return (
              <Chip
                key={status}
                label={status}
                clickable
                onClick={() => {
                  setStatuses((prev) =>
                    prev.includes(status)
                      ? prev.filter((s) => s !== status)
                      : [...prev, status],
                  );
                }}
                sx={{
                  backgroundColor: active
                    ? "primary.main"
                    : "grey.100",
                  color: active
                    ? "primary.contrastText"
                    : "text.primary",
                  "&:hover": {
                    backgroundColor: active
                      ? "primary.dark"
                      : "grey.200",
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {loading && <CircularProgress />}

      {!loading && (
        <Stack spacing={2}>
          {debts.map((debt) => (
            <Paper
              key={debt.id}
              sx={{
                p: 2,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": {
                  boxShadow: 4,
                },
              }}
              onClick={() => goToDebt(debt.id)}
            >
              <Typography fontWeight={600}>
                {debt.name}
              </Typography>

              <Typography variant="body2">
                Cliente: {debt.costumerName}
              </Typography>

              <Typography variant="body2">
                Monto: $
                {debt.totalAmount.toLocaleString()}
              </Typography>

              <Chip label={debt.status} sx={{ mt: 1 }} />
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};
