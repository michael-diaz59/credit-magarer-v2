import { Box, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { ScreenPaths } from "../../core/helpers/name_routes";
import { isInstallmentLate } from "../sub_atomic_particles/installmentStatus";

type Props = {
  installment: Installment;
};

const statusColorMap: Record<
  Installment["status"],
  "default" | "success" | "warning" | "error"
> = {
  pendiente: "warning",
  incompleto: "warning",
  pagada: "success",
  renovada: "success",
  cancelada: "default",
  liquidada: "success",
};

export const InstallmentItem = ({ installment }: Props) => {
  const navigate = useNavigate();
  const isLate = isInstallmentLate(installment);

  const chipColor = isLate
    ? "error"
    : statusColorMap[installment.status];

  const chipLabel = isLate
    ? "en_mora"
    : installment.status;

  return (
    <Box
      p={2}
      border="1px solid"
      borderColor={isLate ? "error.main" : "divider"}
      borderRadius={2}
      sx={{
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "action.hover",
        },
      }}
      onClick={() =>
        navigate(ScreenPaths.auditor.payments(installment.id))
      }
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography fontWeight={500}>
          Cuota #{installment.installmentNumber} — $
          {installment.amount + installment.latepayment}
        </Typography>

        <Chip
          label={chipLabel}
          color={chipColor}
          size="small"
        />
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Vence: {installment.dueDate}
      </Typography>

      {installment.lateDueDate && (
        <Typography variant="body2" color="text.secondary">
          la cuota se registra con retrazo para fecha de :
          {" "}{installment.lateDueDate}
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary">
        valor base a cobrar:{" "}
        {installment.amount - installment.paidAmount}
      </Typography>

      {installment.latepayment > 0 && (
        <Typography variant="body2" color="text.secondary">
          valor de retraso a cobrar: {installment.latepayment}
        </Typography>
      )}

      {installment.paidAt && (
        <Typography variant="body2" color="text.secondary">
          Pagada el: {installment.paidAt}
        </Typography>
      )}
    </Box>
  );
};