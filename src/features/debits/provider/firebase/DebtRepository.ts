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
    writeBatch
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { DebtGateway } from "../../domain/infraestructure/DebtGatweay";
import type { CreateDebtError, CreateDebtUInput, CreateDebtUOutput, createWithInstallmentsInput } from "../../domain/business/useCases/debt/CreateDebtUseCase";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { UpdateDebitInput, UpdateDebitOutput } from "../../domain/business/useCases/debt/UpdateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../../domain/business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../../domain/business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { Debt, DebtStatus } from "../../domain/business/entities/Debt";
import type { GetDebtsInput, GetDebtsOutput } from "../../domain/business/useCases/debt/GetDebtsCase";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../../domain/business/useCases/debt/GetByFiltersCase";
import { DebtToDocumentData, documentToDebt } from "./mapDocumentToDebt";

export class FirebaseDebtRepository implements DebtGateway {

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
                constraints.push(where("customerId", "==", customerId));
                console.log("customerId", customerId)
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
        input: createWithInstallmentsInput
    ): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
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

                /** 📌 Crear deuda */
                tx.set(debtRef, DebtToDocumentData(input.debt));

                /** 📌 Crear cuotas */
                for (const installment of input.installments) {
                    const installmentRef = doc(installmentsCol);

                    tx.set(installmentRef, {
                        ...installment,
                        id: installmentRef.id,
                        debtId,
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

    async create(
        input: CreateDebtUInput
    ): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
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
                where("costumerDocument", "==", input.costumerDocument)
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

    async getDebtsByCollectorAndStatus(input: {
        companyId: string;
        collectorId: string;
        statuses: DebtStatus[];
        dateLimit?: string;
    }): Promise<Result<GetDebtsOutput, any>> {
        try {
            const { companyId, collectorId, statuses, dateLimit } = input;
            const ref = collection(firestore, "companies", companyId, "debts");

            const constraints = [
                where("collectorId", "==", collectorId),
                where("status", "in", statuses),
                where("type", "==", "preparacion")
            ];

            if (dateLimit) {
                constraints.push(where("nextPaymentDue", "<=", dateLimit));
            }

            const q = query(ref, ...constraints);
            const snapshot = await getDocs(q);

            const debts: Debt[] = snapshot.docs.map(doc => documentToDebt(doc));

            return ok({ state: ok(debts) });
        } catch (error) {
            console.error("[getDebtsByCollectorAndStatus]", error);
            return fail({ code: "UNKNOWN_ERROR" });
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
}
