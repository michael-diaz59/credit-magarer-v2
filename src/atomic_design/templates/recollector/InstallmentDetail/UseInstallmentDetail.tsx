import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";

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
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import DebtOrchestrator from "../../../../features/debits/domain/infraestructure/DebtOrchestrator";
import type { Debt } from "../../../../features/debits/domain/business/entities/Debt";
import type { LocationGPS } from "../../../../features/costumers/domain/business/entities/Address";
import { CollectionAttemptOrchestrator } from "../../../../features/debits/domain/infraestructure/CollectionAttemptOrchestrator";
import { ScreenPaths } from "../../../../core/helpers/name_routes";

export interface PartialPaymentForm {
    amount: number;
}

interface PendingPayment {
    type: "full" | "partial";
    amount?: number;
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
    const dispatch = useAppDispatch();
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

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<PartialPaymentForm>({
        defaultValues: {
            amount: 0,
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

                const currentInstallment = result.value.state;
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

    const processPayment = async (
        amount: number,
        location?: LocationGPS,
        paymentId?: string,
        proofUrl?: string,
        method: PaymentMethod = "efectivo",
    ) => {
        if (!installmentId || !installment) return;

        try {
            setLoading(true);

            if (method === "consignacion") {
                const selectedAccount = bankAccounts.find(
                    (account) => account.id === selectedBankAccountId,
                );

                if (!selectedAccount) {
                    throw new Error("No se seleccionó una cuenta bancaria.");
                }

                const newMonto = selectedAccount.monto + amount;

                const updateResult = await bankAccountOrchestrator.update({
                    companyId,
                    bankAccount: {
                        ...selectedAccount,
                        monto: newMonto,
                    },
                });

                if (!updateResult.ok) {
                    throw new Error("Error al actualizar el saldo de la cuenta bancaria.");
                }
            }

            if (method === "efectivo" && user) {
                const userOrchestrator = new UserOrchestrator(dispatch);
                const newTotalAmount = (user.totalAmount || 0) + amount;

                const userUpdateResult = await userOrchestrator.updateTotalAmount({
                    userId: user.id,
                    companyId: user.companyId,
                    newAmount: newTotalAmount,
                });

                if (!userUpdateResult.ok) {
                    console.error(
                        "Error updating user total amount",
                        userUpdateResult.error,
                    );
                }
            }

            const payment = createPaymentObject(
                amount,
                location,
                paymentId,
                proofUrl,
                method,
                method === "consignacion"
                    ? selectedBankAccountId
                    : undefined,
            );

            const registerResult = await paymentOrchestrator.registerPayment({
                payment,
                companyId,
                payLatePayment: false,
            });

            if (!registerResult.ok) {
                if (registerResult.error.code === "EXCEEDS_TOTAL_DEBT") {
                    setDialogTitle("Límite de Abono Excedido");

                    const max = (registerResult.error as any).maxAllowed;

                    setDialogBody(
                        `No puedes abonar más de $${max.toLocaleString()}. ` +
                        "Este valor corresponde a la deuda total pendiente de la cuota " +
                        "actual más el valor base de las cuotas futuras.",
                    );

                    setLoading(false);
                    setDialogOpen(true);
                    return;
                }

                throw new Error("Error al registrar el pago.");
            }

            const { installment: updatedInstallment } = registerResult.value;

            setInstallment(updatedInstallment);

            if (updatedInstallment.status === "pagada") {
                setDialogTitle("Pago Registrado");
                setDialogBody("El pago completo fue registrado correctamente.");
            } else {
                setDialogTitle("Abono Registrado");
                setDialogBody(`Se registró un abono de $${amount.toLocaleString()}.`);
            }
        } catch (error) {
            console.error(error);
            setDialogTitle("Error");
            setDialogBody("Ocurrió un error al procesar el pago.");
        } finally {
            setLoading(false);
            setDialogOpen(true);
            setPendingPayment(null);
            setProofFile(null);
        }
    };

    const executePaymentFlow = async (
        amount: number,
        method: PaymentMethod,
        file?: File | null,
        forceLocationData?: LocationGPS | null,
    ) => {
        setLoading(true);

        let location = forceLocationData;

        if (location === undefined) {
            try {
                location = await getCurrentLocation();
            } catch (error) {
                console.warn("Could not get location:", error);

                setPendingPayment({
                    type: "partial",
                    amount,
                    method,
                    file,
                });

                setLocationDialogOpen(true);
                setLoading(false);
                return;
            }
        }

        let generatedId: string | undefined;
        let proofUrl: string | undefined;

        if (method === "consignacion") {
            if (!file) {
                setLoading(false);
                setDialogTitle("Error");
                setDialogBody(
                    "Debe adjuntar un comprobante para pagos por consignación.",
                );
                setDialogOpen(true);
                return;
            }

            try {
                generatedId = paymentOrchestrator.generatePaymentId(companyId);

                const uploadResult = await paymentOrchestrator.uploadProof({
                    file,
                    companyId,
                    paymentId: generatedId,
                });

                if (!uploadResult.ok) {
                    throw new Error("Upload Failed");
                }

                proofUrl = uploadResult.value;
            } catch (error) {
                console.error("Upload error", error);
                setLoading(false);
                setDialogTitle("Error");
                setDialogBody(
                    "No se puede registrar el pago como consignación por el momento. " +
                    "Inténtelo más tarde o comuníquese con un asesor.",
                );
                setDialogOpen(true);
                setProofFile(null);
                return;
            }
        }

        await processPayment(
            amount,
            location || undefined,
            generatedId,
            proofUrl,
            method,
        );
    };

    const initiatePayment = (
        type: "full" | "partial",
        amount: number,
    ) => {
        setPendingPayment({
            type,
            amount,
        });

        setPaymentMethodDialogOpen(true);
    };

    const handlePaymentMethodConfirm = () => {
        if (!pendingPayment?.amount) return;

        setPaymentMethodDialogOpen(false);

        executePaymentFlow(
            pendingPayment.amount,
            selectedMethod,
            proofFile,
        );
    };

    const handleLocationDialogResponse = (confirm: boolean) => {
        setLocationDialogOpen(false);

        if (confirm && pendingPayment?.amount) {
            const { amount, method, file } = pendingPayment;

            executePaymentFlow(
                amount,
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

        initiatePayment("full", amountToPay);
    };

    const onPartialPaymentSubmit: SubmitHandler<PartialPaymentForm> = (
        data,
    ) => {
        setPartialPaymentDialogOpen(false);
        reset();
        initiatePayment("partial", Number(data.amount));
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
        installment?.status === "pendiente" ||
        installment?.status === "incompleto";

    const maxPaymentAmount = installment
        ? installment.amount - (installment.amountPaid || 0)
        : 0;

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
        maxPaymentAmount,
        totalPaidForDebt,
        remainingBalance,

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