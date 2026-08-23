import {
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Chip,
  type ChipProps,
} from "@mui/material";

import type {
  Debt,
  DebtStatus,
} from "../../features/debits/domain/business/entities/Debt";
import { getDebtVisualStatus } from "../sub_atomic_particles/debtVisualStatus";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";

const debtStatusConfig: Record<
  DebtStatus,
  { label: string; color: ChipProps["color"] }
> = {
  tentativa: { label: "Tentativa", color: "default" },
  preAprobada: { label: "Pre-aprobada", color: "info" },
  preparacion: { label: "En preparación", color: "warning" },
  activa: { label: "Activa", color: "success" },
  corregir: { label: "Corregir", color: "warning" },
  pagada: { label: "Pagada", color: "success" },
  en_mora: { label: "En mora", color: "error" },
  inactivo: { label: "Inactivo", color: "default" },
  anulado: { label: "Anulado", color: "default" },
};

interface Props {
  debt: Debt;
  onClick?: (debt: Debt) => void;
}

export const DebtCard = ({ debt, onClick }: Props) => {
  const visualStatus = getDebtVisualStatus(debt);
  return (
    <Card
      variant="outlined"
      onClick={() => onClick?.(debt)}
      sx={{
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        minWidth: 260, // 👈 ancho mínimo
        maxWidth: 360, // 👈 evita tarjetas demasiado grandes
        borderRadius: 2,
        transition: "box-shadow 0.2s ease",
        "&:hover": onClick ? { boxShadow: 3 } : undefined,
      }}
    >
      <CardContent
        sx={{
          p: 2, // 👈 padding compacto
          "&:last-child": { pb: 2 },
          backgroundColor: debt.status === "pagada" ? "#b0b0b9ff" : "default",
        }}
      >
        <Stack spacing={1.2}>
          {/* Fecha */}
          <Typography variant="caption" color="text.secondary">
            Creado el {formatISOToInputDate(debt.createdAt)}
          </Typography>

          <Chip
            size="small"
            label={debtStatusConfig[visualStatus].label}
            color={debtStatusConfig[visualStatus].color}
          />

          <Divider />

          {/* Nombre de la deuda */}
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {debt.name}
          </Typography>

          {/* Cliente */}
          <Typography variant="body2" fontWeight={500} noWrap>
            {debt.clientName}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Cédula: {debt.clientDocument}
          </Typography>

          {/* Monto */}
          <Typography
            variant="h6"
            color="primary"
            textAlign="right"
            fontWeight={700}
          >
            ${debt.amount.toLocaleString()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
