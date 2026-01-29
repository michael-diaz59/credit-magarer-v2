import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useDebtPermissions } from "./useDebtPermissions";
import type { DebtFormMode } from "./DebtFormMode";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { DebtForm } from "./DebtFormM";

export const ViewDebtScreen = () => {
  const companyId = useAppSelector(
    (state) => state.user.user?.companyId || "undefined",
  );
  const { debitId } = useParams<{ debitId: string }>();
  const navigate = useNavigate();
  const { canEditDebt } = useDebtPermissions();

  const [mode, setMode] = useState<DebtFormMode>("view");
  const [form, setForm] = useState<Omit<Debt, "id"> | null>(null);

  useEffect(() => {
    const loadDebt = async () => {
      if (!debitId) return;
      if (canEditDebt) {
        setMode("edit");
      }

      const orchestrator = new DebtOrchestrator();
      const result = await orchestrator.getDebitById({
        idDebt: debitId,
        companyId: companyId,
      });

      if (result.state.ok) {
        setForm(result.state.value);
      } else {
        console.log(result.state.error);
      }
    };

    loadDebt();
  }, [debitId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              name === "totalAmount" ||
              name === "installmentCount" ||
              name === "interestRate"
                ? Number(value)
                : value,
          }
        : prev,
    );
  };

  const handleUpdateDebt = async () => {
    if (!form || !debitId) return;

    const orchestrator = new DebtOrchestrator();
    console.log("editar debt")
    const update=await orchestrator.updateDebtUse({
      isNewCollector: true,
      companyId: companyId,
      debt: form as Debt,
    });

    console.log(update)

    if (canEditDebt) {
      setMode("edit");
      return;
    }
    setMode("view");
  };

  if (!form) return null;

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Detalle de la deuda
          </Typography>

          <DebtForm
            form={form}
            mode={mode}
            onChange={mode === "edit" ? handleChange : undefined}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button onClick={() => navigate(-1)}>Volver</Button>

            {canEditDebt && mode === "view" && (
              <Button variant="outlined" onClick={() => setMode("edit")}>
                Editar
              </Button>
            )}

            {canEditDebt && mode === "edit" && (
              <Button variant="contained" onClick={handleUpdateDebt}>
                Actualizar
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
