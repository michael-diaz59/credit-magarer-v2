import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { SectionInstallments } from "../molecules/SectionInstallments";
import type { CollectorPayment } from "../../features/collector/domain/business/entities/CollectorPayment";

export interface ToCollectBodyProps {
  pending: Installment[];
  overdue: Installment[];
  onClick: (installment: Installment) => void;
}

import { Box, Button } from "@mui/material";
// import AddRoadIcon from '@mui/icons-material/AddRoad'; // Assuming icon exists or using text
import { useState } from "react";
import { groupInstallmentsByRoute } from "../../features/collector/helpers/groupInstallmentsByRoute";
import { RouteGroup } from "../molecules/RouteGroup";

export interface ToCollectBodyProps {
  pending: Installment[];
  overdue: Installment[];
  onClick: (installment: Installment) => void;
  // Props para rutas
  collectorRoutes?: Record<string, string[]>;
  onOpenRouteManagement?: () => void;
}

export const ToCollectBody = ({
  pending,
  overdue,
  onClick,
  collectorRoutes,
  onOpenRouteManagement,
}: ToCollectBodyProps) => {
  const [expandedRoutes, setExpandedRoutes] = useState<Map<string, boolean>>(new Map());

  // Agrupar cuotas
  const allInstallments = [...pending, ...overdue];
  const { routeGroups, unassigned } = groupInstallmentsByRoute(allInstallments, collectorRoutes);

  const toggleRoute = (route: string, isExpanded: boolean) => {
    const newExpanded = new Map(expandedRoutes);
    newExpanded.set(route, isExpanded);
    setExpandedRoutes(newExpanded);
  };

  return (
    <Box position="relative" minHeight="100%">

      {/* Botón para gestionar rutas */}
      {onOpenRouteManagement && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={onOpenRouteManagement}
            sx={{ borderRadius: 4 }}
          >
            Gestionar Rutas
          </Button>
        </Box>
      )}

      {/* 1. Grupos de Rutas */}
      {Array.from(routeGroups.entries()).map(([routeName, data]) => (
        <RouteGroup
          key={routeName}
          routeName={routeName}
          pending={data.pending}
          overdue={data.overdue}
          expanded={expandedRoutes.get(routeName) ?? true} // Por defecto expandido
          onChange={(isExpanded) => toggleRoute(routeName, isExpanded)}
          onClick={onClick}
        />
      ))}

      {/* 2. Sin Ruta Asignada (mostramos como secciones planas si hay rutas, o normal si no hay rutas definidas) */}
      {(unassigned.pending.length > 0 || unassigned.overdue.length > 0) && (
        <Box mt={routeGroups.size > 0 ? 4 : 0}>
          {routeGroups.size > 0 && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sin Ruta Asignada
            </Typography>
          )}

          {unassigned.overdue.length > 0 && (
            <SectionInstallments
              title="Cuotas en mora"
              color="error"
              installments={unassigned.overdue}
              onClick={onClick}
            />
          )}

          {(unassigned.overdue.length > 0 && unassigned.pending.length > 0) && <Divider sx={{ my: 3 }} />}

          {unassigned.pending.length > 0 && (
            <SectionInstallments
              title="Cuotas pendientes"
              color="warning"
              installments={unassigned.pending}
              onClick={onClick}
            />
          )}
        </Box>
      )}

      {/* Mensaje vacío si no hay nada en absoluto */}
      {allInstallments.length === 0 && (
        <Typography align="center" color="text.secondary" mt={4}>
          No tienes cuotas pendientes ni vencidas.
        </Typography>
      )}
    </Box>
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