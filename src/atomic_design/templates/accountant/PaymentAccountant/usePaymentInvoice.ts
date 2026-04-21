import { useEffect, useMemo, useState } from "react";
import type { Payment } from "../../../../features/debits/domain/business/entities/Payment";
import PaymentOrchestrator from "../../../../features/debits/domain/infraestructure/PaymentOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";
import { useParams } from "react-router";
import UserOrchestrator from "../../../../features/users/domain/infraestructure/UserOrchestrator";
import { routeOrchestrator } from "../../../../features/routes/domain/infraestructure/RouteOrchestrator";
import type { Route } from "../../../../features/routes/domain/business/entities/Route";

export const usePaymentInvoice = () => {
    const [payment, setPayment] = useState<Payment>({
        id: "1",
        idProofOfPayment: "proof1",
        idRoute: "route1",
        collectorObservation: "El cliente pagó completo.",
        accountantObservation: "",
        installmentId: "inst1",
        costumerName: "Maria Lopez",
        collectorName: "Juan Perez",
        collectorId: "collector1",
        amount: 120000,
        method: "efectivo",
        status: "registrado",
        paidAt: "2026-03-30",
        isTight: false,
        bankAccountId: "",
    });
    const [routes, setRoutes] = useState<Route[]>([]);

    const dispatch = useAppDispatch();
    const companyId = useAppSelector((state: any) => state.user.user?.companyId) || "";
    const userOrchestrator = useMemo(() => new UserOrchestrator(dispatch), []);

    const { paymentId } = useParams<{ paymentId?: string }>();

    const paymentOrchestrator = useMemo(() => new PaymentOrchestrator(), []);


    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Definimos una función asíncrona interna
        const fetchPayment = async () => {
            try {
                if (!paymentId) return;
                setIsLoading(true);
                const result = await paymentOrchestrator.getById({
                    companyId,
                    paymentId: paymentId,
                });

                if (result.ok && result.value.payment) {
                    setPayment(result.value.payment);
                } else {
                    // Aquí podrías manejar el error con un estado en lugar de un alert
                    console.error("Error al cargar el pago");
                }
            } catch (error) {
                console.error("Error de red o servidor", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayment();
    }, [companyId, paymentId]); // Dependencias para que si cambian, se recargue

    useEffect(() => {
        const fetchRoutes = async () => {
            if (!companyId) return;
            const result = await routeOrchestrator.getRoutesUseCase.execute({ companyId });
            if (result.ok) {
                setRoutes(result.value);
            }
        };
        fetchRoutes();
    }, [companyId]);

    const saveAccountantObservation = async (text: string) => {
        console.log("Guardar observación:", text);
        console.log("payment", payment)


        const result = await paymentOrchestrator.updatePayment({
            companyId,
            payment: { ...payment, accountantObservation: text },
        });

        if (result.ok && result.value.payment) {
            setPayment(result.value.payment);
            alert("Observación guardada correctamente");
        } else {
            // Aquí podrías manejar el error con un estado en lugar de un alert
            console.error("Error al guardar la observación");
            alert("Error al guardar la observación");
        }

        setPayment((prev) => ({
            ...prev,
            accountantObservation: text,
        }));
    };

    const applyDescuadre = async (amount: number) => {
        applyDescuadreInUser(amount, payment);
    };

    const changePaymentRoute = async (routeId: string) => {
        if (payment.isTight) {
            alert("No se puede cambiar la ruta de un pago que ya ha sido cuadrado.");
            return;
        }

        const result = await paymentOrchestrator.updatePayment({
            companyId,
            payment: { ...payment, idRoute: routeId },
        });

        if (result.ok && result.value.payment) {
            setPayment(result.value.payment);
            alert("Ruta actualizada correctamente");
        } else {
            console.error("Error al cambiar la ruta");
            alert("Error al actualizar la ruta");
        }
    };

    return {
        payment,
        saveAccountantObservation,
        applyDescuadre,
        changePaymentRoute,
        routes,
        isLoading,
        companyId,
    };

    async function applyDescuadreInUser(amount: number, payment: Payment) {

        const result = await userOrchestrator.updateUser({
            idCompany: companyId,
            user: {
                totalDebt: amount,
            },
            idUser: payment.collectorId,
        });

        if (result.ok) {
            alert("Descuadre aplicado correctamente")
        } else {
            // Aquí podrías manejar el error con un estado en lugar de un alert
            alert("Error al aplicar el descuadre");
        }
    }
};

