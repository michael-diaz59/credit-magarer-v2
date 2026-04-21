import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Payment } from "../../../features/debits/domain/business/entities/Payment";
import PaymentOrchestrator from "../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { BaseDialog } from "../../atoms/BaseDialog";
import type { DialogState } from "../../sub_atomic_particles/DialogState";
import FormatNumberToMoney from "../../sub_atomic_particles/FormatNumberToMoney";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { routeOrchestrator } from "../../../features/routes/domain/infraestructure/RouteOrchestrator";
import type { Route } from "../../../features/routes/domain/business/entities/Route";
import { RoutePaymentsAccordion } from "../../molecules/RoutePaymentsAccordion";

export const AccountantDailyOperations = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    success: false,
    message: "",
  });

  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyId = useAppSelector((state: any) => state.user.user?.companyId) || "";

  const paymentOrchestrator = useMemo(() => new PaymentOrchestrator(), []);

  const loadPayments = async () => {
    if (!companyId) return;
    setLoading(true);
    const result = await paymentOrchestrator.getByStatus({
      companyId,
      status: "registrado",
    });

    if (result.state.ok && result.state.value) {
      setPayments(result.state.value);
    } else {
      setDialog({
        open: true,
        success: false,
        message: "Ocurrió un error al cargar los movimientos registrados.",
      });
    }
    setLoading(false);
  };

  const loadRoutes = async () => {
    if (!companyId) return;
    const result = await routeOrchestrator.getRoutesUseCase.execute({ companyId });
    if (result.ok) {
      // Encontrar o agregar la ruta default si tiene saldo
      const fetchedRoutes = result.value;
      const defaultRoute = fetchedRoutes.find(r => r.id === "default");
      if (!defaultRoute) {
        // we could fetch it explicitly if it exists but is not in the list
        // or just rely on the next fetch if it's created during confirm
      }
      setRoutes(fetchedRoutes);
    }
  };

  const paymentsByRoute = useMemo(() => {
    return groupPaymentsByRoute(payments);
  }, [payments]);

  const routesWithPayments = useMemo(() => {
    return routes.map(route => ({
      route,
      payments: paymentsByRoute[route.id] || []
    }));
  }, [routes, paymentsByRoute]);

  const globalTotal = useMemo(() => {
    return routes.reduce((acc, route) => {
      const cashTotal = (route.totalCash2 || []).reduce((sum, c) => sum + c.amount, 0);
      const depositTotal = (route.totalDeposit || []).reduce((sum, d) => sum + d.amount, 0);
      return acc + cashTotal + depositTotal;
    }, 0);
  }, [routes]);

  useEffect(() => {
    loadPayments();
    loadRoutes();
  }, [companyId]);

  const toggleSelection = (paymentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const selectAll = () => {
    const selectablePayments = payments.filter(p => !p.isTight);
    if (selectedIds.length === selectablePayments.length) {
      setSelectedIds([]); // deselect all
    } else {
      setSelectedIds(selectablePayments.map((p) => p.id));
    }
  };

  const handleCuadrarPagos = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);

    const paymentsToSquare = payments.filter(p => selectedIds.includes(p.id));

    const result = await paymentOrchestrator.updateMultipleIsTight({
      companyId,
      payments: paymentsToSquare,
    });

    if (result.ok) {
      setDialog({
        open: true,
        success: true,
        message: `Se han cuadrado ${result.value.updatedCount} pagos correctamente.`,
      });
      // limpiar seleccion y recargar
      setSelectedIds([]);
      await loadPayments();
      loadRoutes(); // Recargar balances
    } else {
      setDialog({
        open: true,
        success: false,
        message: "Ocurrió un error al cuadrar los pagos.",
      });
    }
    setActionLoading(false);
  };

  const handleCardClick = async (payment: Payment) => {
    // Navigate to debt: We need to find the debt ID.
    // Payment has installmentId. Installment has debtId.
    navigate(ScreenPaths.accountant.payment(payment.id));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }



  console.log("paymentsByRoute:", paymentsByRoute);

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Cuadrar Movimientos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCuadrarPagos}
          disabled={selectedIds.length === 0 || actionLoading}
          sx={{ minWidth: 150 }}
        >
          {actionLoading ? <CircularProgress size={24} color="inherit" /> : "Cuadrar pagos"}
        </Button>
      </Box>

      <Box display="flex" justifyContent="center" mb={4}>
        <Box
          sx={{
            p: 2,
            px: 4,
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5 }}>
            Total Global de Rutas
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {FormatNumberToMoney(globalTotal)}
          </Typography>
        </Box>
      </Box>


      {payments.length === 0 ? (
        <Typography color="text.secondary" align="center" mt={4}>
          No hay movimientos registrados pendientes de confirmación.
        </Typography>
      ) : (
        <>
          <Box mb={2}>
            <Button size="small" onClick={selectAll}>
              {selectedIds.length === payments.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2, display: 'inline' }}>
              {selectedIds.length} seleccionado(s)
            </Typography>
          </Box>

          <Stack spacing={2}>
            {routesWithPayments.map(({ route, payments }) => (
              <RoutePaymentsAccordion
                key={route.id}
                route={route}
                payments={payments}
                selectedIds={selectedIds}
                onTogglePayment={toggleSelection}
                onCardClick={handleCardClick}
              />
            ))}
          </Stack>
        </>
      )}

      <BaseDialog
        open={dialog.open}
        body={dialog.message}
        onClick={() => setDialog({ open: false, success: false, message: "" })}
      />
    </Box>
  );
};

export function groupPaymentsByRoute(payments: Payment[]) {
  const grouped: Record<string, Payment[]> = {};

  for (const payment of payments) {
    const idRoute = payment.idRoute || "default";

    if (!grouped[idRoute]) {
      grouped[idRoute] = [];
    }
    grouped[idRoute].push(payment);
  }

  return grouped;
}

