import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import type { Installment } from "../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { useNavigate } from "react-router";
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
import type { CollectorPayment } from "../../../features/collector/domain/business/entities/CollectorPayment";
import PayCollectorOrhectrator from "../../../features/collector/domain/infraestructure/PayCollectorOrhectrator";


/**indica si una fecha es menor a la actual */
export function IsPastDate(dateStr: string): boolean {
  const inputDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate < today;
}

/**indica si la fecha es igual o menos a la actual */
export function IsfutureOrToday(dateStr: string): boolean {
  const todayStr = new Date().toISOString().slice(0, 10);
  return dateStr  >= todayStr;
}
export const RecolectorHome = () => {
  const collectorId = useAppSelector((state) => state.user.user?.id ?? "");
  const BOTTOM_BAR_HEIGHT = 56;
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<CollectorPayment[]>([]);
  const [tab, setTab] = useState<CollectorHomeTab>("to_collect");
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const [paymentsLoadedRef,setPaimentLoad] = useState(true);

  useEffect(() => {
    if (
      tab !== "to_pay" ||
      !collectorId ||
      !companyId ||
      paymentsLoadedRef
    ){return;}


      console.log("se va a consultar desembolsos")
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const payOrchestrator = new PayCollectorOrhectrator();

        const result = await payOrchestrator.getPayCollectors({
          collectorId: collectorId,
          companyId: companyId,
        });
        if (result.ok) {
          setPayments(result.value.state);
        }
      } catch (error) {
        console.error("Error cargando desembolsos", error);
      } finally {
        setPaimentLoad(false)
        setLoading(false);
      }
    };

    fetchPayments();
  }, [tab, collectorId, companyId, dispatch]);

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

  const goToInstallmentDetails = (installment: Installment) => {
    navigate(ScreenPaths.collector.installment(installment.id));
  };

  const { pending, overdue, paid } = useMemo(() => {
    return {
      pending: items.filter((i) => i.status === "pendiente" && IsfutureOrToday(i.dueDate)),
      overdue: items.filter((i) => i.status === "pendiente" && IsPastDate(i.dueDate)),
      paid: items.filter((i) => i.status === "pagada"),
    };
  }, [items]);

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
        pb={`${BOTTOM_BAR_HEIGHT + 8}px`} // espacio para el footer
      >
        <Typography variant="h5" mb={2}>
          Mis cuotas asignadas
        </Typography>

        {tab === "to_collect" && (
          <ToCollectBody
            pending={pending}
            overdue={overdue}
            onClick={goToInstallmentDetails}
          />
        )}

        {tab === "collected" && (
          <CollectedBody paid={paid} onClick={goToInstallmentDetails} />
        )}

        {tab === "to_pay" && <ToDisburseBody payments={payments} />}
      </Box>

      {/* FOOTER FIJO */}
      <Box position="fixed" bottom={0} left={0} right={0} zIndex={1300}>
        <CollectorBottomBar value={tab} onChange={setTab} />
      </Box>
    </Box>
  );
};
