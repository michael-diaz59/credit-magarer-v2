import {
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import type { Debt, DebtTerms, DebtType } from "../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "./DebtFormMode";

const debtTypes: DebtType[] = ["credito", "prenda"];
const debtTermsList: DebtTerms[] = [
  "diario",
  "semanal",
  "quincenal",
  "mensual",
];

type Props = {
  form: Omit<Debt, "id">;
  mode: DebtFormMode;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

export const DebtForm = ({ form, mode, onChange }: Props) => {
  const readOnly = mode === "view";

  return (
    <Stack spacing={2}>
      <TextField
        label="Cédula del cliente"
        name="costumerDocument"
        value={form.costumerDocument}
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
      />

      <TextField
        select
        label="Tipo de deuda"
        name="type"
        value={form.type}
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
      >
        {debtTypes.map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Tasa de interés (%)"
        name="interestRate"
        value={form.interestRate}
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
      />

      <TextField
        label="Monto total"
        name="totalAmount"
        type="number"
        value={form.totalAmount}
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
      />

      <TextField
        select
        label="Frecuencia de cuotas"
        name="debtTerms"
        value={form.debtTerms}
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
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
        onChange={onChange}
        fullWidth
        InputProps={{ readOnly }}
      />

      <TextField
        label="Fecha de inicio"
        name="startDate"
        type="date"
        value={form.startDate}
        onChange={onChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
        InputProps={{ readOnly }}
      />

      <TextField
        label="Primera fecha de vencimiento"
        name="firstDueDate"
        type="date"
        value={form.firstDueDate}
        onChange={onChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
        InputProps={{ readOnly }}
      />
    </Stack>
  );
};
