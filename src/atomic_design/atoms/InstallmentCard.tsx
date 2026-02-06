import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";

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
            {new Date(installment.dueDate).toLocaleDateString()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

