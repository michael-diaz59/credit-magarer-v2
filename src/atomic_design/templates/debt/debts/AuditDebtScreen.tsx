import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  LinearProgress,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { createEmptyDebt, type Debt, type DebtStatus } from "../../../../features/debits/domain/business/entities/Debt";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { LoadingOverlay } from "../../../molecules/LoadingOverlay";
import { BaseDialog } from "../../../atoms/BaseDialog";
import { RenewalComparisonForm } from "../RenewalComparisonForm";
import { DebtForm, mergeDebtWithForm, mapDebtToForm, type DebtFormRef, type DebtFormValues } from "../debtForm";
import { DebtFormDataProvider } from "./DebtFormDataProvider";
import { SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS, type DebtSubmitType } from "../form/constsForm";
import { createEmptySimulateDebtOutput, type SimulateDebtOutput } from "../../../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { SimulateDebtResultCard } from "../../../molecules/SimulateDebtResultCard";
import { auditDebtConfig } from "../../../sub_atomic_particles/debFormConsts";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import { selectActionAuditor } from "../../audit/helpers/selecActionAuditor";
import { MoneyTypography } from "../../../atoms/MoneyTypography";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { UpdateDebtSimpleError } from "../../../../features/debits/domain/business/useCases/debt/UpdateSimpleDebtCase";
import type { Installment } from "../../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import { calculateDebtArrearsSummary } from "../../../../features/debits/domain/business/services/calculateInstallmentArrears";
import FormatNumberToMoney from "../../../sub_atomic_particles/FormatNumberToMoney";
import type { Route } from "../../../../features/routes/domain/business/entities/Route";
import { RouteOrchestrator } from "../../../../features/routes/domain/infraestructure/RouteOrchestrator";

const statusColorMap: Record<
  DebtStatus,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  tentativa: "default",
  preAprobada: "info",
  preparacion: "warning",
  activa: "primary",
  corregir: "warning",
  pagada: "success",
  negociada: "secondary",
  en_mora: "error",
  inactivo: "default",
  anulado: "default",
};

export const AuditDebtScreen = () => {
  const debtFormRef = useRef<DebtFormRef>(null);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(true);
  const [form, setForm] = useState<Debt | null>(null);
  const [originalDebt, setOriginalDebt] = useState<Debt | null>(null);

  const actions = useMemo(() => {
    if (!debt) return [];
    return selectActionAuditor(debt.status);
  }, [debt]);

  const user = useAppSelector((state) => state.user.user);
  const isAdmin: boolean = user?.roles.includes("ADMIN") || false;
  const companyId = user?.companyId || "undefined";
  const { debitId } = useParams<{ debitId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title?: string;
    body: string;
    buttonText?: string;
  }>({
    body: "",
  });

  const [simulateDebtValues, setSimulateDebtValues] = useState<SimulateDebtOutput>(createEmptySimulateDebtOutput());

  const loadDebt = async () => {
    if (!debitId) return;

    try {
      const orchestrator = new DebtOrchestrator();
      const installmentOrchestrator = new InstallmentsOrchestrator();
      const routeOrchestrator = new RouteOrchestrator();

      const [debtResult, instResult, routesResult] = await Promise.all([
        orchestrator.getDebitById({
          idDebt: debitId,
          companyId: companyId,
        }),
        installmentOrchestrator.getByDebt({
          debtId: debitId,
          companyId,
        }),
        routeOrchestrator.getRoutes({
          companyId,
        }),
      ]);

      if (routesResult.ok) {
        setRoutes(routesResult.value);
      }
      setLoadingRoutes(false);

      if (instResult.state.ok) {
        setInstallments(instResult.state.value);
      }

      if (debtResult.state.ok && debtResult.state.value) {
        const currentDebt = debtResult.state.value;
        console.log("currentDebt:", currentDebt);
        setDebt(currentDebt);
        setForm(currentDebt);

        if (currentDebt.status === "preAprobada" && currentDebt.originalDebt) {
          const originalResult = await orchestrator.getDebitById({
            idDebt: currentDebt.originalDebt,
            companyId: companyId,
          });

          if (originalResult.state.ok && originalResult.state.value) {
            setOriginalDebt(originalResult.state.value);
          } else {
            setDialogConfig({
              title: "Error al cargar la deuda",
              body: "Ocurrió un error inesperado al cargar la deuda original, por favor recarga la pagina",
              buttonText: "Cerrar",
            });
          }
        }
      } else {
        setDialogConfig({
          title: "Error al cargar la deuda",
          body: "Ocurrió un error inesperado al cargar la deuda.",
          buttonText: "Cerrar",
        });
      }
    } catch (error) {
      console.error("Error loading debt details", error);
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    loadDebt();
  }, [debitId, companyId]);

  const routeName = useMemo(() => {
    if (!debt?.routeId) return "Sin ruta asignada";
    if (loadingRoutes) return "Consultando ruta...";
    const foundRoute = routes.find((r) => r.id === debt.routeId);
    return foundRoute ? foundRoute.name : "Ruta no encontrada";
  }, [routes, debt?.routeId, loadingRoutes]);

  // Cálculo de mora dinámica y consolidados
  const arrearsSummary = useMemo(() => {
    return calculateDebtArrearsSummary(installments, debt);
  }, [installments, debt]);

  // Métricas financieras y de auditoría
  const auditFinancials = useMemo(() => {
    if (!debt) return null;

    const totalInstallments = installments.length > 0 ? installments.length : (debt.installmentCount ?? 0);
    const paidInstallments = installments.filter(
      (i) => i.status === "pagada" || (i.outstandingReceivables !== undefined && i.outstandingReceivables <= 0)
    ).length;
    const overdueInstallments = arrearsSummary.overdueInstallmentsCount;
    const pendingInstallments = Math.max(0, totalInstallments - paidInstallments);

    const totalRealPaid =
      debt.totalPaid && debt.totalPaid > 0
        ? debt.totalPaid
        : installments.reduce(
            (acc, curr) => acc + (curr.totalPaid ?? curr.amountPaid ?? 0),
            0
          );

    const baseAmountPaid =
      debt.amountPaid && debt.amountPaid > 0
        ? debt.amountPaid
        : installments.reduce((acc, curr) => acc + (curr.amountPaid ?? 0), 0);

    const capitalPaid =
      debt.capitalPaid && debt.capitalPaid > 0
        ? debt.capitalPaid
        : installments.reduce((acc, curr) => acc + (curr.capitalPaid ?? 0), 0);

    const interestPaid =
      debt.interestPaid && debt.interestPaid > 0
        ? debt.interestPaid
        : installments.reduce((acc, curr) => acc + (curr.interestPaid ?? 0), 0);

    const arrearsPaid =
      debt.arrearsPaid && debt.arrearsPaid > 0
        ? debt.arrearsPaid
        : installments.reduce((acc, curr) => acc + (curr.arrearsPaid ?? 0), 0);

    const defermentPaid =
      debt.defermentPaid && debt.defermentPaid > 0
        ? debt.defermentPaid
        : installments.reduce((acc, curr) => acc + (curr.defermentPaid ?? 0), 0);

    const delayArrearsPending = arrearsSummary.totalDelayArrears;
    const defermentPending = arrearsSummary.totalDefermentArrears;
    const totalArrearsPending = arrearsSummary.totalArrears;

    const baseAmountRemaining = installments.reduce((acc, curr) => {
      if (curr.status === "pagada" || (curr.outstandingReceivables !== undefined && curr.outstandingReceivables <= 0)) {
        return acc;
      }
      return acc + Math.max(0, (curr.amount ?? 0) - (curr.amountPaid ?? 0));
    }, 0);

    const capitalRemaining =
      debt.remainingCapitalToPay && debt.remainingCapitalToPay > 0
        ? debt.remainingCapitalToPay
        : Math.max(0, (debt.capital ?? 0) - capitalPaid);

    const interestRemaining =
      debt.remainingInterestToPay && debt.remainingInterestToPay > 0
        ? debt.remainingInterestToPay
        : Math.max(0, (debt.interest ?? 0) - interestPaid);

    const contractBaseAmount = debt.amount ?? (debt.capital + debt.interest);
    const totalDebtReal = contractBaseAmount + arrearsPaid + delayArrearsPending + defermentPaid + defermentPending;

    const totalRemainingReal =
      baseAmountRemaining > 0 || totalArrearsPending > 0
        ? baseAmountRemaining + totalArrearsPending
        : Math.max(0, debt.remainingTotalToPay ?? (totalDebtReal - totalRealPaid));

    const pctTotal = totalDebtReal > 0 ? Math.min(100, Math.round((totalRealPaid / totalDebtReal) * 100)) : 0;
    const pctCapital = (debt.capital ?? 0) > 0 ? Math.min(100, Math.round((capitalPaid / debt.capital) * 100)) : 0;
    const pctInterest = (debt.interest ?? 0) > 0 ? Math.min(100, Math.round((interestPaid / debt.interest) * 100)) : 0;
    const pctBase = contractBaseAmount > 0 ? Math.min(100, Math.round((baseAmountPaid / contractBaseAmount) * 100)) : 0;

    return {
      totalInstallments,
      paidInstallments,
      overdueInstallments,
      pendingInstallments,

      contractBaseAmount,
      totalDebtReal,

      totalRealPaid,
      baseAmountPaid,
      capitalPaid,
      interestPaid,
      arrearsPaid,
      defermentPaid,

      delayArrearsPending,
      defermentPending,
      totalArrearsPending,

      baseAmountRemaining,
      capitalRemaining,
      interestRemaining,
      totalRemainingReal,

      pctTotal,
      pctCapital,
      pctInterest,
      pctBase,
    };
  }, [debt, installments, arrearsSummary]);

  const handleSubmitDebt = async (submitType: DebtSubmitType) => {
    setSimulateDebtValues(createEmptySimulateDebtOutput());
    let isValid: boolean = false;
    const formValues: DebtFormValues | undefined = debtFormRef.current?.getValues();
    if (!formValues) return;

    if (!debtFormRef.current) {
      return;
    }
    if (submitType === "crear") {
      isValid = await debtFormRef.current?.validate();
    } else {
      const fieldsToValidate: (keyof DebtFormValues)[] = formValues.calculationMode === "months"
        ? SIMULATION_FIELDS_INSTALLMENTS
        : SIMULATION_FIELDS_MONTHS;
      isValid = await debtFormRef.current?.validateFields(fieldsToValidate);
    }
    if (!isValid) return;

    const updatedDebt: Debt = mergeDebtWithForm(createEmptyDebt(), formValues);

    const months =
      formValues?.calculationMode === "months" ? formValues.months : undefined;

    switch (submitType) {
      case "actualizar": {
        await handleUpdateDebt();
        break;
      }
      case "simular": {
        await handleSimulateDebt(updatedDebt, months);
        break;
      }
      default: {
        break;
      }
    }
  };

  const handleChangeStatus = async (nextStatus: DebtStatus): Promise<void> => {
    if (!debt) return;
    const orchestrator = new DebtOrchestrator();

    const updatedDebt = debt;
    const input = {
      companyId: companyId,
      debt: updatedDebt,
      isNewRoute: false,
    };

    let resultState: Result<null, UpdateDebtSimpleError>;

    try {
      switch (nextStatus) {
        case "preAprobada": {
          const res = await orchestrator.goToPreAbroves({ debtId: debt.id, companyId: companyId });
          if (res.state.ok) {
            resultState = ok(null);
          } else {
            resultState = fail({ code: "UNKNOWN_ERROR" });
          }
          break;
        }
        case "preparacion": {
          const res = await orchestrator.goToPreparation(input);
          resultState = res.state;
          break;
        }
        case "activa": {
          const res = await orchestrator.goToActivate({
            debt: updatedDebt,
            companyId: companyId,
            reactive: true,
          });
          if (res.ok) {
            resultState = ok(null);
          } else {
            resultState = fail({ code: "UNKNOWN_ERROR" });
          }
          break;
        }
        case "inactivo": {
          const res = await orchestrator.goToDeactivate(input);
          resultState = res.state;
          break;
        }
        case "anulado": {
          const res = await orchestrator.goToAnnular(input);
          resultState = res.state;
          break;
        }
        case "pagada": {
          const res = await orchestrator.markAsPaid({
            companyId: companyId,
            debtId: debt.id,
            auditorNotes: "",
          });

          if (res.ok) {
            resultState = ok(null);
          } else {
            resultState = fail({ code: "UNKNOWN_ERROR" });
          }
          break;
        }
        default: {
          const res = await orchestrator.updateDebtStatus({
            companyId: companyId,
            idDebt: debt.id,
            debtStatus: nextStatus,
          });
          if (res.ok) {
            resultState = ok(null);
          } else {
            resultState = fail({ code: "UNKNOWN_ERROR" });
          }
          break;
        }
      }

      setDialogOpen(true);
      if (resultState.ok) {
        setDebt((prev) => ({
          ...(prev ?? createEmptyDebt()),
          status: nextStatus,
        }));

        setForm({
          ...debt,
          status: nextStatus,
        });

        setDialogConfig({
          title: "Actualización exitosa",
          body: "La deuda fue actualizada correctamente.",
          buttonText: "Entendido",
        });
        loadDebt();
      } else {
        setDialogConfig({
          title: "Error al actualizar",
          body: resultState.error.code ?? "Ocurrió un error inesperado al actualizar la deuda.",
          buttonText: "Cerrar",
        });
      }
    } catch {
      setDialogOpen(true);
      setDialogConfig({
        title: "Error al actualizar",
        body: "Ocurrió un error inesperado al actualizar la deuda.",
        buttonText: "Cerrar",
      });
    }
  };

  const handleSimulateDebt = async (data: Debt, months?: number) => {
    const orchestrator = new DebtOrchestrator();

    const result = await orchestrator.simulateDebt({
      debt: data,
      months: months,
    });

    if (result.ok) {
      setSimulateDebtValues(result.value);
    } else {
      setDialogOpen(true);
      setDialogConfig({
        title: "Error al simular la deuda",
        body: "Ocurrió un error al simular la deuda.",
        buttonText: "Entendido",
      });
    }
  };

  const handleUpdateDebt = async (updatedData?: Debt) => {
    if (!debt?.id) return;

    setLoading(true);

    let debtToUpdate: Debt;
    let isNewRoute = false;

    if (updatedData) {
      debtToUpdate = updatedData;
    } else {
      if (!debtFormRef.current) {
        setLoading(false);
        return;
      }
      isNewRoute = debt.routeId === debtFormRef.current?.getValues().routeId;
      debtToUpdate = mergeDebtWithForm(debt, debtFormRef.current?.getValues());
    }

    try {
      const orchestrator = new DebtOrchestrator();
      debtToUpdate.id = debt.id;

      const update = await orchestrator.updateDebtUse({
        isNewRoute: isNewRoute,
        companyId: companyId,
        debt: debtToUpdate,
      });

      if (update.state.ok) {
        setDialogConfig({
          title: "Actualización exitosa",
          body: "La deuda fue actualizada correctamente.",
          buttonText: "Entendido",
        });
        loadDebt();
      } else {
        setDialogConfig({
          title: "Error al actualizar",
          body: update.state.error.code ?? "Ocurrió un error inesperado al actualizar la deuda.",
          buttonText: "Cerrar",
        });
      }
    } catch {
      setDialogConfig({
        title: "Error",
        body: "No fue posible completar la operación. Intenta nuevamente.",
        buttonText: "Cerrar",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setDialogOpen(true);
      }, 200);
    }
  };

  if (!form) return null;

  return (
    <Box p={3} width="100%">
      <LoadingOverlay open={loading} />
      <BaseDialog
        open={dialogOpen}
        title={dialogConfig.title}
        body={dialogConfig.body}
        butonText={dialogConfig.buttonText}
        onClick={() => setDialogOpen(false)}
      />

      {/* 1. Encabezado de Auditoría del Crédito */}
      <Card variant="outlined" sx={{ mb: 3, p: 2.5, bgcolor: "background.paper" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700}>
                {debt?.name || "Crédito"}
              </Typography>
              {debt && (
                <Chip
                  label={debt.status}
                  color={statusColorMap[debt.status] || "default"}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: "capitalize" }}
                />
              )}
              {auditFinancials && auditFinancials.overdueInstallments > 0 && (
                <Chip
                  label={`${auditFinancials.overdueInstallments} cuota(s) en mora`}
                  color="error"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Cliente: <strong>{debt?.clientName}</strong> (C.C. {debt?.clientDocument}) • Ruta: <strong>{routeName}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Término: <strong>{debt?.debtTerms}</strong> • Tasa Ord: <strong>{debt?.interestRate}%</strong> • Tasa Mora: <strong>{debt?.lateInterestRate || debt?.interestRate}%</strong> • Modalidad: <strong>{debt?.type}</strong>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(ScreenPaths.auditor.installments(debt?.id ?? ""))}
            >
              Ver {installments.length > 0 ? `${installments.length} Cuotas` : "Cuotas"}
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* 2. Métricas y KPIs de Auditoría Financiera */}
      {auditFinancials && debt && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "1fr 1fr 1fr 1fr",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Tarjeta 1: Estructura Financiera Base */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
              Estructura Financiera
            </Typography>
            <Box mt={1}>
              <MoneyTypography label="Capital Prestado:" value={debt.capital} />
              <MoneyTypography label="Interés Ordinario:" value={debt.interest} />
              {debt.processingFee > 0 && (
                <MoneyTypography label="Gastos Papelería:" value={debt.processingFee} />
              )}
              <Divider sx={{ my: 1 }} />
              <MoneyTypography label="Monto Base Pactado:" value={auditFinancials.contractBaseAmount} strong />
              <MoneyTypography label="Total con Moras Acum:" value={auditFinancials.totalDebtReal} sx={{ color: "text.secondary", fontSize: "0.85rem" }} />
            </Box>
          </Card>

          {/* Tarjeta 2: Recaudos y Saldos Reales */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
              Recaudos y Saldos Reales
            </Typography>
            <Box mt={1}>
              <MoneyTypography label="Total Recaudado:" value={auditFinancials.totalRealPaid} sx={{ color: "success.main" }} strong />
              <Typography variant="caption" color="text.secondary" display="block">
                • Capital: ${FormatNumberToMoney(auditFinancials.capitalPaid)} | Interés: ${FormatNumberToMoney(auditFinancials.interestPaid)}
              </Typography>
              {(auditFinancials.arrearsPaid > 0 || auditFinancials.defermentPaid > 0) && (
                <Typography variant="caption" color="text.secondary" display="block">
                  • Moras pagadas: ${FormatNumberToMoney(auditFinancials.arrearsPaid + auditFinancials.defermentPaid)}
                </Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <MoneyTypography label="Saldo Restante a Cobrar:" value={auditFinancials.totalRemainingReal} sx={{ color: "error.main" }} strong />
              <Typography variant="caption" color="text.secondary" display="block">
                • Capital rest: ${FormatNumberToMoney(auditFinancials.capitalRemaining)} | Interés rest: ${FormatNumberToMoney(auditFinancials.interestRemaining)}
              </Typography>
            </Box>
          </Card>

          {/* Tarjeta 3: Auditoría de Mora y Aplazamientos */}
          <Card
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: auditFinancials.totalArrearsPending > 0 ? "rgba(211, 47, 47, 0.03)" : "background.paper",
              borderColor: auditFinancials.totalArrearsPending > 0 ? "error.light" : "divider",
            }}
          >
            <Typography variant="caption" color={auditFinancials.totalArrearsPending > 0 ? "error.main" : "text.secondary"} fontWeight={700} textTransform="uppercase">
              Auditoría de Mora
            </Typography>
            <Box mt={1}>
              <MoneyTypography
                label="Mora por Retraso (Arrears):"
                value={auditFinancials.delayArrearsPending}
                sx={{ color: auditFinancials.delayArrearsPending > 0 ? "error.main" : "text.primary" }}
              />
              <MoneyTypography
                label="Mora Aplazamiento (Deferment):"
                value={auditFinancials.defermentPending}
                sx={{ color: auditFinancials.defermentPending > 0 ? "warning.main" : "text.primary" }}
              />
              <Divider sx={{ my: 1 }} />
              <MoneyTypography
                label="Total Mora Pendiente:"
                value={auditFinancials.totalArrearsPending}
                sx={{ color: auditFinancials.totalArrearsPending > 0 ? "error.main" : "text.primary" }}
                strong
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Cuotas Vencidas: <strong>{auditFinancials.overdueInstallments}</strong> de {auditFinancials.totalInstallments}
              </Typography>
            </Box>
          </Card>

          {/* Tarjeta 4: Porcentajes de Pago Reales */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
              Porcentajes de Pago Reales
            </Typography>
            <Box mt={1} sx={{ "& > *:not(:last-child)": { mb: 1.2 } }}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.3}>
                  <Typography variant="caption" fontWeight={600}>Total Pagado</Typography>
                  <Typography variant="caption" fontWeight={700}>{auditFinancials.pctTotal}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={auditFinancials.pctTotal} color="primary" sx={{ height: 6, borderRadius: 3 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.3}>
                  <Typography variant="caption" color="text.secondary">Capital Amortizado</Typography>
                  <Typography variant="caption" fontWeight={600}>{auditFinancials.pctCapital}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={auditFinancials.pctCapital} color="success" sx={{ height: 5, borderRadius: 3 }} />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.3}>
                  <Typography variant="caption" color="text.secondary">Intereses Cubiertos</Typography>
                  <Typography variant="caption" fontWeight={600}>{auditFinancials.pctInterest}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={auditFinancials.pctInterest} color="info" sx={{ height: 5, borderRadius: 3 }} />
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Cuotas Pagadas: <strong>{auditFinancials.paidInstallments}</strong>/{auditFinancials.totalInstallments}
                </Typography>
                <Chip
                  label={`${Math.round((auditFinancials.paidInstallments / (auditFinancials.totalInstallments || 1)) * 100)}%`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                />
              </Stack>
            </Box>
          </Card>
        </Box>
      )}

      {/* 3. Formulario de Edición y Acciones del Auditor */}
      <Box position="relative">
        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              {originalDebt ? "Aprobar Renovación de Deuda" : "Configuración y Detalle del Crédito"}
            </Typography>

            {originalDebt && debitId && form.status === "preAprobada" ? (
              <RenewalComparisonForm
                originalDebt={originalDebt}
                proposedDebt={form}
                mode="audit"
                onSubmit={handleUpdateDebt}
              />
            ) : (
              <DebtFormDataProvider getRoutes={true}>
                {({ routes, loading: loadingRoutes }) => {
                  if (loadingRoutes) return <div>Cargando formulario...</div>;

                  return (
                    <>
                      <DebtForm
                        ref={debtFormRef}
                        routes={routes}
                        debValues={mapDebtToForm(form)}
                        config={auditDebtConfig(isAdmin)}
                      />

                      <Divider sx={{ my: 2 }} />

                      <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                        <Button
                          variant="outlined"
                          onClick={() => handleSubmitDebt("simular")}
                        >
                          Simular Deuda
                        </Button>
                        {actions.map((action) => (
                          <Button
                            key={action.nextStatus}
                            variant="contained"
                            color={action.color}
                            onClick={() => handleChangeStatus(action.nextStatus)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Stack>
                    </>
                  );
                }}
              </DebtFormDataProvider>
            )}

            {simulateDebtValues.capital > 0 && (
              <Box mt={3}>
                <SimulateDebtResultCard data={simulateDebtValues} />
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
              <Button onClick={() => navigate(-1)} disabled={loading}>
                Volver
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
