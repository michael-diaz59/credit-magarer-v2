import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, type DocumentData } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { firestore, storage } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import { encodeDate, decodeDate } from "../../shared/firebase/codeDecodeTime";
import type { AnotherPayment } from "../domain/business/entities/AnotherPayment";
import type AnotherPaymentGateway from "../domain/infraestructure/AnotherPaymentGateway";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebaseAnotherPaymentRepository implements AnotherPaymentGateway {

    private anotherPaymentToFirestore(payment: Omit<AnotherPayment, "id">): DocumentData {
        return removeUndefined({
            ...payment,
            createdAt: encodeDate(payment.createdAt),
        });
    }

    private documentToAnotherPayment(id: string, data: DocumentData): AnotherPayment {
        return {
            id,
            createdAt: decodeDate(data.createdAt).slice(0, 10),
            amount: data.amount ?? 0,
            method: data.method ?? "efectivo",
            status: data.status ?? "registrado",
            bankAccountId: data.bankAccountId ?? "",
            idProofOfPayment: data.idProofOfPayment ?? "",
            observations: data.observations ?? "",
            userId: data.userId ?? "",
            category: data.category ?? "other",
        };
    }

    async create(companyId: string, payment: Omit<AnotherPayment, "id">, file?: File): Promise<Result<string, Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "anotherPayments");
            const docRef = doc(refCollection);
            const id = docRef.id;

            let idProofOfPayment = payment.idProofOfPayment;

            if (file) {
                const uploadResult = await this.uploadProof(companyId, id, file);
                if (uploadResult.ok) {
                    idProofOfPayment = uploadResult.value;
                }
            }

            const data = this.anotherPaymentToFirestore({ ...payment, idProofOfPayment });
            await setDoc(docRef, { ...data, id });

            return ok(id);
        } catch (error) {
            console.error("Error creating another payment:", error);
            return fail(error as Error);
        }
    }

    async update(companyId: string, payment: AnotherPayment, file?: File): Promise<Result<void, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "anotherPayments", payment.id);

            let idProofOfPayment = payment.idProofOfPayment;

            if (file) {
                const uploadResult = await this.uploadProof(companyId, payment.id, file);
                if (uploadResult.ok) {
                    idProofOfPayment = uploadResult.value;
                }
            }

            const { id, ...paymentData } = payment;
            const data = this.anotherPaymentToFirestore({ ...paymentData, idProofOfPayment });
            await setDoc(docRef, data, { merge: true });

            return ok(undefined);
        } catch (error) {
            console.error("Error updating another payment:", error);
            return fail(error as Error);
        }
    }

    async getAll(companyId: string): Promise<Result<AnotherPayment[], Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "anotherPayments");
            const q = query(refCollection, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => this.documentToAnotherPayment(d.id, d.data()));
            return ok(list);
        } catch (error) {
            console.error("Error getting all another payments:", error);
            return fail(error as Error);
        }
    }

    async getById(companyId: string, id: string): Promise<Result<AnotherPayment | null, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "anotherPayments", id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToAnotherPayment(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting another payment by id:", error);
            return fail(error as Error);
        }
    }

    async delete(companyId: string, id: string): Promise<Result<void, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "anotherPayments", id);
            await deleteDoc(docRef);
            return ok(undefined);
        } catch (error) {
            console.error("Error deleting another payment:", error);
            return fail(error as Error);
        }
    }

    private async uploadProof(companyId: string, anotherPaymentId: string, file: File): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof_${Date.now()}.${ext}`;
            const path = `companies/${companyId}/anotherPayments/${anotherPaymentId}/${fileName}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);

            return ok(fileName);
        } catch (error) {
            console.error("Error uploading another payment proof:", error);
            return fail(error as Error);
        }
    }
}
