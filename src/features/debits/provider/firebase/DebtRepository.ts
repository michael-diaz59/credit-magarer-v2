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
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { DebtGateway } from "../../domain/infraestructure/DebtGatweay";
import type { CreateDebtUInput, CreateDebtUOutput } from "../../domain/business/useCases/debt/CreateDebtUseCase";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok } from "../../../../core/helpers/ResultC";
import type { UpdateDebitInput, UpdateDebitOutput } from "../../domain/business/useCases/debt/UpdateDebtUseCase";
import type { GetDebitByIdInput, GetDebitByIdOutput } from "../../domain/business/useCases/debt/GetDebitByIdCase";
import type { GetDebstByCostumerDocumentInput, GetDebstByCostumerDocumentOutput } from "../../domain/business/useCases/debt/GetDebstByCostumerDocumentCase";
import type { Debt } from "../../domain/business/entities/Debt";
import type { GetDebtsInput, GetDebtsOutput } from "../../domain/business/useCases/debt/GetDebtsCase";

export class FirebaseDebtRepository implements DebtGateway {
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

            return {
                state: ok(debts),
            };

        } catch (error) {
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

            name: data.name ?? "",
            collectorId: data.collectorId ?? "",
            clientId: data.clientId ?? "",

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
): Promise<CreateDebtUOutput> {
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

    return { state: ok(null) };
  } catch (error) {
    if (error instanceof FirebaseError) {
      return { state: fail({ code: "NETWORK_ERROR" }) };
    }
    return { state: fail({ code: "UNKNOWN_ERROR" }) };
  }
}

    async update(
        input: UpdateDebitInput
    ): Promise<UpdateDebitOutput> {
        try {
            const { debt } = input;
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

            const q = query(
                ref,
                where("costumerDocument", "==", input.costumerDocument)
            );

            const snapshot = await getDocs(q);

            const debts: Debt[] = snapshot.docs.map((doc) => {
                const data = doc.data() as Omit<Debt, "id">;

                return {
                    id: doc.id,
                    ...data,
                };
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

