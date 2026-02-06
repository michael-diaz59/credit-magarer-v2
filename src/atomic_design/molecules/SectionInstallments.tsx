import { Box, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { InstallmentCard } from "../atoms/InstallmentCard";

interface SectionProps {
  title: string;
  color: "error" | "warning" | "success";
  installments: Installment[];
  onClick: (installment: Installment) => void;
}
export const SectionInstallments = ({ title, color, installments,onClick }: SectionProps) => {

  return (
    <Box>
      <Typography variant="h6" color={`${color}.main`} mb={1}>
        {title} ({installments.length})
      </Typography>

      {installments.length === 0 && (<Typography color="text.secondary">
        No hay cuotas en esta sección
      </Typography>)}

      <Stack spacing={2}>
        {installments.map((i) => (
          <InstallmentCard key={i.id} installment={i} onClick={onClick}/>
        ))}
      </Stack>
    </Box>
  );
};


