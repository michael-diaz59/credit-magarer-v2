import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { CollectionAttempt } from "../../entities/CollectionAttempt";
import type { Installment } from "../../entities/Installment";
import type { Route } from "../../../../../routes/domain/business/entities/Route";
import type { Debt } from "../../entities/Debt";
import type { UserGateway } from "../../../../../users/domain/infraestructure/UserGateway";
import type { RouteGateway } from "../../../../../routes/domain/infraestructure/RouteGateway";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { CollectionAttemptGateway } from "../../../infraestructure/CollectionAttemptGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

import { GetUserByCompanyCase } from "../../../../../users/domain/business/useCases/GetUsersByCompanyCase";
import { GetRoutesUseCase } from "../../../../../routes/domain/business/useCases/GetRoutesUseCase";
import { GetPaymentsByDateUseCase } from "../payment/GetPaymentsByDateUseCase";
import { GetCollectionAttemptsByDateUseCase } from "../installment/GetCollectionAttemptsByDateUseCase";
import { GetNextInstallmentsByRouteUseCase } from "../installment/GetNextInstallmentsByCollectorUseCase";
import { GetManagementInstallmentsByRoutesUseCase } from "../installment/GetManagementInstallmentsByRoutesUseCase";
import { GetDebtsByIdsUseCase } from "../debt/GetDebtsByIdsUseCase";
import { calculateInstallmentArrears } from "../../services/calculateInstallmentArrears";
import { getLocalDate } from "../../../../../../core/helpers/dates/calculateDays";

export type ManagementStatus = "pagado" | "intento" | "pendiente";

export interface RouteCreditToManage {
    debtId: string;
    debtName: string;
    installmentSummary: string;
    installmentsCount: number;
    installmentId: string;
    installmentNumber: number;
    customerId: string;
    customerName: string;
    routeId: string;
    dueDate: string;
    baseAmount: number;
    pendingCapital: number;
    dynamicArrears: number;
    totalDueToday: number;
    managementStatus: ManagementStatus;
    paymentsCount: number;
    totalPaidToday: number;
    paymentDetail?: {
        paymentId: string;
        amount: number;
        paidAt: string;
        method: string;
        collectorName?: string;
    };
    attemptDetail?: {
        attemptId: string;
        date: string;
        description: string;
        collectorId?: string;
    };
}

export interface RouteManagementSummary {
    routeId: string;
    routeName: string;
    totalCredits: number;
    managedCredits: number;
    pendingCredits: number;
    percentageManaged: number; // 0 a 100
    totalAmountExpected: number;
    totalAmountCollected: number;
    credits: RouteCreditToManage[];
}

export interface RouteManagementGlobalStats {
    totalCredits: number;
    managedCredits: number;
    pendingCredits: number;
    percentageManaged: number; // 0 a 100
    totalAmountExpected: number;
    totalAmountCollected: number;
}

export interface CollectorDailyOperations {
    collectorId: string;
    collectorName: string;
    routeIds: string[];
    payments: Payment[];
    attempts: CollectionAttempt[];
    unmanagedInstallments: Installment[];
}

export interface GetDailyOperationsUseCaseInput {
    companyId: string;
    date?: string; // Formato YYYY-MM-DD
}

export interface GetDailyOperationsUseCaseOutput {
    operations: Record<string, CollectorDailyOperations>;
    routes: Route[];
    routeManagement: {
        globalStats: RouteManagementGlobalStats;
        routesSummary: Record<string, RouteManagementSummary>;
    };
}

export type GetDailyOperationsUseCaseError =
    | { code: "UNKNOWN_ERROR"; message: string }
    | { code: "NETWORK_ERROR"; message: string };

export class GetDailyOperationsUseCase {
    private readonly getUserByCompanyCase: GetUserByCompanyCase;
    private readonly getRoutesUseCase: GetRoutesUseCase;
    private readonly getPaymentsByDateUseCase: GetPaymentsByDateUseCase;
    private readonly getCollectionAttemptsByDateUseCase: GetCollectionAttemptsByDateUseCase;
    private readonly getNextByRouteUseCase: GetNextInstallmentsByRouteUseCase;
    private readonly getManagementInstallmentsByRoutesUseCase: GetManagementInstallmentsByRoutesUseCase;
    private readonly getDebtsByIdsUseCase: GetDebtsByIdsUseCase;

    constructor(
        userGateway: UserGateway,
        routeGateway: RouteGateway,
        paymentGateway: PaymentGateway,
        collectionAttemptGateway: CollectionAttemptGateway,
        debtGateway: DebtGateway,
        installmentGateway: InstallmentGateway
    ) {
        this.getUserByCompanyCase = new GetUserByCompanyCase(userGateway);
        this.getRoutesUseCase = new GetRoutesUseCase(routeGateway);
        this.getPaymentsByDateUseCase = new GetPaymentsByDateUseCase(paymentGateway);
        this.getCollectionAttemptsByDateUseCase = new GetCollectionAttemptsByDateUseCase(collectionAttemptGateway);
        this.getNextByRouteUseCase = new GetNextInstallmentsByRouteUseCase(debtGateway, installmentGateway);
        this.getManagementInstallmentsByRoutesUseCase = new GetManagementInstallmentsByRoutesUseCase(installmentGateway);
        this.getDebtsByIdsUseCase = new GetDebtsByIdsUseCase(debtGateway);
    }

    async execute(input: GetDailyOperationsUseCaseInput): Promise<Result<GetDailyOperationsUseCaseOutput, GetDailyOperationsUseCaseError>> {
        try {
            const targetDate = input.date || getLocalDate(new Date());

            // 1. Consultar en paralelo: cobradores, rutas, pagos e intentos del día
            const [collectorsRes, routesRes, paymentsRes, attemptsRes] = await Promise.all([
                this.getUserByCompanyCase.execute({ id: input.companyId, rol: "COLLECTOR" }),
                this.getRoutesUseCase.execute({ companyId: input.companyId }),
                this.getPaymentsByDateUseCase.execute({ companyId: input.companyId, date: targetDate }),
                this.getCollectionAttemptsByDateUseCase.execute({ companyId: input.companyId, date: targetDate }),
            ]);

            const routes: Route[] = routesRes.ok ? routesRes.value : [];
            const grouped: Record<string, CollectorDailyOperations> = {};

            // 2. Inicializar cobradores conocidos de la empresa
            if (collectorsRes.state.ok) {
                for (const collector of collectorsRes.state.value) {
                    grouped[collector.id] = {
                        collectorId: collector.id,
                        collectorName: collector.name,
                        routeIds: collector.idRoutes ?? [],
                        payments: [],
                        attempts: [],
                        unmanagedInstallments: [],
                    };
                }
            }

            // 3. Mapear pagos
            if (paymentsRes.ok) {
                for (const payment of paymentsRes.value.payments) {
                    const collectorId = payment.collectorId;
                    if (grouped[collectorId]) {
                        grouped[collectorId].payments.push(payment);
                    } else {
                        grouped[collectorId] = {
                            collectorId,
                            collectorName: payment.collectorName || "Desconocido",
                            routeIds: payment.idRoute ? [payment.idRoute] : [],
                            payments: [payment],
                            attempts: [],
                            unmanagedInstallments: [],
                        };
                    }
                }
            }

            // 4. Mapear intentos de cobro
            if (attemptsRes.ok) {
                for (const attempt of attemptsRes.value.attempts) {
                    const collectorId = attempt.collectorId;
                    if (grouped[collectorId]) {
                        grouped[collectorId].attempts.push(attempt);
                    } else {
                        grouped[collectorId] = {
                            collectorId,
                            collectorName: "Desconocido",
                            routeIds: attempt.routeId ? [attempt.routeId] : [],
                            payments: [],
                            attempts: [attempt],
                            unmanagedInstallments: [],
                        };
                    }
                }
            }

            // 5. Para cada cobrador con rutas asignadas, obtener las cuotas pendientes del día
            const collectorIds = Object.keys(grouped);
            await Promise.all(
                collectorIds.map(async (collectorId) => {
                    const collectorData = grouped[collectorId];
                    if (!collectorData.routeIds || collectorData.routeIds.length === 0) {
                        return;
                    }

                    const nextInstRes = await this.getNextByRouteUseCase.execute({
                        companyId: input.companyId,
                        routeIds: collectorData.routeIds,
                        dateLimit: targetDate,
                    });

                    if (nextInstRes.ok && nextInstRes.value.state.length > 0) {
                        const pendingToday = nextInstRes.value.state;

                        // Se considera no gestionada si hoy NO hubo ni pago (asociado a la cuota o a la deuda)
                        // ni intento de cobro (asociado a la cuota o a la deuda), y la cuota no está pagada.
                        const unmanaged = pendingToday.filter((inst) => {
                            const hasPaymentToday = collectorData.payments.some(
                                (p) => p.installmentId === inst.id || (p.debtId && p.debtId === inst.debtId)
                            );
                            const hasAttemptToday = collectorData.attempts.some(
                                (a) => a.installmentId === inst.id || (a.debtId && a.debtId === inst.debtId)
                            );
                            return !hasPaymentToday && !hasAttemptToday && inst.status !== "pagada";
                        });

                        collectorData.unmanagedInstallments = unmanaged;
                    }
                })
            );

            // 6. Construir la gestión de créditos por ruta ("Créditos a Gestionar Hoy")
            const allRouteIds = routes.map((r) => r.id);
            const allInstallmentsRes = allRouteIds.length > 0
                ? await this.getManagementInstallmentsByRoutesUseCase.execute({
                      companyId: input.companyId,
                      routeIds: allRouteIds,
                      today: targetDate,
                  })
                : null;

            const allInstallments = allInstallmentsRes?.ok ? allInstallmentsRes.value : [];

            // Identificar los IDs de deudas involucradas
            const debtIdSet = new Set<string>();
            allInstallments.forEach((i) => {
                if (i.debtId) debtIdSet.add(i.debtId);
            });
            if (paymentsRes.ok) {
                paymentsRes.value.payments.forEach((p) => {
                    if (p.debtId) debtIdSet.add(p.debtId);
                });
            }
            if (attemptsRes.ok) {
                attemptsRes.value.attempts.forEach((a) => {
                    if (a.debtId) debtIdSet.add(a.debtId);
                });
            }

            const debtIdsArray = Array.from(debtIdSet);
            const debtsById: Record<string, Debt> = {};
            if (debtIdsArray.length > 0) {
                const debtsRes = await this.getDebtsByIdsUseCase.execute({
                    companyId: input.companyId,
                    debtIds: debtIdsArray,
                });
                if (debtsRes.ok) {
                    debtsRes.value.forEach((d) => {
                        debtsById[d.id] = d;
                    });
                }
            }

            const routesSummary: Record<string, RouteManagementSummary> = {};
            let globalTotalCredits = 0;
            let globalManagedCredits = 0;
            let globalPendingCredits = 0;
            let globalTotalExpected = 0;
            let globalTotalCollected = 0;

            const todayPayments = paymentsRes.ok ? paymentsRes.value.payments : [];
            const todayAttempts = attemptsRes.ok ? attemptsRes.value.attempts : [];

            routes.forEach((route) => {
                const routeCredits: RouteCreditToManage[] = [];
                const routeInstallments = allInstallments.filter((i) => i.routeId === route.id);

                // Agrupar cuotas por deuda (Debt) para que cada crédito cuente como 1 sola unidad
                const debtInstallmentsMap = new Map<string, Installment[]>();
                routeInstallments.forEach((inst) => {
                    if (!inst.debtId) return;
                    const list = debtInstallmentsMap.get(inst.debtId) || [];
                    list.push(inst);
                    debtInstallmentsMap.set(inst.debtId, list);
                });

                // Incorporar deudas de esta ruta que hayan tenido pagos o intentos hoy aunque no estén en cuotas pendientes
                todayPayments
                    .filter((p) => p.idRoute === route.id && p.debtId)
                    .forEach((p) => {
                        if (!debtInstallmentsMap.has(p.debtId)) {
                            debtInstallmentsMap.set(p.debtId, []);
                        }
                    });

                todayAttempts
                    .filter((a) => a.routeId === route.id && a.debtId)
                    .forEach((a) => {
                        if (!debtInstallmentsMap.has(a.debtId)) {
                            debtInstallmentsMap.set(a.debtId, []);
                        }
                    });

                debtInstallmentsMap.forEach((instList, debtId) => {
                    const debt = debtsById[debtId];
                    instList.sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));

                    // Identificar si la deuda tuvo pagos hoy
                    const debtPayments = todayPayments.filter(
                        (p) => p.debtId === debtId || instList.some((i) => i.id === p.installmentId)
                    );

                    // Identificar si la deuda tuvo intentos de cobro hoy
                    const debtAttempts = todayAttempts.filter(
                        (a) => a.debtId === debtId || instList.some((i) => i.id === a.installmentId)
                    );

                    let managementStatus: ManagementStatus = "pendiente";
                    let paymentDetail: RouteCreditToManage["paymentDetail"];
                    let attemptDetail: RouteCreditToManage["attemptDetail"];
                    let totalPaidToday = 0;

                    if (debtPayments.length > 0) {
                        managementStatus = "pagado";
                        totalPaidToday = debtPayments.reduce((acc, p) => acc + (p.amount ?? 0), 0);
                        const primaryPayment = debtPayments[0];
                        paymentDetail = {
                            paymentId: primaryPayment.id,
                            amount: totalPaidToday,
                            paidAt: primaryPayment.paidAt,
                            method: primaryPayment.method,
                            collectorName: primaryPayment.collectorName,
                        };
                    } else if (debtAttempts.length > 0) {
                        managementStatus = "intento";
                        const primaryAttempt = debtAttempts[0];
                        attemptDetail = {
                            attemptId: primaryAttempt.id,
                            date: primaryAttempt.date,
                            description: primaryAttempt.colletorDescription || primaryAttempt.name,
                            collectorId: primaryAttempt.collectorId,
                        };
                    }

                    // Calcular valores financieros consolidados para este crédito
                    let baseAmount = 0;
                    let dynamicArrears = 0;
                    let pendingCapital = 0;

                    if (instList.length > 0) {
                        instList.forEach((inst) => {
                            const arrearsInfo = calculateInstallmentArrears({ installment: inst, debt });
                            baseAmount += (inst.outstandingReceivablesAmount ?? inst.amount ?? 0);
                            dynamicArrears += arrearsInfo.totalPendingArrears;
                            pendingCapital += (inst.capital ?? 0);
                        });
                    } else {
                        // Si no tenía cuotas pendientes (ej. saldado hoy)
                        baseAmount = totalPaidToday;
                        dynamicArrears = 0;
                    }

                    const totalDueToday = baseAmount + dynamicArrears;

                    let installmentSummary = "";
                    if (instList.length === 1) {
                        installmentSummary = `Cuota #${instList[0].installmentNumber ?? 1}`;
                    } else if (instList.length > 1) {
                        installmentSummary = `${instList.length} cuotas (${instList.map((i) => `#${i.installmentNumber}`).join(", ")})`;
                    } else {
                        installmentSummary = "Pagado hoy";
                    }

                    const dueDate = instList[0]?.paymentDate || instList[0]?.dueDate || targetDate;
                    const customerName = debt?.clientName || instList[0]?.clientName || debtPayments[0]?.clientName || "Cliente";
                    const customerId = debt?.clientId || instList[0]?.clientId || debtPayments[0]?.clientId || "";
                    const debtName = debt?.name || "Crédito";

                    routeCredits.push({
                        debtId,
                        debtName,
                        installmentSummary,
                        installmentsCount: instList.length,
                        installmentId: instList[0]?.id || debtPayments[0]?.installmentId || "",
                        installmentNumber: instList[0]?.installmentNumber ?? 1,
                        customerId,
                        customerName,
                        routeId: route.id,
                        dueDate,
                        baseAmount,
                        pendingCapital,
                        dynamicArrears,
                        totalDueToday,
                        managementStatus,
                        paymentsCount: debtPayments.length,
                        totalPaidToday,
                        paymentDetail,
                        attemptDetail,
                    });
                });

                const totalCredits = routeCredits.length;
                const managedCredits = routeCredits.filter((c) => c.managementStatus === "pagado" || c.managementStatus === "intento").length;
                const pendingCredits = routeCredits.filter((c) => c.managementStatus === "pendiente").length;
                const percentageManaged = totalCredits > 0 ? Math.round((managedCredits / totalCredits) * 100) : 0;
                const totalAmountExpected = routeCredits.reduce((acc, c) => acc + c.totalDueToday, 0);
                const totalAmountCollected = routeCredits.reduce((acc, c) => acc + (c.paymentDetail?.amount ?? 0), 0);

                routesSummary[route.id] = {
                    routeId: route.id,
                    routeName: route.name,
                    totalCredits,
                    managedCredits,
                    pendingCredits,
                    percentageManaged,
                    totalAmountExpected,
                    totalAmountCollected,
                    credits: routeCredits,
                };

                globalTotalCredits += totalCredits;
                globalManagedCredits += managedCredits;
                globalPendingCredits += pendingCredits;
                globalTotalExpected += totalAmountExpected;
                globalTotalCollected += totalAmountCollected;
            });

            const globalPercentage = globalTotalCredits > 0 ? Math.round((globalManagedCredits / globalTotalCredits) * 100) : 0;
            const globalStats: RouteManagementGlobalStats = {
                totalCredits: globalTotalCredits,
                managedCredits: globalManagedCredits,
                pendingCredits: globalPendingCredits,
                percentageManaged: globalPercentage,
                totalAmountExpected: globalTotalExpected,
                totalAmountCollected: globalTotalCollected,
            };

            return ok({
                operations: grouped,
                routes,
                routeManagement: {
                    globalStats,
                    routesSummary,
                },
            });
        } catch (error) {
            console.error("[GetDailyOperationsUseCase]", error);
            return fail({
                code: "UNKNOWN_ERROR",
                message: error instanceof Error ? error.message : "Error desconocido al obtener operaciones del día",
            });
        }
    }
}
