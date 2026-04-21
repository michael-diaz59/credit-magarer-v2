
import { collection, doc, setDoc, type DocumentData, Timestamp, query, where, getDocs, orderBy, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import type { FinancialPayment } from "../domain/business/entities/FinancialPayment";
import type FinancialPaymentGateway from "../domain/infraestructure/FinancialPaymentGateway";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebaseFinancialPaymentRepository implements FinancialPaymentGateway {

    private paymentToFirestore(payment: Omit<FinancialPayment, "id">): DocumentData {
        const result: any = { ...payment };
        if (payment.createAt) result.paidAt = Timestamp.fromDate(new Date(payment.createAt));
        return removeUndefined(result);
    }

    private documentToPayment(id: string, data: DocumentData): FinancialPayment {
        return {
            id,
            financialDebtId: data.financialDebtId ?? "",
            amount: data.amount ?? 0,
            createAt: data.paidAt instanceof Timestamp ? data.paidAt.toDate().toISOString() : data.paidAt ?? "",
            method: data.method ?? "efectivo",
            collectorId: data.collectorId ?? "",
            idProofOfPayment: data.idProofOfPayment ?? "",
            location: data.location,
            bankAccountId: data.bankAccountId,
            collectorName: data.collectorName ?? "",
        };
    }

    generateId(companyId: string): string {
        const refCollection = collection(firestore, "companies", companyId, "financialsPayments");
        return doc(refCollection).id;
    }

    async registerPayment(companyId: string, payment: FinancialPayment): Promise<Result<void, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "financialsPayments", payment.id);
            await setDoc(refDoc, this.paymentToFirestore(payment));
            return ok(undefined);
        } catch (error) {
            console.error("Error registering financial payment:", error);
            return fail(error as Error);
        }
    }

    async getPaymentsByDebtId(companyId: string, debtId: string): Promise<Result<FinancialPayment[], Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "financialsPayments");
            const q = query(refCollection, where("financialDebtId", "==", debtId), orderBy("paidAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => this.documentToPayment(d.id, d.data()));
            return ok(list);
        } catch (error) {
            console.error("Error getting financial payments by debt id:", error);
            return fail(error as Error);
        }
    }

    async getPaymentById(companyId: string, paymentId: string): Promise<Result<FinancialPayment | null, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "financialsPayments", paymentId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToPayment(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting financial payment by id:", error);
            return fail(error as Error);
        }
    }

    async uploadProof(companyId: string, paymentId: string, file: File): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof_${Date.now()}.${ext}`;
            const path = `companies/${companyId}/financialsPayments/${paymentId}/${fileName}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            return ok(url); // For payments, we usually store the Full URL
        } catch (error) {
            console.error("Error uploading financial payment proof:", error);
            return fail(error as Error);
        }
    }
}
