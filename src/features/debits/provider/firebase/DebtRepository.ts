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
    serverTimestamp,
    limit as limitFn,
    Timestamp,
    getFirestore,
    orderBy,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { DebtGateway } from "../../domain/infraestructure/DebtGatweay";
import type { CreateDebtError, CreateDebtUInput, CreateDebtUOutput, createWithInstallmentsInput } from "../../domain/business/useCases/debt/CreateDebtUseCase";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { UpdateDebitInput, UpdateDebitOutput } from "../../domain/business/useCases/debt/UpdateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../../domain/business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../../domain/business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { Debt } from "../../domain/business/entities/Debt";
import type { GetDebtsInput, GetDebtsOutput } from "../../domain/business/useCases/debt/GetDebtsCase";
import type { GetByFiltersError, GetByFiltersInput, GetByFiltersOutput } from "../../domain/business/useCases/debt/GetByFiltersCase";

export class FirebaseDebtRepository implements DebtGateway {

    async getByFilters(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput, GetByFiltersError>> {
        try {
            const { companyId, statuses, customerId, limit } = input
            const constraints = [];

            if (statuses && statuses.length > 0) {
                constraints.push(where("status", "in", statuses));
            }

            if (customerId) {
                constraints.push(where("customerId", "==", customerId));
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
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name as string,
                    customerId: data.customerId as string,
                    customerName: data.customerName as string,
                    totalAmount: data.totalAmount as number,
                    status: data.status,
                    createdAt: data.startDate instanceof Timestamp
                        ? data.startDate.toDate().toISOString().split("T")[0]
                        : data.startDate,
                    clientId: data.clientId,
                    collectorId: data.collectorId,
                    nextPaymentDue:data.startDate instanceof Timestamp
                        ? data.startDate.toDate().toISOString().split("T")[0]
                        : data.startDate,
                    overdueInstallmentsCount:data.overdueInstallmentsCount,
                    costumerDocument: data.costumerDocument,
                    costumerName: data.costumerName,
                    debtTerms: data.debtTerms,
                    firstDueDate: data.firstDueDate,
                    idVisit: data.idVisit,
                    installmentCount: data.installmentCount,
                    interestRate: data.interestRate,
                    startDate: data.startDate,
                    type: data.type
                };
            });

            console.log(listDebts)

            return ok({ state: listDebts })
        } catch (error)  {
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

                /** 🏷️ Nombre secuencial */
                const debtName = `DEBT-${nextDebtNumber}`;

                /** 📌 Crear deuda */
                tx.set(debtRef, {
                    ...input.debt,
                    id: debtId,
                    name: debtName,
                    createdAt: serverTimestamp(),
                });

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

            return ok({ state: null });
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


            const debts: Debt[] = snapshot.docs.map(this.mapFirestoreDebt);
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

    mapFirestoreDebt(
        doc: QueryDocumentSnapshot<DocumentData>
    ): Debt {
        const data = doc.data();
        console.log(data)
        console.log(data.debtTerms)

        return {
            id: doc.id,
            idVisit: data.idVisit ?? "",
            name: data.name ?? "",
            collectorId: data.collectorId ?? "",
            clientId: data.clientId ?? "",

            nextPaymentDue:data.startDate instanceof Timestamp
                        ? data.startDate.toDate().toISOString().split("T")[0]
                        : data.startDate,
                    overdueInstallmentsCount:data.overdueInstallmentsCount,

            costumerName: data.costumerName ?? "",
            costumerDocument: data.costumerDocument ?? "",

            type: data.type ?? "credito",
            debtTerms: data.debtTerms ?? "diario",
            status: data.status ?? "tentativa",

            interestRate: Number(data.interestRate ?? 0),
            totalAmount: Number(data.totalAmount ?? 0),
            installmentCount: Number(data.installmentCount ?? 1),

            startDate: data.startDate ?? "",
            firstDueDate: data.firstDueDate ?? "",

            createdAt:
                typeof data.createdAt === "string"
                    ? data.createdAt
                    : data.createdAt?.toDate?.().toISOString().split("T")[0] ?? "",
        };
    }

    async create(
        input: CreateDebtUInput
    ): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
        try {
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

                tx.set(doc(debtsRef), {
                    ...input.debt,
                    name: debtName,
                    createdAt: serverTimestamp(),
                });
            });

            return ok({ state: null });
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
            // 🔑 Objeto plano, sin id
            // 🔹 TODOS los campos persistibles (sin id)
            const updateData: Partial<Debt> = {
                collectorId: debt.collectorId,
                debtTerms: debt.debtTerms,
                name: debt.name,
                type: debt.type,
                status: debt.status,
                clientId: debt.clientId,
                costumerName: debt.costumerName,
                costumerDocument: debt.costumerDocument,
                totalAmount: debt.totalAmount,
                installmentCount: debt.installmentCount,
                interestRate: debt.interestRate,
                startDate: debt.startDate,
                createdAt: debt.createdAt,
                firstDueDate: debt.firstDueDate,
            };

            await updateDoc(ref, updateData);

            return { state: ok(null) };
        } catch (error) {
            console.log(error)
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
            const data = snapshot.data() as Omit<Debt, "id">;


            return {
                state: ok({
                    id: snapshot.id,
                    ...data,
                }),
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
                const data = doc.data()

                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt instanceof Timestamp
                        ? data.createdAt.toDate().toISOString().split("T")[0]
                        : data.createdAt,

                    startDate: data.startDate instanceof Timestamp
                        ? data.startDate.toDate().toISOString().split("T")[0]
                        : data.startDate,

                    firstDueDate: data.firstDueDate instanceof Timestamp
                        ? data.firstDueDate.toDate().toISOString().split("T")[0]
                        : data.firstDueDate,
                } as Debt;
            });

            return { state: ok(debts) };
        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "UNKNOWN_ERROR" }) };
            }
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }
}

