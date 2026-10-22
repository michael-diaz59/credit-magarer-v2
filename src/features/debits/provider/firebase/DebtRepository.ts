import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    type DocumentData,
    QueryDocumentSnapshot,
    runTransaction,
    increment,
    limit as limitFn,
    getFirestore,
    orderBy,
    getAggregateFromServer,
    sum,
    writeBatch,
    QueryConstraint,
    Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { DebtGateway, GetDebtsByRouteAndStatusError, GetDebtsForPreparationGateInput, GoToActivateGateInput, MarkAsPaidGateInput } from "../../domain/infraestructure/DebtGatweay";
import type { CreateDebtError2, CreateDebtUInput2, CreateDebtUOutput2, CreateWithInstallmentsInput2 } from "../../domain/business/useCases/debt/CreateDebtUseCase2";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { UpdateDebitInput, UpdateDebitOutput } from "../../domain/business/useCases/debt/UpdateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../../domain/business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../../domain/business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { Debt, DebtStatus, DebtType } from "../../domain/business/entities/Debt";
import type { GetDebtsInput, GetDebtsOutput } from "../../domain/business/useCases/debt/GetDebtsCase";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../../domain/business/useCases/debt/GetByFiltersCase";
import type { UpdateDebtStatusInput, UpdateDebtStatusOutput, UpdateDebtStatusError } from "../../domain/business/useCases/debt/UpdateDebtStatusUseCase";
import { calculateDatesOfDebts } from "../../scripts/createDebtExcel";
import { InstallmentToDocument } from "./FirebaseInstallmentRepository";
import type { MarkAsPaidError, MarkAsPaidOutput } from "../../domain/business/useCases/debt/MarkAsPaidUseCase";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";
import { decodeDate, encodeDate } from "../../../../core/shared/firebase/codeDecodeTime";
import type { GetDebtsForPreparationError, GetDebtsForPreparationOutput } from "../../domain/business/useCases/debt/GetDebtsForPreparationCase";
import type { GoToActivateOutput, GoToActivateError } from "../../domain/business/useCases/debt/GoToActivateUseCase";

export class FirebaseDebtRepository implements DebtGateway {

    async goToActivate(input: GoToActivateGateInput): Promise<Result<GoToActivateOutput, GoToActivateError>> {
        try {
            const db = getFirestore();

            const debtRef = doc(
                db,
                "companies",
                input.companyId,
                "debts",
                input.debtId,
            );

            const installmentsCol = collection(
                db,
                "companies",
                input.companyId,
                "installments"
            );

            await runTransaction(db, async (tx) => {

                tx.set(debtRef, {
                    isLife: true,
                    status: "activa",
                });

                /** 📌 Crear cuotas */
                for (const installment of input.installments) {
                    installment.debtId = input.debtId
                    const installmentRef = doc(installmentsCol);

                    tx.set(installmentRef, {
                        ...InstallmentToDocument(installment),
                    });
                }
            });

            return ok({ state: null });
        } catch (error) {
            console.error("[createWithInstallments]", error);

            if (error instanceof FirebaseError) {
                return fail({ code: "ERROR_DEBT_UPDATE" });
            }

            return fail({ code: "ERROR_DEBT_UPDATE" });
        }
    }

    async goToReactivate(input: GoToActivateGateInput): Promise<Result<GoToActivateOutput, GoToActivateError>> {
        try {
            const db = getFirestore();

            const debtRef = doc(
                db,
                "companies",
                input.companyId,
                "debts",
                input.debtId,
            );

            await runTransaction(db, async (tx) => {

                tx.set(debtRef, {
                    isLife: true,
                    status: "activa",
                });
            });

            const installmentRef = collection(
                firestore,
                "companies",
                input.companyId,
                "installments",
            );

            const installmentQuery = query(
                installmentRef,
                where('debtId', '==', input.debtId),
                where('status', '==', 'inactivo'),
            );

            const snapshot = await getDocs(installmentQuery);

            let updatedCount = 0;

            for (let i = 0; i < snapshot.docs.length; i += 400) {
                const batch = writeBatch(db);

                const documents = snapshot.docs.slice(i, i + 400);

                for (const document of documents) {
                    batch.update(document.ref, {
                        estado: 'pendiente',
                    });
                }

                await batch.commit();

                updatedCount += documents.length;
            }

            return ok({ state: null });
        } catch (error) {
            console.error("[createWithInstallments]", error);

            if (error instanceof FirebaseError) {
                return fail({ code: "ERROR_DEBT_UPDATE" });
            }

            return fail({ code: "ERROR_DEBT_UPDATE" });
        }
    }

    async getDebtsForPreparation(input: GetDebtsForPreparationGateInput): Promise<Result<GetDebtsForPreparationOutput, GetDebtsForPreparationError>> {
        try {
            const { companyId, delivered, deliveredStatus } = input;
            const ref = collection(
                firestore,
                "companies",
                companyId,
                "debts",
            );
            const snapshot = await getDocs(query(
                ref,
                where("delivered", "==", delivered),
                where("deliveredStatus", "==", deliveredStatus),
            ));
            const debts: Debt[] = snapshot.docs.map((doc) => documentToDebt({ ...doc.data(), id: doc.id }));
            return ok({ state: debts });
        } catch (error) {
            console.error("[GetDebtsForPreparation]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }


    async markAsPaid(input: MarkAsPaidGateInput): Promise<Result<MarkAsPaidOutput, MarkAsPaidError>> {
        try {
            const { companyId, auditorNotes, newStatus, debtId } = input

            const ref = doc(
                firestore,
                "companies",
                companyId,
                "debts",
                debtId,
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                return fail({ code: "DEBT_NOT_FOUND" });
            }

            await updateDoc(ref, {
                status: newStatus,
                auditorNotes: auditorNotes,
                closedAt: Timestamp.now(),
            });

            return ok({
                state: null,
            });
        } catch (error) {
            console.log(error);

            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getByFilters(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput, GetByFiltersError>> {
        try {
            const { companyId, statuses, customerId, idVisit, limit, delivered, deliveredStatus } = input
            console.log("input", input)
            const constraints = [];

            if (statuses && statuses.length > 0) {
                constraints.push(where("status", "in", statuses));
                console.log("statuses", statuses)
            }

            if (delivered !== undefined && delivered !== null) {
                constraints.push(where("delivered", "==", delivered));
                console.log("delivered", delivered)
            }

            if (deliveredStatus !== undefined && deliveredStatus !== null) {
                constraints.push(where("deliveredStatus", "==", deliveredStatus));
                console.log("deliveredStatus", deliveredStatus)
            }

            if (customerId) {
                constraints.push(where("clientId", "==", customerId));
                console.log("clientId", customerId)
            }

            if (idVisit) {
                constraints.push(where("idVisit", "==", idVisit));
                console.log("idVisit", idVisit)
            }

            if (input.delivered !== undefined && input.delivered !== null) {
                constraints.push(where("delivered", "==", input.delivered));
                console.log("delivered", input.delivered)
            }


            constraints.push(orderBy("createdAt", "desc"));

            if (limit) {
                constraints.push(limitFn(limit));
            }


            const q = query(
                collection(
                    firestore,
                    "companies",
                    companyId,
                    "debts"
                ),
                ...constraints
            );

            const snap = await getDocs(q);

            const listDebts: Debt[] = snap.docs.map((doc) => {
                return documentToDebt({ ...doc.data(), id: doc.id });
            });

            console.log("getByFilters")

            console.log(listDebts)

            return ok({ state: listDebts })
        } catch (error) {
            console.error("[createWithInstallments]", error);

            if (error instanceof FirebaseError) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }



    async createWithInstallments(
        input: CreateWithInstallmentsInput2
    ): Promise<Result<CreateDebtUOutput2, CreateDebtError2>> {
        try {
            let debtNameOut = ""
            let debtIdOut = ""
            const db = getFirestore();

            const countersRef = doc(
                db,
                "companies",
                input.companyId,
                "metadata",
                "counters"
            );

            const debtsCol = collection(
                db,
                "companies",
                input.companyId,
                "debts"
            );

            const installmentsCol = collection(
                db,
                "companies",
                input.companyId,
                "installments"
            );

            await runTransaction(db, async (tx) => {
                /** 🔢 Counter */
                const counterSnap = await tx.get(countersRef);

                let nextDebtNumber = 1;

                if (counterSnap.exists()) {
                    const current = counterSnap.data().debtCount ?? 0;
                    nextDebtNumber = current + 1;

                    tx.update(countersRef, {
                        debtCount: increment(1),
                    });
                } else {
                    tx.set(countersRef, {
                        debtCount: 1,
                    });
                }

                /** 🆔 Auto ID */
                const debtRef = doc(debtsCol);
                const debtId = debtRef.id;
                debtIdOut = debtId;

                /** 🏷️ Nombre secuencial */
                const debtName = `${nextDebtNumber}`;
                debtNameOut = debtName
                input.debt.name = debtName

                console.log("input.debt", input.debt.name)
                /** 📌 Crear deuda */
                tx.set(debtRef, DebtToDocumentData(input.debt));

                /** 📌 Crear cuotas */
                for (const installment of input.installments) {
                    installment.debtId = debtId;
                    installment.debtName = debtName;
                    const installmentRef = doc(installmentsCol);

                    tx.set(installmentRef, {
                        ...InstallmentToDocument(installment),
                    });
                }
            });

            return ok({ debtName: debtNameOut, debtId: debtIdOut });
        } catch (error) {
            console.error("[createWithInstallments]", error);

            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getDebts(input: GetDebtsInput): Promise<GetDebtsOutput> {
        try {
            const { companyId, collectorId } = input;

            const debtsRef = collection(
                firestore,
                "companies",
                companyId,
                "debts"
            );

            const q = collectorId
                ? query(debtsRef, where("collectorId", "==", collectorId))
                : query(debtsRef);

            const snapshot = await getDocs(q);


            const debts: Debt[] = snapshot.docs.map(item => documentToDebt(item.data(), item.id));
            console.log(debts)
            return {
                state: ok(debts),
            };

        } catch (error) {
            console.log(error)
            if (error instanceof FirebaseError) {
                return {
                    state: fail({ code: "NETWORK_ERROR" }),
                };
            }

            return {
                state: fail({ code: "UNKNOWN_ERROR" }),
            };
        }
    }

    async reserveDebtNumbers(
        companyId: string,
        quantity: number
    ): Promise<Result<number[], CreateDebtError2>> {
        try {
            const countersRef = doc(
                firestore,
                "companies",
                companyId,
                "metadata",
                "counters"
            );

            const numbers = await runTransaction(
                firestore,
                async (tx) => {
                    const snap = await tx.get(countersRef);

                    const current = snap.exists()
                        ? snap.data().debtCount ?? 0
                        : 0;

                    const start = current + 1;
                    const end = current + quantity;

                    tx.set(
                        countersRef,
                        {
                            debtCount: end,
                        },
                        { merge: true }
                    );

                    return Array.from(
                        { length: quantity },
                        (_, i) => start + i
                    );
                }
            );

            return ok(numbers);
        } catch (error) {
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    chunkArray<T>(
        array: T[],
        size: number
    ): T[][] {
        const result: T[][] = [];

        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }

        return result;
    }



    async createMany(
        input: {
            companyId: string;
            debts: Debt[];
        }
    ): Promise<Result<void, CreateDebtError2>> {
        try {
            const debtsRef = collection(
                firestore,
                "companies",
                input.companyId,
                "debts"
            );

            // Reservar números UNA SOLA VEZ
            const reserveResult = await this.reserveDebtNumbers(
                input.companyId,
                input.debts.length
            );

            if (!reserveResult.ok) {
                return fail(reserveResult.error);
            }

            const numbers = reserveResult.value;

            const chunks = this.chunkArray(input.debts, 200);

            let globalIndex = 0;

            for (const chunk of chunks) {
                const batch = writeBatch(firestore);

                for (const debt of chunk) {
                    const debtRef = doc(debtsRef);

                    const debtNumber = numbers[globalIndex];

                    const debtName = `DEBT-${debtNumber}`;

                    // Asignamos el id y el name al objeto original en memoria
                    // para que el código que llamó a esta función pueda usarlos.
                    debt.id = debtRef.id;
                    console.log("debt id", debt.id);
                    debt.name = debtName;

                    batch.set(
                        debtRef,
                        DebtToDocumentData(debt)
                    );

                    globalIndex++;
                }

                await batch.commit();
            }

            return ok(undefined);
        } catch (error) {
            console.error(error);

            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async create(
        input: CreateDebtUInput2
    ): Promise<Result<CreateDebtUOutput2, CreateDebtError2>> {
        try {
            let debtNameOut = ""
            let debtIdOut = ""
            const countersRef = doc(
                firestore,
                "companies",
                input.companyId,
                "metadata",
                "counters"
            );

            const debtsRef = collection(
                firestore,
                "companies",
                input.companyId,
                "debts"
            );

            await runTransaction(firestore, async (tx) => {
                const countersSnap = await tx.get(countersRef);

                let nextDebtNumber = 1;

                if (countersSnap.exists()) {
                    const current = countersSnap.data().debtCount ?? 0;
                    nextDebtNumber = current + 1;

                    tx.update(countersRef, {
                        debtCount: increment(1),
                    });
                } else {
                    tx.set(countersRef, {
                        debtCount: 1,
                    });
                }

                const debtName = `DEBT-${nextDebtNumber}`;
                debtNameOut = debtName

                const debtRef = doc(debtsRef);
                const debtId = debtRef.id;
                debtIdOut = debtId;
                input.debt.name = nextDebtNumber.toString();

                tx.set(debtRef, DebtToDocumentData(input.debt));
            });

            return ok({ debtName: debtNameOut, debtId: debtIdOut });
        } catch (error) {
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }



    async update(
        input: UpdateDebitInput
    ): Promise<UpdateDebitOutput> {
        try {

            const { debt } = input;
            console.log(debt)
            const ref = doc(
                firestore,
                "companies",
                input.companyId,
                "debts",
                input.debt.id
            );
            console.log("startDate: ", debt.startDate)

            await updateDoc(ref, DebtToDocumentData(debt));

            return { state: ok(null) };
        } catch (error) {
            console.log(error)
            console.log("debt", input.debt)
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "UNKNOWN_ERROR" }) };
            }
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }

    async updateStatus(
        input: UpdateDebtStatusInput
    ): Promise<Result<UpdateDebtStatusOutput, UpdateDebtStatusError>> {
        try {
            const { companyId, idDebt, debtStatus } = input;

            const ref = doc(
                firestore,
                "companies",
                companyId,
                "debts",
                idDebt
            );

            console.log("ref", ref)
            console.log("debtStatus", debtStatus)

            await updateDoc(ref, {
                status: debtStatus
            });

            return ok({ success: true });
        } catch (error) {
            console.error("[updateStatus]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async migrateDeliveredStatus(
        companyId: string
    ) {
        try {
            const debtsRef = collection(
                firestore,
                "companies",
                companyId,
                "debts"
            );

            console.log("Obteniendo créditos...");

            const snap = await getDocs(debtsRef);

            console.log(
                `Se encontraron ${snap.size} créditos`
            );

            const docs = snap.docs;

            const chunks = this.chunkArray(docs, 500);

            let updated = 0;

            for (const chunk of chunks) {
                const batch = writeBatch(firestore);

                for (const debtDoc of chunk) {
                    const ref = doc(
                        firestore,
                        "companies",
                        companyId,
                        "debts",
                        debtDoc.id
                    );

                    batch.update(ref, {
                        deliveredStatus: "entregado",
                    });

                    updated++;
                }

                await batch.commit();

                console.log(
                    `${updated} créditos actualizados`
                );
            }

            console.log(
                "Migración completada correctamente"
            );

            return ok(true);

        } catch (error) {
            console.error(
                "Error actualizando deliveredStatus",
                error
            );

            return ok(true);
        }
    }
    async getAll(companyId: string): Promise<Debt[]> {
        const ref = collection(
            firestore,
            "companies",
            companyId,
            "debts"
        );

        const snapshot = await getDocs(ref);

        return snapshot.docs.map((doc) => documentToDebt(doc, doc.id));
    }

    async updateAllDebts(
        companyId: string,
    ): Promise<void> {
        try {
            const refCollection = collection(
                firestore,
                "companies",
                companyId,
                "debts",
            );

            const snapshot = await getDocs(refCollection);

            const debts = snapshot.docs.map((doc) => documentToDebt(doc));

            const chunks = this.chunkArray(debts, 200);

            let totalUpdated = 0;

            for (const chunk of chunks) {
                const batch = writeBatch(firestore);

                for (const debt of chunk) {
                    calculateDatesOfDebts(debt);
                    const updatedDebt = debt

                    const ref = doc(
                        firestore,
                        "companies",
                        companyId,
                        "debts",
                        debt.id,
                    );

                    batch.update(ref, {
                        totalInterest:
                            updatedDebt.interest,

                        totalAmount:
                            updatedDebt.amount,

                        remainingToCompleteCredit:
                            updatedDebt.remainingAmountToPay,

                        capitalPaid:
                            updatedDebt.percentageOfCapitalPaid,

                        interestPaid:
                            updatedDebt.percentageOfInteresPaid,

                        creditPaid:
                            updatedDebt.percentageOfAmountPaid,
                        totalPaymentForLate:
                            updatedDebt.arrearsPaid,
                    });
                    totalUpdated++;
                }

                await batch.commit();
            }
            console.log(`Deudas actualizadas: ${totalUpdated}`);

            return
        } catch (error) {
            console.error("Error actualizando deudas:", error);
            return
        }
    }




    async getById(
        input: GetDebitByIdInput
    ): Promise<GetDebitByIdOutput> {
        try {
            const ref = doc(
                firestore,
                "companies",
                input.companyId,
                "debts",
                input.idDebt
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                console.log("deuda no encontrada")
                return {

                    state: ok(null)
                };
            }
            const data = snapshot.data();
            if (!data) return { state: ok(null) };

            const debt: Debt = documentToDebt(snapshot)

            return {
                state: ok(debt),
            };
        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "UNKNOWN_ERROR" }) };
            }
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }

    async getBycostumerDocument(
        input: GetDebstByCostumerDocumentInput
    ): Promise<GetDebstByCostumerDocumentOutput> {
        try {
            const ref = collection(
                firestore,
                "companies",
                input.companyId,
                "debts"
            );
            console.log("buscando deudas del cliente con cc" + input.costumerDocument)

            const q = query(
                ref,
                where("clientDocument", "==", input.costumerDocument)
            );

            const snapshot = await getDocs(q);

            const debts: Debt[] = snapshot.docs.map((doc) => {
                return documentToDebt(doc)
            });

            return { state: ok(debts) };
        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "UNKNOWN_ERROR" }) };
            }
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }

    /**
     * 
     * @param input esta funcion devuelve debts con fecha menor o igual a la actual
     * @returns 
     */
    async getDebtsByRouteAndStatus(input: {
        companyId: string;
        routeIds: string[];
        statuses: DebtStatus[];
        dateLimit?: string;
    }): Promise<Result<GetDebtsOutput, GetDebtsByRouteAndStatusError>> {
        try {
            const { companyId, routeIds, statuses, dateLimit } = input;

            if (routeIds.length === 0 || statuses.length === 0) {
                return ok({ state: ok([]) });
            }

            const ref = collection(firestore, "companies", companyId, "debts");

            // Firestore permite máximo 30 elementos en un "in"
            const chunkSize = 30;
            const routeChunks: string[][] = [];

            for (let i = 0; i < routeIds.length; i += chunkSize) {
                routeChunks.push(routeIds.slice(i, i + chunkSize));
            }

            // Ejecutamos una query por cada status para respetar la regla de Firestore de un solo operador 'in'
            const snapshots = await Promise.all(
                routeChunks.flatMap((routes) =>
                    statuses.map(async (status) => {
                        const constraints: QueryConstraint[] = [
                            where("delivered", "==", true),
                            where("status", "==", status),
                        ];

                        if (routes.length === 1) {
                            constraints.push(where("routeId", "==", routes[0]));
                        } else {
                            constraints.push(where("routeId", "in", routes));
                        }

                        if (dateLimit) {
                            const [year, month, day] = dateLimit.split("-").map(Number);
                            const endOfLimit = new Date(year, month - 1, day, 23, 59, 59, 999);
                            const timestampLimit = Timestamp.fromDate(endOfLimit);
                            constraints.push(where("nextPaymentDue", "<=", timestampLimit));
                        }

                        const q = query(ref, ...constraints);
                        return getDocs(q);
                    })
                )
            );

            const debts = snapshots.flatMap((snapshot) =>
                snapshot.docs.map((doc) => documentToDebt(doc))
            );

            return ok({
                state: ok(debts),
            });
        } catch (error) {
            console.error("[getDebtsByRouteAndStatus]", error);
            return fail({
                code: "UNKNOWN_ERROR",
            });
        }
    }

    async getDebtsByRoute(input: {
        companyId: string;
        routeId: string;
    }): Promise<Result<Debt[], any>> {
        try {
            const { companyId, routeId } = input;
            const ref = collection(firestore, "companies", companyId, "debts");
            const q = query(ref, where("routeId", "==", routeId));
            const snapshot = await getDocs(q);

            const debts: Debt[] = snapshot.docs.map((doc) =>
                documentToDebt(doc as QueryDocumentSnapshot<DocumentData>)
            );

            return ok(debts);
        } catch (error) {
            console.error("[getDebtsByRoute]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getSumOfDeliveredCapital(companyId: string): Promise<Result<number, any>> {
        try {
            const ref = collection(firestore, "companies", companyId, "debts");
            const q = query(
                ref,
                where("delivered", "==", true)
            );

            const snapshot = await getAggregateFromServer(q, {
                totalCapital: sum("capital")
            });

            return ok(snapshot.data().totalCapital);
        } catch (error) {
            console.error("[getSumOfDeliveredCapital]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async confirmDebtsDelivery(input: { companyId: string, debtIds: string[] }): Promise<Result<null, any>> {
        try {
            const { companyId, debtIds } = input;
            const db = getFirestore();
            const batch = writeBatch(db);

            for (const debtId of debtIds) {
                const ref = doc(db, "companies", companyId, "debts", debtId);
                batch.update(ref, { delivered: true, deliveredStatus: "entregado", status: "activa" });
            }

            await batch.commit();

            return ok(null);
        } catch (error) {
            console.error("[confirmDebtsDelivery]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getSumOfRenewalPayment(companyId: string): Promise<Result<number, any>> {
        try {
            const ref = collection(firestore, "companies", companyId, "debts");

            const snapshot = await getAggregateFromServer(ref, {
                totalRenewals: sum("renewalPayment")
            });

            return ok(snapshot.data().totalRenewals);
        } catch (error) {
            console.error("[getSumOfRenewalPayment]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getDebtsByIds(input: {
        companyId: string;
        debtIds: string[];
    }): Promise<Result<Debt[], { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" }>> {
        try {
            const { companyId, debtIds } = input;
            if (!debtIds || debtIds.length === 0) {
                return ok([]);
            }

            const uniqueIds = Array.from(new Set(debtIds)).filter(Boolean);
            const docPromises = uniqueIds.map(async (id) => {
                const debtRef = doc(firestore, "companies", companyId, "debts", id);
                const snap = await getDoc(debtRef);
                if (snap.exists()) {
                    return documentToDebt(snap.data(), snap.id);
                }
                return null;
            });

            const results = await Promise.all(docPromises);
            const debts: Debt[] = results.filter((d): d is Debt => d !== null);

            return ok(debts);
        } catch (error) {
            console.error("[getDebtsByIds]", error);
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}

export function documentToDebt(
    doc: DocumentData,
    id?: string,
): Debt {
    const data =
        typeof doc === "object" &&
            doc !== null &&
            "data" in doc &&
            typeof doc.data === "function"
            ? doc.data()
            : doc;

    const documentId =
        typeof doc === "object" &&
            doc !== null &&
            "id" in doc &&
            typeof doc.id === "string"
            ? doc.id
            : (id ?? "");

    const result: Debt = {
        // ---------------------------------------------------------
        // IDENTIFICACIÓN Y RUTA
        // ---------------------------------------------------------
        id: documentId,
        name: data.name ?? "",
        lateInterestRate: data.lateInterestRate ?? 0,
        type: data.type ?? "fijo",
        status: data.status ?? "tentativa",
        isLife: data.isLife ?? false,

        routeId: data.routeId ?? "",
        routeName: data.routeName ?? "",
        idVisit: data.idVisit,
        prepayment: data.prepayment,

        // ---------------------------------------------------------
        // CLIENTE
        // ---------------------------------------------------------
        clientId: data.clientId ?? "",
        clientName: data.clientName ?? "",
        clientDocument: data.clientDocument ?? "",

        // ---------------------------------------------------------
        // CONDICIONES FINANCIERAS
        // ---------------------------------------------------------
        debtTerms: data.debtTerms ?? "diario",
        daysPerMonth: data.daysPerMonth ?? 30,

        interestRate: data.interestRate ?? 0,

        capital: data.capital ?? 0,
        interest: data.interest ?? 0,
        amount: data.amount ?? 0,
        arrears: data.arrears ?? 0,
        deferment: data.deferment ?? 0,
        total: data.total ?? 0,

        processingFee: data.processingFee ?? 0,

        // ---------------------------------------------------------
        // DESEMBOLSO
        // ---------------------------------------------------------
        delivered: data.delivered ?? false,
        deliveredStatus: data.deliveredStatus ?? "false_preparacion",

        // ---------------------------------------------------------
        // PRENDA
        // ---------------------------------------------------------
        pledge: data.pledge ?? false,
        pledgeDescription: data.pledgeDescription,
        pledgeValue: data.pledgeValue,

        // ---------------------------------------------------------
        // PAGOS
        // ---------------------------------------------------------
        capitalPaid: data.capitalPaid ?? 0,
        interestPaid: data.interestPaid ?? 0,
        amountPaid: data.amountPaid ?? 0,
        arrearsPaid: data.arrearsPaid ?? 0,
        defermentPaid: data.defermentPaid ?? 0,
        totalPaid: data.totalPaid ?? 0,

        // ---------------------------------------------------------
        // SALDOS
        // ---------------------------------------------------------
        remainingCapitalToPay:
            data.remainingCapitalToPay ?? 0,

        remainingInterestToPay:
            data.remainingInterestToPay ?? 0,

        remainingAmountToPay:
            data.remainingAmountToPay ?? 0,

        remainingArrearsToPay:
            data.remainingArrearsToPay ?? 0,

        remainingDefermentToPay:
            data.remainingDefermentToPay ?? 0,

        remainingTotalToPay:
            data.remainingTotalToPay ?? 0,

        // ---------------------------------------------------------
        // PORCENTAJES
        // ---------------------------------------------------------
        percentageOfCapitalPaid:
            data.percentageOfCapitalPaid ?? 100,

        percentageOfInteresPaid:
            data.percentageOfInteresPaid ?? 100,

        percentageOfAmountPaid:
            data.percentageOfAmountPaid ?? 100,

        porcentageOfArrearsPaid:
            data.porcentageOfArrearsPaid ?? 100,

        percentageOfDefermentPaid:
            data.percentageOfDefermentPaid ?? 100,

        percentageOfTotalPaid:
            data.percentageOfTotalPaid ?? 100,

        // ---------------------------------------------------------
        // SALDOS PENDIENTES DE COBRO
        // ---------------------------------------------------------
        outstandingReceivables:
            data.outstandingReceivables ?? 0,

        outstandingReceivablesAmount:
            data.outstandingReceivablesAmount ?? 0,

        outstandingReceivablesDeferment:
            data.outstandingReceivablesDeferment ?? 0,

        outstandingReceivablesArrears:
            data.outstandingReceivablesArrears ?? 0,

        // ---------------------------------------------------------
        // MORA
        // ---------------------------------------------------------
        numberOfArrearsInstallments:
            data.numberOfArrearsInstallments ?? 0,

        numberOfArrearsDays:
            data.numberOfArrearsDays ?? 0,

        requiredArrears:
            data.requiredArrears ?? "no",

        requiredState:
            data.requiredState ?? false,

        maxNumberOfArrearsDays:
            data.maxNumberOfArrearsDays ?? 0,

        totalArrearsDays:
            data.totalArrearsDays ?? 0,

        // ---------------------------------------------------------
        // CUOTAS Y FECHAS
        // ---------------------------------------------------------
        installmentCount:
            data.installmentCount ?? 0,

        installmentsPaid:
            data.installmentsPaid ?? 0,

        createdAt:
            decodeDate(data.createdAt),

        startDate:
            decodeDate(data.startDate),

        nextPaymentDue:
            decodeDate(data.nextPaymentDue),

        dateLastPayment:
            data.dateLastPayment
                ? decodeDate(data.dateLastPayment)
                : undefined,

        expectedEndDate:
            decodeDate(data.expectedEndDate),

        closedAt:
            data.closedAt
                ? decodeDate(data.closedAt)
                : undefined,

        // ---------------------------------------------------------
        // RENOVACIONES
        // ---------------------------------------------------------
        renewalPayment:
            data.renewalPayment ?? 0,

        originalDebt:
            data.originalDebt,

        renewedToDebtId:
            data.renewedToDebtId,

        // ---------------------------------------------------------
        // OBSERVACIONES
        // ---------------------------------------------------------
        collectorNotes:
            data.collectorNotes,

        auditorNotes:
            data.auditorNotes,

        accountantNotes:
            data.accountantNotes,

        advisorOfficeNotes:
            data.advisorOfficeNotes,

        advisorOfficeId:
            data.advisorOfficeId,

        advisorFieldNotes:
            data.advisorFieldNotes,

        advisorFieldId:
            data.advisorFieldId,
    };

    return result;
}

export function DebtToDocumentData(
    debt: Omit<Debt, "id">,
): DocumentData {
    const result = {
        // ---------------------------------------------------------
        // IDENTIFICACIÓN Y RUTA
        // ---------------------------------------------------------
        name: debt.name,
        lateInterestRate: debt.lateInterestRate,
        type: debt.type,
        status: debt.status,
        isLife: debt.isLife,

        routeId: debt.routeId,
        routeName: debt.routeName,
        idVisit: debt.idVisit,
        prepayment: debt.prepayment,

        // ---------------------------------------------------------
        // CLIENTE
        // ---------------------------------------------------------
        clientId: debt.clientId,
        clientName: debt.clientName,
        clientDocument: debt.clientDocument,

        // ---------------------------------------------------------
        // CONDICIONES FINANCIERAS
        // ---------------------------------------------------------
        debtTerms: debt.debtTerms,
        daysPerMonth: debt.daysPerMonth,

        interestRate: debt.interestRate,

        capital: debt.capital,
        interest: debt.interest,
        amount: debt.amount,
        arrears: debt.arrears,
        deferment: debt.deferment,
        total: debt.total,

        processingFee: debt.processingFee,

        // ---------------------------------------------------------
        // DESEMBOLSO
        // ---------------------------------------------------------
        delivered: debt.delivered,
        deliveredStatus: debt.deliveredStatus,

        // ---------------------------------------------------------
        // PRENDA
        // ---------------------------------------------------------
        pledge: debt.pledge,
        pledgeDescription: debt.pledgeDescription,
        pledgeValue: debt.pledgeValue,

        // ---------------------------------------------------------
        // PAGOS
        // ---------------------------------------------------------
        capitalPaid: debt.capitalPaid,
        interestPaid: debt.interestPaid,
        amountPaid: debt.amountPaid,
        arrearsPaid: debt.arrearsPaid,
        defermentPaid: debt.defermentPaid,
        totalPaid: debt.totalPaid,

        // ---------------------------------------------------------
        // SALDOS
        // ---------------------------------------------------------
        remainingCapitalToPay:
            debt.remainingCapitalToPay,

        remainingInterestToPay:
            debt.remainingInterestToPay,

        remainingAmountToPay:
            debt.remainingAmountToPay,

        remainingArrearsToPay:
            debt.remainingArrearsToPay,

        remainingDefermentToPay:
            debt.remainingDefermentToPay,

        remainingTotalToPay:
            debt.remainingTotalToPay,

        // ---------------------------------------------------------
        // PORCENTAJES
        // ---------------------------------------------------------
        percentageOfCapitalPaid:
            debt.percentageOfCapitalPaid,

        percentageOfInteresPaid:
            debt.percentageOfInteresPaid,

        percentageOfAmountPaid:
            debt.percentageOfAmountPaid,

        porcentageOfArrearsPaid:
            debt.porcentageOfArrearsPaid,

        percentageOfDefermentPaid:
            debt.percentageOfDefermentPaid,

        percentageOfTotalPaid:
            debt.percentageOfTotalPaid,

        // ---------------------------------------------------------
        // SALDOS PENDIENTES DE COBRO
        // ---------------------------------------------------------
        outstandingReceivables:
            debt.outstandingReceivables,

        outstandingReceivablesAmount:
            debt.outstandingReceivablesAmount,

        outstandingReceivablesDeferment:
            debt.outstandingReceivablesDeferment,

        outstandingReceivablesArrears:
            debt.outstandingReceivablesArrears,

        // ---------------------------------------------------------
        // MORA
        // ---------------------------------------------------------
        numberOfArrearsInstallments:
            debt.numberOfArrearsInstallments,

        numberOfArrearsDays:
            debt.numberOfArrearsDays,

        requiredArrears:
            debt.requiredArrears,

        requiredState:
            debt.requiredState,

        maxNumberOfArrearsDays:
            debt.maxNumberOfArrearsDays,

        totalArrearsDays:
            debt.totalArrearsDays,

        // ---------------------------------------------------------
        // CUOTAS Y FECHAS
        // ---------------------------------------------------------
        installmentCount:
            debt.installmentCount,

        installmentsPaid:
            debt.installmentsPaid,

        createdAt:
            encodeDate(debt.createdAt),

        startDate:
            encodeDate(debt.startDate),

        nextPaymentDue:
            encodeDate(debt.nextPaymentDue),

        dateLastPayment:
            debt.dateLastPayment
                ? encodeDate(debt.dateLastPayment)
                : null,

        expectedEndDate:
            encodeDate(debt.expectedEndDate),

        closedAt:
            debt.closedAt
                ? encodeDate(debt.closedAt)
                : null,

        // ---------------------------------------------------------
        // RENOVACIONES
        // ---------------------------------------------------------
        renewalPayment:
            debt.renewalPayment,

        originalDebt:
            debt.originalDebt,

        renewedToDebtId:
            debt.renewedToDebtId,

        // ---------------------------------------------------------
        // OBSERVACIONES
        // ---------------------------------------------------------
        collectorNotes:
            debt.collectorNotes,

        auditorNotes:
            debt.auditorNotes,

        accountantNotes:
            debt.accountantNotes,

        advisorOfficeNotes:
            debt.advisorOfficeNotes,

        advisorOfficeId:
            debt.advisorOfficeId,

        advisorFieldNotes:
            debt.advisorFieldNotes,

        advisorFieldId:
            debt.advisorFieldId,
    };

    return removeUndefined(result);
}

export function transformacionType(type: string): DebtType {
    if (type === "credito") return "fijo"
    if (type === "variable") return "variable"
    return "fijo"
}
