import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { BaseDialog } from "../../atoms/BaseDialog";
import { DebtForm } from "./DebtFormM";


type DialogState = {
  open: boolean;
  success: boolean;
  message: string;
};


export const CreateDebtScreen = () => {
  const navigate = useNavigate();
  const companyId = useAppSelector(
    (state) => state.user.user?.companyId || ""
  );

  const [form, setForm] = useState<Omit<Debt, "id">>({
    name: "",
    collectorId: "",
    clientId: "",
    costumerDocument: "",
    costumerName: "",
    type: "credito",
    idVisit:"",
    debtTerms: "diario",
    status: "tentativa",
    interestRate: 0,
    totalAmount: 0,
    installmentCount: 1,
    startDate: "",
    firstDueDate: "",
    createdAt: new Date().toISOString().split("T")[0],
  });

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "totalAmount" ||
        name === "installmentCount" ||
        name === "interestRate"
          ? Number(value)
          : value,
    }));
  };

  const handleCreateDebt = async () => {
    const orchestrator = new DebtOrchestrator();

    const result = await orchestrator.createDebt({
      companyId,
      debt: form,
    });

    if (result.state.ok) {
      setDialog({
        open: true,
        success: true,
        message: "La deuda fue creada correctamente.",
      });
    } else {
      setDialog({
        open: true,
        success: false,
        message: "Ocurrió un error al crear la deuda.",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
    if (dialog.success) {
      navigate(ScreenPaths.advisor.office.debit.debits);
    }
  };

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <BaseDialog
        open={dialog.open}
        title={dialog.success ? "Deuda creada" : "Error"}
        body={dialog.message}
        onClick={handleCloseDialog}
        butonText="Aceptar"
      />

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Crear deuda
          </Typography>

          <DebtForm
            form={form}
            mode="create"
            onChange={handleChange}
          />

          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            mt={3}
          >
            <Button onClick={() => navigate(-1)}>
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateDebt}
              disabled={!form.startDate || !form.firstDueDate}
            >
              Crear deuda
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};