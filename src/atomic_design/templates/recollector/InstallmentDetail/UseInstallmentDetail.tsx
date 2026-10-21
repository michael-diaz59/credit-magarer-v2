import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import { Box, Typography } from "@mui/material";

import type { Installment } from "../../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import PaymentOrchestrator from "../../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import type {
    Payment,
    PaymentMethod,
} from "../../../../features/debits/domain/business/entities/Payment";
import { getCurrentLocation } from "../../../../core/shared/helpers/geoLocation";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import type { LocationGPS } from "../../../../features/costumers/domain/business/entities/Address";
import { CollectionAttemptOrchestrator } from "../../../../features/debits/domain/infraestructure/CollectionAttemptOrchestrator";
import { ScreenPaths } from "../../../../core/helpers/name_routes";
import type { BalancesDueFromInstallmentOutput } from "../../../../features/debits/domain/business/useCases/installment/BalancesDueFromInstallmentCase";
import type { MaxDueFromInstallmentOutput } from "../../../../features/debits/domain/business/useCases/installment/MaxDueFromInstallmentCase";
import type { GetDebtPaymentCapacityOutput } from "../../../../features/debits/domain/business/useCases/installment/GetDebtPaymentCapacityCase";
import type { RegisterCashPaymentError } from "../../../../features/debits/domain/business/useCases/payment/RegisterCashPaymentUseCase";
import type { RegisterConsignmentPaymentError } from "../../../../features/debits/domain/business/useCases/payment/RegisterConsignmentPaymentUseCase";
import type { RegisterCascadingPaymentError } from "../../../../features/debits/domain/business/useCases/payment/RegisterCascadingPaymentUseCase";
import {
    getLocalDate,
} from "../../../../core/helpers/dates/calculateDays";
import { calculateInstallmentArrears } from "../../../../features/debits/domain/business/services/calculateInstallmentArrears";

export interface PartialPaymentForm {
    amount: number;
    arrears: number;
}

interface PendingPayment {
    type: "full" | "partial";
    amount?: number;
    arrears?: number;
    method?: PaymentMethod;
    file?: File | null;
}

interface UseInstallmentDetailParams {
    installmentId?: string;
    companyId: string;
    collectorId: string;
}

export const UseInstallmentDetail = ({
    installmentId,
    companyId,
    collectorId,
}: UseInstallmentDetailParams) => {
    const navigate = useNavigate();

    const user = useAppSelector((state) => state.user.user);

    const [debt, setDebt] = useState<Debt | null>(null);
    const [installmentsOfDebt, setInstallmentsOfDebt] = useState<Installment[]>([]);
    const [installment, setInstallment] = useState<Installment | null>(null);

    const [loading, setLoading] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogBody, setDialogBody] = useState<ReactNode>("");
    const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined);

    const [attemptDialogOpen, setAttemptDialogOpen] = useState(false);
    const [attemptDescription, setAttemptDescription] = useState("");
    const [attemptLoading, setAttemptLoading] = useState(false);

    const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] =
        useState(false);

    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [pendingPayment, setPendingPayment] =
        useState<PendingPayment | null>(null);

    const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] =
        useState<PaymentMethod>("efectivo");
    const [proofFile, setProofFile] = useState<File | null>(null);

    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
    const [balancesDueFromInstallment, setBalancesDueFromInstallment] = useState<BalancesDueFromInstallmentOutput>({
        sumAmount: 0,
        sumDeferment: 0,
        sumArrears: 0,
    });

    const [maxDueFromInstallment, setMaxDueFromInstallment] = useState<MaxDueFromInstallmentOutput>({
        maxArrears: 0,
        maxOutstandingAmount: 0,
    });

    const [debtPaymentCapacity, setDebtPaymentCapacity] = useState<GetDebtPaymentCapacityOutput | null>(null);

    const bankAccountOrchestrator = useMemo(
        () => new BankAccountOrchestrator(),
        [],
    );

    const paymentOrchestrator = useMemo(
        () => new PaymentOrchestrator(),
        [],
    );

    const installmentsOrchestrator = useMemo(
        () => new InstallmentsOrchestrator(),
        [],
    );

    useEffect(() => {
        const loadDebtPaymentCapacity = async () => {
            if (!companyId || !debt?.id) return;

            const result = await installmentsOrchestrator.getDebtPaymentCapacity({
                companyId,
                debtId: debt.id,
                todayDateStr: getLocalDate(new Date()),
            });

            if (result.ok) {
                setDebtPaymentCapacity(result.value);
            }
        };

        loadDebtPaymentCapacity();
    }, [companyId, debt?.id, installmentsOfDebt, installmentsOrchestrator]);

    useEffect(() => {
        const loadBalancesDueFromInstallment = async () => {

            if (!installmentId || !companyId || !debt) return;

            console.log("debt", debt.id);

            const result = await installmentsOrchestrator.balancesDueFromDebt({ companyId, debtId: debt.id });

            if (result.ok) {
                console.log("balancesDueFromInstallment", result.value);
                setBalancesDueFromInstallment(result.value);

            }
        };

        loadBalancesDueFromInstallment();
    }, [installmentId, companyId, debt]);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<PartialPaymentForm>({
        defaultValues: {
            amount: 0,
            arrears: 0,
        },
    });

    useEffect(() => {
        const loadBankAccounts = async () => {
            if (!companyId) return;

            const result = await bankAccountOrchestrator.getAll({ companyId });

            if (result.ok) {
                setBankAccounts(result.value.bankAccounts);
            }
        };

        loadBankAccounts();
    }, [companyId, bankAccountOrchestrator]);

    useEffect(() => {
        const loadMaxDueFromInstallment = async () => {
            if (!installmentId || !companyId) return;

            const result = await installmentsOrchestrator.maxDueFromInstallment({ companyId, installmentId });

            if (result.ok) {
                setMaxDueFromInstallment(result.value);
            }
        };

        loadMaxDueFromInstallment();
    }, [installmentId, companyId, installmentsOrchestrator]);

    useEffect(() => {
        if (!installmentId || !companyId) return;

        const fetchInstallment = async () => {
            try {
                setLoading(true);

                const result = await installmentsOrchestrator.getById({
                    companyId,
                    installmentId,
                });

                if (!result.ok) {
                    setInstallment(null);
                    return;
                }

                const currentInstallment: Installment = result.value.state;
                setInstallment(currentInstallment);

                const debtOrchestrator = new DebtOrchestrator();

                const debtResult = await debtOrchestrator.getDebitById({
                    idDebt: currentInstallment.debtId,
                    companyId,
                });

                if (debtResult.state.ok && debtResult.state.value) {
                    setDebt(debtResult.state.value);

                    const allInstResult = await installmentsOrchestrator.getByDebt({
                        companyId,
                        debtId: currentInstallment.debtId,
                    });

                    if (allInstResult.state.ok) {
                        setInstallmentsOfDebt(allInstResult.state.value);
                    }
                }
            } catch (error) {
                console.error("Error cargando cuota:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstallment();
    }, [installmentId, companyId, installmentsOrchestrator]);

    // 1. Separar cuotas de la deuda completa: vencidas antes de hoy, cuotas de hoy, cuotas futuras y pagadas
    const { overdueInstallments, dueTodayInstallments, futureInstallments, paidInstallments } = useMemo(() => {
        const todayStr = getLocalDate(new Date());

        const overdue: Installment[] = [];
        const dueToday: Installment[] = [];
        const future: Installment[] = [];
        const paid: Installment[] = [];

        for (const inst of installmentsOfDebt) {
            const isPaid =
                inst.status === "pagada" ||
                (inst.outstandingReceivables !== undefined && inst.outstandingReceivables <= 0);

            if (isPaid || !inst.isLife || (inst.outstandingReceivables ?? inst.amount ?? 0) <= 0) {
                paid.push(inst);
                continue;
            }

            const rawDate = inst.paymentDate || inst.dueDate;
            if (!rawDate) {
                dueToday.push(inst);
                continue;
            }

            const dateStr = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;

            if (dateStr < todayStr) {
                overdue.push(inst);
            } else if (dateStr === todayStr) {
                dueToday.push(inst);
            } else {
                future.push(inst);
            }
        }

        return {
            overdueInstallments: overdue,
            dueTodayInstallments: dueToday,
            futureInstallments: future,
            paidInstallments: paid,
        };
    }, [installmentsOfDebt]);

    // 2. Resumen financiero de lo exigible a día de hoy (ÚNICAMENTE cuotas vencidas y cuotas que vencen hoy)
    const creditFinancialSummary = useMemo(() => {
        let totalBaseAmount = 0;
        let totalDelayArrears = 0;
        let totalDefermentArrears = 0;

        // Solo se suman las cuotas exigibles a día de hoy (<= hoy)
        const dueUpToToday = [...overdueInstallments, ...dueTodayInstallments];

        for (const inst of dueUpToToday) {
            const base = inst.outstandingReceivablesAmount ?? inst.amount ?? 0;
            const arrearsInfo = calculateInstallmentArrears({ installment: inst, debt });

            totalBaseAmount += base;
            totalDelayArrears += arrearsInfo.pendingArrears;
            totalDefermentArrears += arrearsInfo.pendingDeferment;
        }

        const totalDueToday = totalBaseAmount + totalDelayArrears + totalDefermentArrears;

        return {
            totalBaseAmount,
            totalDelayArrears,
            totalDefermentArrears,
            totalDueToday,
            overdueCount: overdueInstallments.length,
            dueTodayCount: dueTodayInstallments.length,
            futureCount: futureInstallments.length,
            pendingCount: dueTodayInstallments.length,
            totalDueTodayCount: dueUpToToday.length,
            totalActiveCount: installmentsOfDebt.filter((i) => i.isLife && (i.outstandingReceivables ?? 0) > 0).length,
        };
    }, [overdueInstallments, dueTodayInstallments, futureInstallments, installmentsOfDebt, debt]);

    // 3. Simulación del valor real restante para liquidar/cancelar el crédito completo
    const liquidationSimulation = useMemo(() => {
        if (!debt) return null;

        const remainingCapital = debt.remainingCapitalToPay ?? 0;

        const getInstallmentPendingInterest = (inst: Installment): number => {
            if (typeof inst.remainingInterestToPay === "number" && inst.remainingInterestToPay > 0) {
                return inst.remainingInterestToPay;
            }
            const interest = inst.interest ?? 0;
            const paid = (inst.interestPaid ?? 0) + (inst.pendeningInterest ?? 0);
            return Math.max(0, interest - paid);
        };

        const overdueInterest = overdueInstallments.reduce(
            (sum, inst) => sum + getInstallmentPendingInterest(inst),
            0
        );

        // 1. Identificar cuotas que están en mora o se cobran hoy
        const dueUpToToday = [...overdueInstallments, ...dueTodayInstallments];

        // 2. Número máximo de cuota entre las exigibles a hoy
        const maxDueNumber =
            dueUpToToday.length > 0
                ? Math.max(...dueUpToToday.map((i) => i.installmentNumber ?? 0))
                : (debt.installmentsPaid ?? 0);

        const totalInstallmentsCount =
            debt.installmentCount ??
            (installmentsOfDebt[0]?.installmentTotalNumber ?? 0);

        // 3. ¿Quedan más cuotas a parte de las que están en mora o se cobran hoy?
        const hasRemainingInstallments =
            totalInstallmentsCount > 0
                ? maxDueNumber < totalInstallmentsCount
                : installmentsOfDebt.some((i) => (i.installmentNumber ?? 0) > maxDueNumber);

        const targetNextInstallmentNumber = hasRemainingInstallments ? maxDueNumber + 1 : null;

        // 4. Traer la cuota siguiente exacta en base al installmentNumber
        const nextInstallment = targetNextInstallmentNumber
            ? installmentsOfDebt.find(
                  (i) => i.installmentNumber === targetNextInstallmentNumber
              ) ?? null
            : null;

        // Si no quedan más cuotas: 0. Si quedan más cuotas: extraer exactamente inst.interest
        const nextInstallmentInterest =
            hasRemainingInstallments && nextInstallment
                ? (nextInstallment.interest ?? 0)
                : 0;

        const nextInstallmentNumber = hasRemainingInstallments
            ? (nextInstallment?.installmentNumber ?? targetNextInstallmentNumber)
            : null;

        const hasNextInstallment = hasRemainingInstallments && Boolean(nextInstallment);

        const remainingDeferment = Math.max(
            debt.remainingDefermentToPay ?? 0,
            creditFinancialSummary.totalDefermentArrears
        );

        const delayArrears = Math.max(
            debt.remainingArrearsToPay ?? 0,
            creditFinancialSummary.totalDelayArrears
        );

        const isFixed = (debt.type ?? "fijo") === "fijo";

        const basePayoff = isFixed
            ? remainingCapital + overdueInterest + nextInstallmentInterest + remainingDeferment
            : (debt.remainingAmountToPay ?? remainingCapital) + overdueInterest + nextInstallmentInterest + remainingDeferment;

        const totalPayoff = basePayoff + delayArrears;

        const maxAllowedArrears = delayArrears + remainingDeferment;
        const maxAllowedBase = remainingCapital + overdueInterest + nextInstallmentInterest;

        return {
            isFixed,
            remainingCapital,
            overdueInterest,
            nextInstallmentInterest,
            nextInstallmentNumber: hasNextInstallment ? nextInstallmentNumber : null,
            remainingDeferment,
            delayArrears,
            basePayoff,
            totalPayoff,
            maxAllowedBase,
            maxAllowedArrears,
        };
    }, [debt, overdueInstallments, dueTodayInstallments, futureInstallments, creditFinancialSummary, installment]);

    // 4. Detalle dinámico de la cuota seleccionada
    const currentInstallmentArrears = useMemo(() => {
        if (!installment) return null;
        const info = calculateInstallmentArrears({ installment, debt });
        return {
            ...info,
            totalDueThisInstallment:
                (installment.outstandingReceivablesAmount ?? 0) +
                info.pendingArrears +
                info.pendingDeferment,
        };
    }, [installment, debt]);


    // --- FUNCIÓN PRINCIPAL DE EJECUCIÓN DEL FLUJO ---
    const executePaymentFlow = async (
        amount: number,
        arrears: number,
        method: PaymentMethod,
        file?: File | null,
        forceLocationData?: LocationGPS | null,
    ) => {
        setLoading(true);

        // 1. Obtención segura de Ubicación GPS
        let location = forceLocationData;
        if (location === undefined || location === null) {
            try {
                location = await getCurrentLocation();
            } catch (error) {
                console.warn("Could not get location:", error);
                setPendingPayment({ type: "partial", amount, arrears, method, file });
                setLocationDialogOpen(true);
                setLoading(false);
                return;
            }
        }

        // 2. Enrutamiento por Método de Pago
        try {
            if (method === "consignacion") {
                await handleConsignmentPayment(amount, arrears, file, location);
            } else {
                await handleCashPayment(amount, arrears, location);
            }
        } catch (error: unknown) {
            console.error("Error en el flujo de pago:", error);
            setDialogTitle("Error");
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error al procesar el pago.";
            setDialogBody(errorMessage);
        } finally {
            setLoading(false);
            setDialogOpen(true);
            setPendingPayment(null);
            setProofFile(null);
        }
    };

    // --- ESTRATEGIA 1: PAGO EN EFECTIVO EN CASCADA ---
    const handleCashPayment = async (amount: number, arrears: number, location?: LocationGPS) => {
        if (!installment || !debt) return;

        const registerResult = await paymentOrchestrator.registerCascadingPayment({
            companyId,
            amount,
            arrears,
            collectorId: user?.id || collectorId,
            collectorName: user?.name || "",
            debt,
            allInstallments: installmentsOfDebt,
            method: "efectivo",
            location,
            todayDateStr: getLocalDate(new Date()),
        });

        if (!registerResult.ok) {
            handlePaymentError(registerResult.error);
            return;
        }

        handleCascadingPaymentSuccess(
            registerResult.value.installments,
            registerResult.value.debt,
            registerResult.value.payments,
            amount + arrears
        );
    };

    // --- ESTRATEGIA 2: PAGO POR CONSIGNACIÓN EN CASCADA ---
    const handleConsignmentPayment = async (
        amount: number,
        arrears: number,
        file?: File | null,
        location?: LocationGPS,
    ) => {
        if (!file) {
            throw new Error("Debe adjuntar un comprobante para pagos por consignación.");
        }
        if (!selectedBankAccountId) {
            throw new Error("No se seleccionó una cuenta bancaria.");
        }

        const selectedAccount = bankAccounts.find((acc) => acc.id === selectedBankAccountId);
        if (!selectedAccount) {
            throw new Error("La cuenta bancaria seleccionada no es válida.");
        }

        const registerResult = await paymentOrchestrator.registerCascadingPayment({
            amount,
            arrears,
            companyId,
            collectorId: user?.id || collectorId,
            collectorName: user?.name || "",
            debt: debt!,
            allInstallments: installmentsOfDebt,
            method: "consignacion",
            location,
            file,
            bankAccount: selectedAccount,
            todayDateStr: getLocalDate(new Date()),
        });

        if (!registerResult.ok) {
            handlePaymentError(registerResult.error);
            return;
        }

        handleCascadingPaymentSuccess(
            registerResult.value.installments,
            registerResult.value.debt,
            registerResult.value.payments,
            amount + arrears
        );
    };

    // --- HELPERS AUXILIARES DE RESPUESTA DE UI ---
    const handlePaymentError = (
        error: RegisterCascadingPaymentError | RegisterCashPaymentError | RegisterConsignmentPaymentError | { message?: string }
    ) => {
        if ("code" in error && error.code === "EXCEEDS_TOTAL_DEBT") {
            setDialogTitle("Límite de Abono Excedido");
            const max = error.maxAllowed;
            setDialogBody(
                `No puedes abonar más de $${max.toLocaleString()} en monto base a la deuda.`,
            );
        } else if ("code" in error && error.code === "EXCEEDS_ARREARS_LIMIT") {
            setDialogTitle("Límite de Mora Excedido");
            const max = error.maxAllowed;
            setDialogBody(
                `No puedes abonar más de $${max.toLocaleString()} en concepto de mora o aplazamiento.`,
            );
        } else {
            const msg = "message" in error && typeof error.message === "string"
                ? error.message
                : "Error al registrar el pago.";
            throw new Error(msg);
        }
    };

    const handleCascadingPaymentSuccess = (
        updatedInstallments: Installment[],
        updatedDebt: Debt,
        payments: Payment[],
        totalPaid: number
    ) => {
        const currentUpdated = updatedInstallments.find((i) => i.id === installmentId);
        if (currentUpdated) {
            setInstallment(currentUpdated);
        }
        setDebt(updatedDebt);

        setInstallmentsOfDebt((prev) =>
            prev.map((inst) => {
                const found = updatedInstallments.find((u) => u.id === inst.id);
                return found || inst;
            })
        );

        setDialogTitle("Abono Registrado con Éxito");
        setDialogBody(
            <Box display="flex" flexDirection="column" gap={1.5} pt={0.5}>
                <Typography variant="body2" color="text.primary">
                    Se registró un recaudo de <strong>${totalPaid.toLocaleString()}</strong> distribuido en <strong>{payments.length} pago(s)</strong>:
                </Typography>
                <Box
                    component="ul"
                    sx={{
                        pl: 2.5,
                        m: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    {payments.map((p) => {
                        const inst =
                            updatedInstallments.find((i) => i.id === p.installmentId) ||
                            installmentsOfDebt.find((i) => i.id === p.installmentId);
                        const cuotaLabel = inst ? `Cuota #${inst.installmentNumber}` : "Cuota";

                        const concepts: string[] = [];
                        if (p.capitalPaid > 0) concepts.push(`Capital: $${p.capitalPaid.toLocaleString()}`);
                        if (p.interestPaid > 0) concepts.push(`Interés: $${p.interestPaid.toLocaleString()}`);
                        if (p.arrearsPaid > 0) concepts.push(`Mora: $${p.arrearsPaid.toLocaleString()}`);
                        if (p.defermentPaid > 0) concepts.push(`Aplazamiento: $${p.defermentPaid.toLocaleString()}`);

                        return (
                            <Box component="li" key={p.id}>
                                <Typography variant="body2" fontWeight={600}>
                                    {cuotaLabel}: ${p.amount.toLocaleString()}
                                </Typography>
                                {concepts.length > 0 && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {concepts.join(" | ")}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const initiatePayment = (
        type: "full" | "partial",
        amount: number,
        arrears: number,
    ) => {
        setPendingPayment({
            type,
            amount,
            arrears,
        });

        setPaymentMethodDialogOpen(true);
    };

    const handlePaymentMethodConfirm = () => {
        if (!pendingPayment || ((pendingPayment.amount || 0) <= 0 && (pendingPayment.arrears || 0) <= 0)) return;

        setPaymentMethodDialogOpen(false);

        executePaymentFlow(
            pendingPayment.amount || 0,
            pendingPayment.arrears || 0,
            selectedMethod,
            proofFile,
        );
    };

    const handleLocationDialogResponse = (confirm: boolean) => {
        setLocationDialogOpen(false);

        if (confirm && pendingPayment && ((pendingPayment.amount || 0) > 0 || (pendingPayment.arrears || 0) > 0)) {
            const { amount, method, arrears, file } = pendingPayment;

            executePaymentFlow(
                amount || 0,
                arrears || 0,
                method || "efectivo",
                file,
                null,
            );
            return;
        }

        setPendingPayment(null);
        setProofFile(null);
    };

    const handlePayCurrentInstallment = () => {
        if (!installmentId || !installment) return;

        const amountToPay = installment.outstandingReceivablesAmount;
        const arrearsToPay =
            (currentInstallmentArrears?.pendingArrears ?? installment.outstandingReceivablesArrears ?? 0) +
            (currentInstallmentArrears?.pendingDeferment ?? installment.outstandingReceivablesDeferment ?? 0);

        initiatePayment("full", amountToPay, arrearsToPay);
    };

    const handlePayDueToday = () => {
        if (!debt) return;
        const amountToPay = creditFinancialSummary.totalBaseAmount;
        const arrearsToPay = creditFinancialSummary.totalDelayArrears + creditFinancialSummary.totalDefermentArrears;

        initiatePayment("full", amountToPay, arrearsToPay);
    };

    const handlePayoffDebt = () => {
        if (!liquidationSimulation) return;
        const amountToPay = liquidationSimulation.maxAllowedBase;
        const arrearsToPay = liquidationSimulation.maxAllowedArrears;

        initiatePayment("full", amountToPay, arrearsToPay);
    };

    const handleSetAbonoPreset = (preset: "current" | "dueToday" | "payoff") => {
        if (preset === "current" && installment) {
            setValue("amount", installment.outstandingReceivablesAmount);
            setValue(
                "arrears",
                (currentInstallmentArrears?.pendingArrears ?? installment.outstandingReceivablesArrears ?? 0) +
                (currentInstallmentArrears?.pendingDeferment ?? installment.outstandingReceivablesDeferment ?? 0)
            );
        } else if (preset === "dueToday") {
            setValue("amount", creditFinancialSummary.totalBaseAmount);
            setValue(
                "arrears",
                creditFinancialSummary.totalDelayArrears + creditFinancialSummary.totalDefermentArrears
            );
        } else if (preset === "payoff" && liquidationSimulation) {
            setValue("amount", liquidationSimulation.maxAllowedBase);
            setValue("arrears", liquidationSimulation.maxAllowedArrears);
        }
    };

    const handleFullPayment = handlePayCurrentInstallment;

    const onPartialPaymentSubmit: SubmitHandler<PartialPaymentForm> = (
        data,
    ) => {
        const amountNum = Number(data.amount) || 0;
        const arrearsNum = Number(data.arrears) || 0;

        if (amountNum <= 0 && arrearsNum <= 0) {
            setDialogTitle("Monto Inválido");
            setDialogBody("Debes ingresar un valor mayor a $0 en monto base o en mora.");
            setDialogOpen(true);
            return;
        }

        setPartialPaymentDialogOpen(false);
        reset();
        initiatePayment("partial", amountNum, arrearsNum);
    };

    const handleRegisterAttempt = async () => {
        if (!installmentId || !companyId || !collectorId || !installment) {
            return;
        }

        setAttemptLoading(true);

        try {
            let location: LocationGPS | undefined;

            try {
                location = await getCurrentLocation();
            } catch (error) {
                console.warn("Could not get location for attempt:", error);
            }

            const orchestrator = new CollectionAttemptOrchestrator();

            const result = await orchestrator.createAttempt({
                companyId,
                collectorId,
                routeId: installment.routeId,
                installmentId,
                description: attemptDescription,
                location,
            });

            if (!result.ok) {
                throw new Error("Error registering attempt");
            }

            setAttemptDialogOpen(false);
            setAttemptDescription("");
            setDialogTitle("Éxito");
            setDialogBody("Intento de cobro registrado correctamente.");
            setDialogOpen(true);

            setInstallment((prev) =>
                prev
                    ? {
                        ...prev,
                        attemptedCollection: true,
                        dateAttemptedPayment: new Date()
                            .toISOString()
                            .split("T")[0],
                    }
                    : prev,
            );
        } catch (error) {
            console.error(error);
            setDialogTitle("Error");
            setDialogBody("No se pudo registrar el intento de cobro.");
            setDialogOpen(true);
        } finally {
            setAttemptLoading(false);
        }
    };

    const handleToggleManaged = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (!installmentId || !companyId || !installment) return;

        const isChecked = event.target.checked;
        const today = new Date().toISOString().split("T")[0];

        const previousInstallment = installment;

        const updatedInstallment = {
            ...installment,
            managed: isChecked,
            managementDate: isChecked ? today : undefined,
        };

        setInstallment(updatedInstallment);

        try {
            const result = await installmentsOrchestrator.updateById({
                companyId,
                installment: updatedInstallment,
            });

            if (!result.ok) {
                throw new Error("Failed to update managed status");
            }
        } catch (error) {
            console.error("Error updating managed status", error);
            setInstallment(previousInstallment);
        }
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (event.target.files?.[0]) {
            setProofFile(event.target.files[0]);
        }
    };

    const handleCallClient = (phone?: string) => {
        if (!phone) return;

        const cleanPhone = phone.replaceAll(/\D/g, "");
        window.open(`tel:+57${cleanPhone}`, "_self");
    };

    const handleWhatsAppClient = (phone?: string) => {
        if (!phone) return;

        const cleanPhone = phone.replaceAll(/\D/g, "");
        window.open(`https://wa.me/57${cleanPhone}`, "_blank");
    };

    const handleNavigateToDebt = () => {
        if (!installment) return;

        navigate(
            ScreenPaths.collector.debtInstallments(installment.debtId),
        );
    };

    const handleRenewalSuccess = () => {
        if (!debt) return;

        navigate(ScreenPaths.collector.debtInstallments(debt.id));
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleOpenPartialPayment = () => {
        reset({ amount: 0, arrears: 0 });
        setPartialPaymentDialogOpen(true);
    };

    const canBePaid =
        installment?.status === "pendiente"

    const totalPaidForDebt = installmentsOfDebt.reduce(
        (acc, curr) => acc + (curr.amountPaid || 0),
        0,
    );

    const remainingBalance = debt
        ? debt.amount - totalPaidForDebt
        : 0;

    return {
        installment,
        debt,
        installmentsOfDebt,
        loading,
        companyId,

        dialogOpen,
        dialogTitle,
        dialogBody,

        attemptDialogOpen,
        attemptDescription,
        attemptLoading,

        partialPaymentDialogOpen,

        locationDialogOpen,
        pendingPayment,

        paymentMethodDialogOpen,
        selectedMethod,
        proofFile,

        bankAccounts,
        selectedBankAccountId,

        canBePaid,
        balancesDueFromInstallment,
        totalPaidForDebt,
        remainingBalance,

        maxDueFromInstallment,
        debtPaymentCapacity,

        control,
        handleSubmit,
        errors,
        reset,

        setAttemptDialogOpen,
        setAttemptDescription,
        setPartialPaymentDialogOpen,
        setLocationDialogOpen,
        setPaymentMethodDialogOpen,
        setSelectedMethod,
        setSelectedBankAccountId,

        handleCloseDialog,
        handlePaymentMethodConfirm,
        handleLocationDialogResponse,
        handleFullPayment,
        onPartialPaymentSubmit,
        handleRegisterAttempt,
        handleToggleManaged,
        handleFileChange,
        handleCallClient,
        handleWhatsAppClient,
        handleNavigateToDebt,
        handleRenewalSuccess,
        handleOpenPartialPayment,

        dueTodayInstallments,
        futureInstallments,
        overdueInstallments,
        paidInstallments,
        creditFinancialSummary,
        liquidationSimulation,
        currentInstallmentArrears,
        handlePayCurrentInstallment,
        handlePayDueToday,
        handlePayoffDebt,
        handleSetAbonoPreset,
        setValue,
    }
}