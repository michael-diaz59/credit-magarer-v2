
import { collection, doc, setDoc, type DocumentData, query, where, getDocs, orderBy, getDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { firestore, storage } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import type { Payroll } from "../domain/business/entities/Payroll";
import type { PayrollGateway } from "../domain/infraestructure/PayrollGateway";
import { encodeDate, decodeDate } from "../../shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebasePayrollRepository implements PayrollGateway {
    
    private payrollToFirestore(payroll: Omit<Payroll, "id">): DocumentData {
        const result: any = { ...payroll };
        if (payroll.createdAt) result.createdAt = encodeDate(payroll.createdAt);
        return removeUndefined(result);
    }

    private documentToPayroll(id: string, data: DocumentData): Payroll {
        return {
            id,
            userId: data.userId ?? "",
            companyId: data.companyId ?? "",
            amount: data.amount ?? 0,
            method: data.method ?? "efectivo",
            status: data.status ?? "registrado",
            idProof: data.idProof ?? "",
            bankAccountId: data.bankAccountId,
            createdAt: decodeDate(data.createdAt),
        };
    }

    generateId(companyId: string): string {
        const refCollection = collection(firestore, "companies", companyId, "payroll");
        return doc(refCollection).id;
    }

    async register(companyId: string, payroll: Payroll): Promise<Result<void, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "payroll", payroll.id);
            const { id, ...data } = payroll;
            await setDoc(refDoc, this.payrollToFirestore(data));
            return ok(undefined);
        } catch (error) {
            console.error("Error registering payroll:", error);
            return fail(error as Error);
        }
    }

    async getPaymentsByUserId(companyId: string, userId: string): Promise<Result<Payroll[], Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "payroll");
            const q = query(refCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => this.documentToPayroll(d.id, d.data()));
            return ok(list);
        } catch (error) {
            console.error("Error getting payroll payments:", error);
            return fail(error as Error);
        }
    }

    async getPaymentById(companyId: string, paymentId: string): Promise<Result<Payroll | null, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "payroll", paymentId);
            const snap = await getDoc(refDoc);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToPayroll(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting payroll payment by id:", error);
            return fail(error as Error);
        }
    }

    async uploadProof(companyId: string, payrollId: string, file: File): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof.${ext}`;
            const path = `companies/${companyId}/payroll/${payrollId}/${fileName}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);
            return ok(fileName);
        } catch (error) {
            console.error("Error uploading payroll proof:", error);
            return fail(error as Error);
        }
    }
}
