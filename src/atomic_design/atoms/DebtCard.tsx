import {
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";

interface Props {
  debt: Debt;
  onClick?: (debt: Debt) => void;
}

export const DebtCard = ({ debt, onClick }: Props) => {
  return (
    <Card
      variant="outlined"
      onClick={() => onClick?.(debt)}
      sx={{
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        minWidth: 260,          // 👈 ancho mínimo
        maxWidth: 360,          // 👈 evita tarjetas demasiado grandes
        borderRadius: 2,
        transition: "box-shadow 0.2s ease",
        "&:hover": onClick ? { boxShadow: 3 } : undefined,
      }}
    >
      <CardContent
        sx={{
          p: 2,                 // 👈 padding compacto
          "&:last-child": { pb: 2 },
        }}
      >
        <Stack spacing={1.2}>
          {/* Fecha */}
          <Typography variant="caption" color="text.secondary">
            Creado el {debt.createdAt}
          </Typography>

          <Divider />

          {/* Nombre de la deuda */}
          <Typography
            variant="subtitle1"
            fontWeight={600}
            noWrap
          >
            {debt.name}
          </Typography>

          {/* Cliente */}
          <Typography
            variant="body2"
            fontWeight={500}
            noWrap
          >
            {debt.costumerName}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Cédula: {debt.costumerDocument}
          </Typography>

          {/* Monto */}
          <Typography
            variant="h6"
            color="primary"
            textAlign="right"
            fontWeight={700}
          >
            ${debt.totalAmount.toLocaleString()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};