import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";

export const InstallmentCard = ({
  installment,
  onClick,
}: {
  installment: Installment;
  onClick?: (installment: Installment) => void;
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick
          ? { boxShadow: 3 }
          : undefined,
      }}
      onClick={() => onClick?.(installment)}
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight="bold">
              {installment.costumerName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {installment.managed && installment.managementDate === new Date().toISOString().split("T")[0] && (
                <Chip
                  label="Gestionado"
                  color="info"
                  size="small"
                  variant="filled"
                />
              )}
              {installment.attemptedCollection && installment.dateAttemptedPayment === new Date().toISOString().split("T")[0] && (
                <Chip
                  label="Intento realizado"
                  color="warning"
                  size="small"
                  variant="filled"
                />
              )}
              <Chip
                label={installment.status.replace("_", " ")}
                color={
                  installment.status === "pendiente"
                    ? "error"
                    : "warning"
                }
                size="small"
              />
            </Stack>
          </Stack>

          <Typography variant="body2">
            📄 {installment.costumerDocument}
          </Typography>

          <Typography variant="body2">
            📍 {installment.costumerAddres.address},{" "}
            {installment.costumerAddres.neighborhood}
          </Typography>

          <Typography variant="body2">
            💰 Cuota {installment.installmentNumber} –{" "}
            <strong>
              ${installment.amount.toLocaleString()}
            </strong>
          </Typography>

          <Typography variant="body2">
            📅 Vence:{" "}
            {formatISOToInputDate(installment.dueDate)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

