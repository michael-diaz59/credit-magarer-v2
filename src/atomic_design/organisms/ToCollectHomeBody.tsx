import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { SectionInstallments } from "../molecules/SectionInstallments";
import type { CollectorPayment } from "../../features/collector/domain/business/entities/CollectorPayment";

export interface ToCollectBodyProps {
  pending: Installment[];
  overdue: Installment[];
  onClick: (installment: Installment) => void;
}

export const ToCollectBody = ({
  pending,
  overdue,
  onClick,
}: ToCollectBodyProps) => {
  return (
    <>
      <SectionInstallments
        title="Cuotas en mora"
        color="error"
        installments={overdue}
        onClick={onClick}
      />

      <Divider sx={{ my: 3 }} />

      <SectionInstallments
        title="Cuotas pendientes"
        color="warning"
        installments={pending}
        onClick={onClick}
      />
    </>
  );
};

export interface CollectedBodyProps {
  paid: Installment[];
  onClick: (installment: Installment) => void;
}

export const CollectedBody = ({ paid, onClick }: CollectedBodyProps) => {
  return (
    <SectionInstallments
      title="Cuotas pagadas"
      color="success"
      installments={paid}
      onClick={onClick}
    />
  );
};

interface ToDisburseBodyProps {
  payments: CollectorPayment[];
}

export const ToDisburseBody = ({
  payments,
}: ToDisburseBodyProps) => {
  if (payments.length === 0) {
    return (
      <Typography color="text.secondary">
        No hay pagos pendientes para desembolsar
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {payments.map((payment, index) => (
        <Card key={index} variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography fontWeight="bold">
                💰 ${Number(payment.amount).toLocaleString()}
              </Typography>

              <Typography variant="body2">
                📅 Registrado:{" "}
                {new Date(payment.registresDate).toLocaleDateString()}
              </Typography>

              <Typography variant="body2">
                🏦 Pago:{" "}
                {new Date(payment.paymentDate).toLocaleDateString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};