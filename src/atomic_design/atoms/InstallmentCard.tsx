import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import type { Debt } from "../../features/debits/domain/business/entities/Debt";
import { formatISOToInputDate } from "../../core/helpers/dates/dateConvert";
import { calculateInstallmentArrears } from "../../features/debits/domain/business/services/calculateInstallmentArrears";

export const InstallmentCard = ({
  installment,
  debt,
  onClick,
}: {
  installment: Installment;
  debt?: Debt | null;
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
              {installment.clientName}
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
            📄 {installment.clientDocument}
          </Typography>

          <Typography variant="body2">
            📍 {installment.clientAddres.address},{" "}
            {installment.clientAddres.neighborhood}
          </Typography>

          {(() => {
            const pendingBase = installment.outstandingReceivablesAmount ?? installment.amount;
            const arrearsInfo = calculateInstallmentArrears({ installment, debt });
            const pendingArrears = arrearsInfo.totalPendingArrears;
            const isPartiallyPaid = (installment.amountPaid ?? 0) > 0 || (installment.outstandingReceivablesAmount < installment.amount);

            return (
              <Box>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                  💰 Cuota {installment.installmentNumber} –{" "}
                  <strong>${pendingBase.toLocaleString()}</strong>
                  {pendingArrears > 0 && (
                    <Typography component="span" variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                      (+ ${pendingArrears.toLocaleString()} mora)
                    </Typography>
                  )}
                </Typography>
                {isPartiallyPaid && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Abonado: ${(installment.amountPaid ?? 0).toLocaleString()} de ${(installment.amount ?? 0).toLocaleString()}
                  </Typography>
                )}
              </Box>
            );
          })()}

          <Typography variant="body2">
            📅 Vence:{" "}
            {formatISOToInputDate(installment.paymentDate || installment.dueDate)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

