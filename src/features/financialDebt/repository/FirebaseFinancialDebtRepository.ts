
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, runTransaction, increment, type DocumentData, Timestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { firestore, storage } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import { encodeDate, decodeDate } from "../../shared/firebase/codeDecodeTime";
import type { FinancialDebt } from "../domain/business/entities/FinancialDebt";
import type FinancialDebtGateway from "../domain/infraestructure/FinancialDebtGateway";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebaseFinancialDebtRepository implements FinancialDebtGateway {

    private financialDebtToFirestore(debt: Omit<FinancialDebt, "id" | "name">): DocumentData {
        const result: any = { ...debt };
        if (debt.createdAt) result.createdAt = encodeDate(debt.createdAt);
        if (debt.startDate) result.startDate = encodeDate(debt.startDate);
        return removeUndefined(result);
    }

    private documentToFinancialDebt(id: string, data: DocumentData): FinancialDebt {
        const nameVal = data.name ?? "0";
        return {
            id: id,
            name: `financiamiento-${nameVal}`,
            amount: data.amount ?? 0,
            installmentAmount: data.installmentAmount ?? 0,
            periocidad: data.periocidad ?? "mensual",
            startDate: data.startDate ? decodeDate(data.startDate).slice(0, 10) : "",
            idProof: data.idProof ?? "",
            createdAt: data.createdAt ? decodeDate(data.createdAt).slice(0, 10) : "",
        };
    }

    generateId(companyId: string): string {
        const refCollection = collection(firestore, "companies", companyId, "financialDebts");
        return doc(refCollection).id;
    }

    async create(companyId: string, financialDebt: FinancialDebt): Promise<Result<void, Error>> {
        try {
            const countersRef = doc(firestore, "companies", companyId, "metadata", "counters");
            const debtsRef = collection(firestore, "companies", companyId, "financialDebts");
            const debtRef = doc(debtsRef);

            await runTransaction(firestore, async (tx) => {
                const counterSnap = await tx.get(countersRef);
                let nextNumber = 1;

                if (counterSnap.exists()) {
                    nextNumber = (counterSnap.data().financialDebtCount ?? 0) + 1;
                    tx.update(countersRef, { financialDebtCount: increment(1) });
                } else {
                    tx.set(countersRef, { financialDebtCount: 1 }, { merge: true });
                }

                const data = this.financialDebtToFirestore(financialDebt);
                tx.set(debtRef, {
                    ...data,
                    id: debtRef.id,
                    name: String(nextNumber),
                    createdAt: Timestamp.now() // Use server timestamp for creation
                });
            });

            return ok(undefined);
        } catch (error) {
            console.error("Error creating financial debt:", error);
            return fail(error as Error);
        }
    }

    async update(companyId: string, financialDebt: FinancialDebt): Promise<Result<void, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "financialDebts", financialDebt.id);
            // We don't update 'name' or 'createdAt' as they are metadata
            const { name, createdAt, id, ...updatableData } = financialDebt;
            await setDoc(refDoc, this.financialDebtToFirestore(updatableData as any), { merge: true });
            return ok(undefined);
        } catch (error) {
            console.error("Error updating financial debt:", error);
            return fail(error as Error);
        }
    }

    async getAll(companyId: string): Promise<Result<FinancialDebt[], Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "financialDebts");
            const q = query(refCollection, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => this.documentToFinancialDebt(d.id, d.data()));
            return ok(list);
        } catch (error) {
            console.error("Error getting all financial debts:", error);
            return fail(error as Error);
        }
    }

    async getById(companyId: string, id: string): Promise<Result<FinancialDebt | null, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "financialDebts", id);
            const snap = await getDoc(refDoc);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToFinancialDebt(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting financial debt by id:", error);
            return fail(error as Error);
        }
    }

    async uploadProof(companyId: string, financialDebtId: string, file: File): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof_${Date.now()}.${ext}`;
            const path = `companies/${companyId}/FinancialDebt/${financialDebtId}/${fileName}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);

            return ok(fileName);
        } catch (error) {
            console.error("Error uploading financial debt proof:", error);
            return fail(error as Error);
        }
    }
}
