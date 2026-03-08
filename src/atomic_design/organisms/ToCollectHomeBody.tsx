import { Box, Button, Typography, Stack, Card, CardContent } from "@mui/material";
import type { Installment } from "../../features/debits/domain/business/entities/Installment";
import { useState } from "react";
import { groupInstallmentsByRoute } from "../../features/collector/helpers/groupInstallmentsByRoute";
import { RouteGroup } from "../molecules/RouteGroup";
import { CustomerAccordion } from "../molecules/CustomerAccordion";
import type { CollectorPayment } from "../../features/collector/domain/business/entities/CollectorPayment";

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
  const [expandedUnassigned, setExpandedUnassigned] = useState<Map<string, boolean>>(new Map());

  // Agrupar cuotas
  const allInstallments = [...pending, ...overdue];
  const { routeGroups, unassigned } = groupInstallmentsByRoute(allInstallments, collectorRoutes);

  const toggleRoute = (route: string, isExpanded: boolean) => {
    const newExpanded = new Map(expandedRoutes);
    newExpanded.set(route, isExpanded);
    setExpandedRoutes(newExpanded);
  };

  const toggleUnassignedCustomer = (customerId: string, isExpanded: boolean) => {
    const newExpanded = new Map(expandedUnassigned);
    newExpanded.set(customerId, isExpanded);
    setExpandedUnassigned(newExpanded);
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
          customers={data.customers}
          expanded={expandedRoutes.get(routeName) ?? true} // Por defecto expandido
          onChange={(isExpanded) => toggleRoute(routeName, isExpanded)}
          onClick={onClick}
        />
      ))}

      {/* 2. Sin Ruta Asignada */}
      {unassigned.customers.size > 0 && (
        <Box mt={routeGroups.size > 0 ? 4 : 0}>
          {routeGroups.size > 0 && (
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ ml: 1, mb: 2 }}>
              Sin Ruta Asignada
            </Typography>
          )}

          {Array.from(unassigned.customers.entries()).map(([customerId, data]) => (
            <CustomerAccordion
              key={customerId}
              customerName={data.customerName}
              pending={data.pending}
              overdue={data.overdue}
              expanded={expandedUnassigned.get(customerId) ?? true}
              onChange={(isExpanded) => toggleUnassignedCustomer(customerId, isExpanded)}
              onClick={onClick}
            />
          ))}
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
  const [expandedCustomers, setExpandedCustomers] = useState<Map<string, boolean>>(new Map());

  // Agrupar por cliente (aquí no filtramos por deuda vieja porque ya están pagadas, pero agrupamos por cliente)
  const customers = new Map<string, { customerName: string; installments: Installment[] }>();

  paid.forEach(i => {
    if (!customers.has(i.costumerId)) {
      customers.set(i.costumerId, { customerName: i.costumerName, installments: [] });
    }
    customers.get(i.costumerId)!.installments.push(i);
  });

  const toggleCustomer = (customerId: string, isExpanded: boolean) => {
    const newExpanded = new Map(expandedCustomers);
    newExpanded.set(customerId, isExpanded);
    setExpandedCustomers(newExpanded);
  };

  return (
    <Box>
      <Typography variant="h6" color="success.main" mb={2} sx={{ ml: 1 }}>
        Cuotas pagadas ({paid.length})
      </Typography>

      {Array.from(customers.entries()).map(([customerId, data]) => (
        <CustomerAccordion
          key={customerId}
          customerName={data.customerName}
          pending={data.installments} // Reutilizamos pending para mostrar las pagadas
          overdue={[]}
          expanded={expandedCustomers.get(customerId) ?? false}
          onChange={(isExpanded) => toggleCustomer(customerId, isExpanded)}
          onClick={onClick}
        />
      ))}

      {paid.length === 0 && (
        <Typography align="center" color="text.secondary" mt={4}>
          No hay cuotas pagadas recientemente.
        </Typography>
      )}
    </Box>
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