import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAppSelector } from "../../../../store/redux/coreRedux";

import type { Installment } from "../../../../features/debits/domain/business/entities/Installment";
import InstallmentsOrchestrator from "../../../../features/debits/domain/infraestructure/installmentsOrchestrator";
import PaymentOrchestrator from "../../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import {
    type Payment,
    type PaymentMethod,
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
import type { RegisterCashPaymentError } from "../../../../features/debits/domain/business/useCases/payment/RegisterCashPaymentUseCase";
import type { RegisterConsignmentPaymentError } from "../../../../features/debits/domain/business/useCases/payment/RegisterConsignmentPaymentUseCase";

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
    const [dialogBody, setDialogBody] = useState("");
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

    const createPaymentObject = (
        amount: number,
        location?: LocationGPS,
        paymentId?: string,
        proofUrl?: string,
        method: PaymentMethod = "efectivo",
        bankAccountId?: string,
    ): Payment => {
        if (!installment) {
            throw new Error("No hay una cuota cargada.");
        }

        return {
            capitalPaid: installment.capitalPaid,
            interestPaid: installment.interestPaid,
            arrearsPaid: installment.arrearsPaid,
            defermentPaid: installment.defermentPaid,
            debtId: installment.debtId,
            clientId: installment.clientId,
            isTight: false,
            idRoute: debt?.routeId || "",
            id: paymentId || "",
            idProofOfPayment: proofUrl || "",
            collectorObservation: "",
            accountantObservation: "",
            installmentId: installment.id,
            clientName: installment.clientName,
            collectorName: user?.name || "Desconocido",
            collectorId,
            amount,
            method,
            status: "registrado",
            paidAt: new Date().toISOString(),
            location,
            bankAccountId,
        };
    };

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
                setPendingPayment({ type: "partial", amount, method, file });
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
                await handleCashPayment(amount, location);
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

    // --- ESTRATEGIA 1: PAGO EN EFECTIVO (ATÓMICO) ---
    const handleCashPayment = async (amount: number, location?: LocationGPS) => {
        if (!installment) return;

        const payment = createPaymentObject(
            amount,
            location,
            undefined,
            undefined,
            "efectivo",
        );
        payment.installmentId = installment.id;

        // Delegamos el registro y la actualización del saldo del cobrador a un solo llamado del Orquestador
        const registerResult = await paymentOrchestrator.registerCashPayment({
            payment,
            companyId,
            collectorId: user?.id || "",
            currentCollectorAmount: user?.totalAmount || 0,
        });

        if (!registerResult.ok) {
            handlePaymentError(registerResult.error);
            return;
        }

        handlePaymentSuccess(registerResult.value.installment, amount);
    };

    // --- ESTRATEGIA 2: PAGO POR CONSIGNACIÓN (CON COMPENSACIÓN / ROLLBACK) ---
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

        // Delegamos al Orquestador la transacción segura (Validar -> Subir Comprobante -> Registrar Pago -> Actualizar Saldo Banco)
        const registerResult = await paymentOrchestrator.registerConsignmentPayment({
            companyId,
            amount,
            installment: installment!,
            arrears,
            debtType: installment!.type,
            location,
            file,
            bankAccount: selectedAccount,
            installmentId: installment!.id,
            debtId: installment!.debtId,
            clientId: installment!.clientId,
        });

        if (!registerResult.ok) {
            handlePaymentError(registerResult.error);
            return;
        }

        handlePaymentSuccess(registerResult.value.installment, amount);
    };

    // --- HELPERS AUXILIARES DE RESPUESTA DE UI ---
    const handlePaymentError = (
        error: RegisterCashPaymentError | RegisterConsignmentPaymentError | { message?: string }
    ) => {
        if ("code" in error && error.code === "EXCEEDS_TOTAL_DEBT") {
            setDialogTitle("Límite de Abono Excedido");
            const max = error.maxAllowed;
            setDialogBody(
                `No puedes abonar más de $${max.toLocaleString()}. ` +
                "Este valor corresponde a la deuda total pendiente de la cuota " +
                "actual más el valor base de las cuotas futuras.",
            );
        } else {
            const msg = "message" in error && typeof error.message === "string"
                ? error.message
                : "Error al registrar el pago.";
            throw new Error(msg);
        }
    };

    const handlePaymentSuccess = (updatedInstallment: Installment, amount: number) => {
        setInstallment(updatedInstallment);
        if (updatedInstallment.status === "pagada") {
            setDialogTitle("Pago Registrado");
            setDialogBody("El pago completo fue registrado correctamente.");
        } else {
            setDialogTitle("Abono Registrado");
            setDialogBody(`Se registró un abono de $${amount.toLocaleString()}.`);
        }
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
        if (!pendingPayment?.amount || !pendingPayment?.arrears) return;


        setPaymentMethodDialogOpen(false);

        executePaymentFlow(
            pendingPayment.amount,
            pendingPayment.arrears,
            selectedMethod,
            proofFile,
        );
    };

    const handleLocationDialogResponse = (confirm: boolean) => {
        setLocationDialogOpen(false);

        if (confirm && pendingPayment?.amount && pendingPayment?.arrears) {
            const { amount, method, arrears, file } = pendingPayment;

            executePaymentFlow(
                amount,
                arrears,
                method || "efectivo",
                file,
                null,
            );
            return;
        }

        setPendingPayment(null);
        setProofFile(null);
    };

    const handleFullPayment = () => {
        if (!installmentId || !installment) return;

        const amountToPay =
            installment.amount - (installment.amountPaid || 0);

        const arrearsToPay =
            installment.arrears - (installment.arrearsPaid || 0);

        initiatePayment("full", amountToPay, arrearsToPay);
    };

    const onPartialPaymentSubmit: SubmitHandler<PartialPaymentForm> = (
        data,
    ) => {
        setPartialPaymentDialogOpen(false);
        reset();
        initiatePayment("partial", Number(data.amount), Number(data.arrears));
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
        reset({ amount: 0 });
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
    }
}