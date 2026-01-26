import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type {
  Debt,
  DebtTerms,
  DebtType,
} from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

const debtTypes: DebtType[] = ["credito", "prenda"];

const debtTermsList: DebtTerms[] = [
  "diario",
  "semanal",
  "quincenal",
  "mensual",
];

type DialogState = {
  open: boolean;
  success: boolean;
  message: string;
};

export const CreateDebtScreen = () => {
  const navigate = useNavigate();
  const companyId = useAppSelector((state) => state.user.user?.companyId || "");

  const [form, setForm] = useState<Omit<Debt, "id">>({
    name: "",
    collectorId: "",
    clientId: "",

    costumerDocument: "",
    costumerName: "",

    type: "credito",
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
        name === "totalAmount" || name === "installmentCount"
          ? Number(value)
          : value,
    }));
  };

  const handleCreateDebt = async () => {
    const debtOrchestrator = new DebtOrchestrator();

    const result = await debtOrchestrator.createDebt({
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
      if(result.state.error.code=="CUSTOMER_NOT_FOUND"){
           setDialog({
        open: true,
        success: false,
        message: "el documento dado no portenece a ningun cliente registrado",
      });
      return
      }
      setDialog({
        open: true,
        success: false,
        message: "Ocurrió un error al crear la deuda. Inténtalo nuevamente.",
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

          <Stack spacing={2}>
            <TextField
              label="Cédula del cliente"
              name="costumerDocument"
              value={form.costumerDocument}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Tipo de deuda"
              name="type"
              value={form.type}
              onChange={handleChange}
              fullWidth
            >
              {debtTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="tasa de interes (%)"
              name="interestRate"
              value={form.interestRate}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 0 }}
            ></TextField>

            <TextField
              label="Monto total"
              name="totalAmount"
              type="number"
              value={form.totalAmount}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="frecuencia de cuotas"
              name="debtTerms"
              value={form.debtTerms}
              onChange={handleChange}
              fullWidth
            >
              {debtTermsList.map((term) => (
                <MenuItem key={term} value={term}>
                  {term}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Número de cuotas"
              name="installmentCount"
              type="number"
              value={form.installmentCount}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Fecha de inicio"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Primera fecha de vencimiento"
              name="firstDueDate"
              type="date"
              value={form.firstDueDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate(-1)}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleCreateDebt}
                disabled={!form.startDate || !form.firstDueDate}
              >
                Crear deuda
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
