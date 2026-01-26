import { Card, CardContent, Typography, Stack } from "@mui/material";
import type Visit from "../../../../features/visits/domain/business/entities/Visit";
import { useState } from "react";

interface Props {
  visit: Visit;
  onClick?: () => void;
}

export const VisitCard = ({ visit, onClick }: Props) => {
  console.log("estado:",visit.state.code)
  const [state] = useState(() => {
    if (visit.state.code === "completed") {
      return "completado";
    } else {
      return "pendiente";
    }
  });

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        height: "100%",
        "&:hover": { boxShadow: 6 },
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {visit.customerName}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Cédula: {visit.customerDocument}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estado: {state}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Nombre: {visit.customerName}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
