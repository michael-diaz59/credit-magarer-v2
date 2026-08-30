import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc, type DocumentData } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { firestore, storage } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import { encodeDate, decodeDate } from "../../../core/shared/firebase/codeDecodeTime";
import type { TaxtPayment } from "../domain/business/entities/TaxtPayment";
import type TaxtGateway from "../domain/infraestructure/TaxtGateway";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebaseTaxtRepository implements TaxtGateway {

    private taxtPaymentToFirestore(payment: Omit<TaxtPayment, "id">): DocumentData {
        return removeUndefined({
            ...payment,
            createdAt: encodeDate(payment.createdAt),
        });
    }

    private documentToTaxtPayment(id: string, data: DocumentData): TaxtPayment {
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
        };
    }

    async create(companyId: string, payment: Omit<TaxtPayment, "id">, file?: File): Promise<Result<string, Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "taxtPayments");
            const docRef = doc(refCollection);
            const id = docRef.id;

            let idProofOfPayment = payment.idProofOfPayment;

            if (file) {
                const uploadResult = await this.uploadProof(companyId, id, file);
                if (uploadResult.ok) {
                    idProofOfPayment = uploadResult.value;
                }
            }

            const data = this.taxtPaymentToFirestore({ ...payment, idProofOfPayment });
            await setDoc(docRef, { ...data, id });

            return ok(id);
        } catch (error) {
            console.error("Error creating taxt payment:", error);
            return fail(error as Error);
        }
    }

    async update(companyId: string, payment: TaxtPayment, file?: File): Promise<Result<void, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "taxtPayments", payment.id);

            let idProofOfPayment = payment.idProofOfPayment;

            if (file) {
                const uploadResult = await this.uploadProof(companyId, payment.id, file);
                if (uploadResult.ok) {
                    idProofOfPayment = uploadResult.value;
                }
            }

            const { id, ...paymentData } = payment;
            const data = this.taxtPaymentToFirestore({ ...paymentData, idProofOfPayment });
            await setDoc(docRef, data, { merge: true });

            return ok(undefined);
        } catch (error) {
            console.error("Error updating taxt payment:", error);
            return fail(error as Error);
        }
    }

    async getAll(companyId: string): Promise<Result<TaxtPayment[], Error>> {
        try {
            const refCollection = collection(firestore, "companies", companyId, "taxtPayments");
            const q = query(refCollection, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => this.documentToTaxtPayment(d.id, d.data()));
            return ok(list);
        } catch (error) {
            console.error("Error getting all taxt payments:", error);
            return fail(error as Error);
        }
    }

    async getById(companyId: string, id: string): Promise<Result<TaxtPayment | null, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "taxtPayments", id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToTaxtPayment(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting taxt payment by id:", error);
            return fail(error as Error);
        }
    }

    async delete(companyId: string, id: string): Promise<Result<void, Error>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "taxtPayments", id);
            await deleteDoc(docRef);
            return ok(undefined);
        } catch (error) {
            console.error("Error deleting taxt payment:", error);
            return fail(error as Error);
        }
    }

    private async uploadProof(companyId: string, taxtPaymentId: string, file: File): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof_${Date.now()}.${ext}`;
            const path = `companies/${companyId}/taxtPayments/${taxtPaymentId}/${fileName}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);

            return ok(fileName);
        } catch (error) {
            console.error("Error uploading taxt payment proof:", error);
            return fail(error as Error);
        }
    }
}
