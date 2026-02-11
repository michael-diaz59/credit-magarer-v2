import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";

import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";

import type { CollectorPayment } from "../../../features/collector/domain/business/entities/CollectorPayment";
import PayCollectorOrhectrator from "../../../features/collector/domain/infraestructure/PayCollectorOrhectrator";

import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";

import { ScreenPaths } from "../../../core/helpers/name_routes";
import {
  CollectorBottomBar,
  type CollectorHomeTab,
} from "../../organisms/CollectorBottomBar";

import {
  CollectedBody,
  ToCollectBody,
  ToDisburseBody,
} from "../../organisms/ToCollectHomeBody";

import { RouteManagementDialog } from "../../organisms/RouteManagementDialog";

/** indica si una fecha es menor a la actual */
export function IsPastDate(dateStr: string): boolean {
    const inputDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate < today;
}

/** indica si la fecha es igual o mayor a la actual */
export function IsFutureOrToday(dateStr: string): boolean {
  const inputDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

export const RecolectorHome = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const collectorId = useAppSelector((state) => state.user.user?.id ?? "");
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");
  const user = useAppSelector((state) => state.user.user);

  const BOTTOM_BAR_HEIGHT = 56;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<CollectorPayment[]>([]);
  const [tab, setTab] = useState<CollectorHomeTab>("to_collect");
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);

  const userOrchestrator = useMemo(
    () => new UserOrchestrator(dispatch),
    [dispatch]
  );

  /* =======================
     CARGAR DESEMBOLSOS
     ======================= */
  useEffect(() => {
    if (
      tab !== "to_pay" ||
      !collectorId ||
      !companyId ||
      paymentsLoaded
    ) {
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const payOrchestrator = new PayCollectorOrhectrator();

        const result = await payOrchestrator.getPayCollectors({
          collectorId,
          companyId,
        });

        if (result.ok) {
          setPayments(result.value.state);
        }
      } catch (error) {
        console.error("Error cargando desembolsos", error);
      } finally {
        setPaymentsLoaded(true);
        setLoading(false);
      }
    };

    fetchPayments();
  }, [tab, collectorId, companyId, paymentsLoaded]);

  /* =======================
     CARGAR CUOTAS
     ======================= */
  useEffect(() => {
    if (!collectorId || !companyId) return;

    const fetchInstallments = async () => {
      try {
        setLoading(true);
        const orchestrator = new InstallmentsOrchestrator();

        const result = await orchestrator.getByCollector({
          companyId,
          collectorId,
        });

        if (result.ok) {
          console.log(items)
          setItems(result.value.state);
        }
      } catch (error) {
        console.error("Error cargando cuotas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstallments();
  }, [collectorId, companyId]);

  /* =======================
     DERIVADOS
     ======================= */
  const { pending, overdue, paid } = useMemo(() => {

    for(const i of items){
      if(i.status==="incompleto"){
      console.log(i)
      }

    }

    return {
      pending: items.filter(
        (i) => (i.status === "pendiente" || i.status === "incompleto") && IsFutureOrToday(i.dueDate)
      ),
      overdue: items.filter(
        (i) => (i.status === "pendiente" ||  i.status === "incompleto") && IsPastDate(i.dueDate)
      ),
      paid: items.filter((i) => i.status === "pagada"),
    };
  }, [items]);

  const allCustomers = useMemo(() => {
    const seen = new Set<string>();

    return items.reduce<{ id: string; name: string }[]>((acc, i) => {
      if (!seen.has(i.costumerId)) {
        seen.add(i.costumerId);
        acc.push({
          id: i.costumerId,
          name: i.costumerName,
        });
      }
      return acc;
    }, []);
  }, [items]);

  /* =======================
     HANDLERS
     ======================= */
  const goToInstallmentDetails = (installment: Installment) => {
    navigate(ScreenPaths.collector.installment(installment.id));
  };

  const handleAddRoute = async (name: string) => {
    if (!collectorId || !companyId) return;
    setLoading(true);
    await userOrchestrator.addRoute({
      userId: collectorId,
      companyId,
      routeName: name,
    });
    setLoading(false);
  };

  const handleDeleteRoute = async (name: string) => {
    if (!collectorId || !companyId) return;
    setLoading(true);
    await userOrchestrator.deleteRoute({
      userId: collectorId,
      companyId,
      routeName: name,
    });
    setLoading(false);
  };

  const handleAssignCustomer = async (
    customerId: string,
    routeName: string
  ) => {
    if (!collectorId || !companyId) return;
    setLoading(true);
    await userOrchestrator.assignCustomerToRoute({
      userId: collectorId,
      companyId,
      routeName,
      customerId,
    });
    setLoading(false);
  };

  const handleUnassignCustomer = async (
    customerId: string,
    routeName: string
  ) => {
    if (!collectorId || !companyId) return;
    setLoading(true);

    const result = await userOrchestrator.unassignCustomerFromRoute({
      userId: collectorId,
      companyId,
      routeName,
      customerId,
    });

    if (!result.ok) {
      console.error("Error unassigning customer:", result.error);
    }

    setLoading(false);
  };

  /* =======================
     RENDER
     ======================= */
  if (loading) {
    return <Typography>Cargando cuotas...</Typography>;
  }

  return (
    <Box height="100dvh" display="flex" flexDirection="column">
      {/* BODY */}
      <Box
        flex={1}
        p={2}
        overflow="auto"
        pb={`${BOTTOM_BAR_HEIGHT + 8}px`}
      >
        <Typography variant="h5" mb={2}>
          Mis cuotas asignadas
        </Typography>

        {tab === "to_collect" && (
          <ToCollectBody
            pending={pending}
            overdue={overdue}
            onClick={goToInstallmentDetails}
            collectorRoutes={user?.collectorRoutes ?? {}}
            onOpenRouteManagement={() => setIsRouteDialogOpen(true)}
          />
        )}

        {tab === "collected" && (
          <CollectedBody paid={paid} onClick={goToInstallmentDetails} />
        )}

        {tab === "to_pay" && <ToDisburseBody payments={payments} />}
      </Box>

      {/* FOOTER */}
      <Box position="fixed" bottom={0} left={0} right={0} zIndex={1300}>
        <CollectorBottomBar value={tab} onChange={setTab} />
      </Box>

      {/* DIALOG GESTIÓN DE RUTAS */}
      {isRouteDialogOpen && (
        <RouteManagementDialog
          open={isRouteDialogOpen}
          onClose={() => setIsRouteDialogOpen(false)}
          routes={user?.collectorRoutes ?? {}}
          allCustomers={allCustomers}
          onAddRoute={handleAddRoute}
          onDeleteRoute={handleDeleteRoute}
          onAssignCustomer={handleAssignCustomer}
          onUnassignCustomer={handleUnassignCustomer}
        />
      )}
    </Box>
  );
};
