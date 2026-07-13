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
    getAggregateFromServer,
    sum
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
import { encodeDate, decodeDate } from "../../../shared/firebase/codeDecodeTime";
import type { DocumentData } from "firebase/firestore";

/**corregir any y removeUndefined con variable no usada */
export class FirebasePaymentRepository implements PaymentGateway {


    private paymentToFirestore(payment: Omit<Payment, "id">): DocumentData {

        const result: any = payment;

        if (payment.paidAt !== undefined) result.paidAt = encodeDate(payment.paidAt);

        return {
            debtId: payment.debtId,
            idRoute: payment.idRoute,
            isTight: payment.isTight,
            collectorObservation: payment.collectorObservation,
            accountantObservation: payment.accountantObservation,
            installmentId: payment.installmentId,
            costumerName: payment.costumerName,
            collectorName: payment.collectorName,
            collectorId: payment.collectorId,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            paidAt: encodeDate(payment.paidAt),
            location: payment.location,
            bankAccountId: payment.bankAccountId,
            idProofOfPayment: payment.idProofOfPayment,
        }
    }

    private documentToPayment(id: string, data: DocumentData): Payment {
        return {
            id: id,
            debtId: data.debtId ?? "",
            idRoute: data.idRoute ?? "",
            isTight: data.isTight ?? false,
            collectorObservation: data.collectorObservation ?? "",
            accountantObservation: data.accountantObservation ?? "",
            installmentId: data.installmentId ?? "",
            costumerName: data.costumerName ?? "",
            collectorName: data.collectorName ?? "",
            collectorId: data.collectorId ?? "",
            amount: data.amount ?? 0,
            method: data.method ?? "efectivo",
            status: data.status ?? "conflicto",
            paidAt: data.paidAt ? decodeDate(data.paidAt) : "",
            location: data.location,
            bankAccountId: data.bankAccountId,
            idProofOfPayment: data.idProofOfPayment ?? "",
        };
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
            const refDoc = doc(refCollection);

            await setDoc(refDoc, this.paymentToFirestore(payment));

            return ok({ payment: this.documentToPayment(refDoc.id, this.paymentToFirestore(payment)) });

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
                return this.documentToPayment(doc.id, doc.data());
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
                return this.documentToPayment(doc.id, doc.data());
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

            const dataToUpdate = this.paymentToFirestore(payment);
            await setDoc(refDoc, dataToUpdate, { merge: true });

            return ok({ payment: this.documentToPayment(payment.id, dataToUpdate) });

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

            const paymentData = this.documentToPayment(snapshot.id, snapshot.data());
            return ok({ payment: paymentData });

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

            const payments: Payment[] = snapshot.docs.map(doc => this.documentToPayment(doc.id, doc.data()));

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

    async getSumPayments(companyId: string): Promise<Result<number, any>> {
        try {
            const paymentsRef = collection(firestore, "companies", companyId, "payments");
            const snapshot = await getAggregateFromServer(paymentsRef, {
                total: sum("amount")
            });
            return ok(snapshot.data().total || 0);
        } catch (error) {
            console.error("[getSumPayments]", error);
            return fail(error);
        }
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    async createMany(input: {
        companyId: string;
        payments: Payment[];
    }): Promise<Result<void, CreatePaymentError>> {
        try {
            const refCollection = collection(
                firestore,
                "companies",
                input.companyId,
                "payments"
            );

            const chunks = this.chunkArray(input.payments, 200);

            for (const chunk of chunks) {
                const batch = writeBatch(firestore);

                for (const payment of chunk) {
                    const docRef = doc(refCollection);
                    // Asignamos el id generado en Firestore al objeto original en memoria
                    payment.id = docRef.id;

                    batch.set(docRef, this.paymentToFirestore(payment));
                }

                await batch.commit();
            }

            return ok(undefined);
        } catch (error) {
            console.error("Error in createMany payments:", error);
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
}
