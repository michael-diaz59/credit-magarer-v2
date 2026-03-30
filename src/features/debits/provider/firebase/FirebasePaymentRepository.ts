import {
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    writeBatch,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { firestore, storage } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { GetPaymentsByInstallmentInput, GetPaymentsByInstallmentOutput } from "../../domain/business/useCases/payment/GetPaymentsByInstallmentCaseTypes";
import type { PaymentGateway } from "../../domain/infraestructure/PaymentGateway";
import type { CreatePaymentInput, CreatePaymentOutput, CreatePaymentError } from "../../domain/business/useCases/payment/CreatePayment";
import type { GetPaymentInput, GetPaymentOutput, GetPaymentError } from "../../domain/business/useCases/payment/GetPaymentByIdCase";
import type { DeletePaymentError, DeletePaymentInput, DeletePaymentOutput } from "../../domain/business/useCases/payment/DeletePaymentCase";
import type { Payment } from "../../domain/business/entities/Payment";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { UpdatePaymentInput, UpdatePaymentOutput, UpdatePaymentError } from "../../domain/business/useCases/payment/UpdatePaymentStatusUseCase";
import type { UpdateMultiplePaymentsIsTightError } from "../../domain/business/useCases/payment/UpdateMultiplePaymentsIsTight";
import type { GetPaymentsByStatusInput, GetPaymentsByStatusOutput } from "../../domain/business/useCases/payment/GetPaymentsByStatusUseCase";

/**corregir any y removeUndefined con variable no usada */
export class FirebasePaymentRepository implements PaymentGateway {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeUndefined<T extends Record<string, any>>(obj: T): T {
        return Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(obj).filter(([_, value]) => value !== undefined)
        ) as T;
    }



    generateId(companyId: string): string {
        const refCollection = collection(
            firestore,
            "companies",
            companyId,
            "payments"
        );
        return doc(refCollection).id;
    }

    async uploadProof(
        file: File,
        companyId: string,
        paymentId: string
    ): Promise<Result<string, Error>> {
        try {
            const ext = file.name.split(".").pop();
            const path = `companies/${companyId}/payments/${paymentId}/proof.${ext}`;
            const fileRef = ref(storage, path);

            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            return ok(url);
        } catch (error) {
            console.error("Error uploading proof:", error);
            if (error instanceof Error) {
                return fail(error);
            }
            return fail(new Error("Unknown upload error"));
        }
    }

    async create(
        input: CreatePaymentInput
    ): Promise<Result<CreatePaymentOutput, CreatePaymentError>> {
        const { companyId, payment } = input;

        try {
            const refCollection = collection(
                firestore,
                "companies",
                companyId,
                "payments"
            );

            // Use existing ID if provided, otherwise generate new one
            const refDoc = payment.id
                ? doc(refCollection, payment.id)
                : doc(refCollection);

            const paymentWithId: Payment = {
                ...payment,
                id: refDoc.id,
            };

            // 🔥 LIMPIAR undefined (clave)
            const cleanPayment = this.removeUndefined(paymentWithId);

            await setDoc(refDoc, cleanPayment);

            return ok({ payment: cleanPayment });

        } catch (error) {
            console.error("Error creating payment:", error);

            if (error instanceof FirebaseError) {
                if (error.code === "permission-denied") {
                    return fail({ code: "FORBIDDEN" });
                }
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async delete(
        input: DeletePaymentInput
    ): Promise<Result<DeletePaymentOutput, DeletePaymentError>> {
        const { companyId, paymentId } = input;

        try {
            const ref = doc(
                firestore,
                "companies",
                companyId,
                "payments",
                paymentId
            );

            await deleteDoc(ref);

            return ok({ success: true });

        } catch (error) {
            console.error("Error deleting payment:", error);
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
                if (error.code === "permission-denied") {
                    return fail({ code: "FORBIDDEN" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getByInstallment(input: GetPaymentsByInstallmentInput): Promise<GetPaymentsByInstallmentOutput> {
        try {
            const { companyId, installmentId } = input
            const paymentsRef = collection(firestore, `companies/${companyId}/payments`)
            const q = query(paymentsRef, where("installmentId", "==", installmentId))
            const snapshot = await getDocs(q)

            const payments: Payment[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                } as Payment
            })

            return {
                state: ok(payments),
            }

        } catch (error) {
            console.error(error)
            return {
                state: fail({ code: "UNKNOWN_ERROR" }),
            }
        }
    }

    async getByStatus(input: GetPaymentsByStatusInput): Promise<GetPaymentsByStatusOutput> {
        try {
            const { companyId, status } = input
            const paymentsRef = collection(firestore, `companies/${companyId}/payments`)
            const q = query(paymentsRef, where("status", "==", status))
            const snapshot = await getDocs(q)

            const payments: Payment[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                } as Payment
            })

            return {
                state: ok(payments),
            }

        } catch (error) {
            console.error(error)
            return {
                state: fail({ code: "UNKNOWN_ERROR" }),
            }
        }
    }

    async update(input: UpdatePaymentInput): Promise<Result<UpdatePaymentOutput, UpdatePaymentError>> {
        const { companyId, payment } = input;
        try {
            console.log("update payment", payment)
            const refDoc = doc(
                firestore,
                "companies",
                companyId,
                "payments",
                payment.id
            );

            const cleanPayment = this.removeUndefined(payment);
            await setDoc(refDoc, cleanPayment, { merge: true });

            return ok({ payment: cleanPayment });

        } catch (error) {
            console.error("Error updating payment:", error);

            if (error instanceof FirebaseError) {
                if (error.code === "permission-denied") {
                    return fail({ code: "NETWORK_ERROR" }); // Assuming we want minimal error tracking
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getById(
        input: GetPaymentInput
    ): Promise<Result<GetPaymentOutput, GetPaymentError>> {
        const { companyId, paymentId } = input;

        try {
            const ref = doc(
                firestore,
                "companies",
                companyId,
                "payments",
                paymentId
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                return ok({ payment: null });
            }

            const payment = snapshot.data() as Payment;
            return ok({ payment });

        } catch (error) {
            console.error("Error getting payment:", error);
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getAllByDate(companyId: string, date: string): Promise<Result<Payment[], any>> {
        try {
            console.log("[FirebasePaymentRepository.getAllByDate]", companyId, date);
            const ref = collection(firestore, "companies", companyId, "payments");

            // Calculamos el límite del día siguiente para el rango
            const nextDayDate = new Date(date);
            nextDayDate.setDate(nextDayDate.getDate() + 1);
            const nextDay = nextDayDate.toISOString().split("T")[0];

            const q = query(
                ref,
                where("paidAt", ">=", date),
                where("paidAt", "<", nextDay)
            );

            const snapshot = await getDocs(q);

            const payments: Payment[] = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as Payment));

            console.log("[FirebasePaymentRepository.getAllByDate]", payments);

            return ok(payments);
        } catch (error) {
            console.error("[FirebasePaymentRepository.getAllByDate]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
    async updateMultipleIsTight(companyId: string, paymentIds: string[]): Promise<Result<void, UpdateMultiplePaymentsIsTightError>> {
        try {
            const batch = writeBatch(firestore);
            const refCollection = collection(firestore, "companies", companyId, "payments");

            for (const id of paymentIds) {
                const refDoc = doc(refCollection, id);
                batch.update(refDoc, { isTight: true });
            }

            await batch.commit();
            return ok(undefined);
        } catch (error) {
            console.error("Error updated payments isTight:", error);
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
