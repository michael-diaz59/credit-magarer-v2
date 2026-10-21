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
    sum,
    runTransaction,
    type DocumentData,
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
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { UpdatePaymentInput, UpdatePaymentOutput, UpdatePaymentError } from "../../domain/business/useCases/payment/UpdatePaymentStatusUseCase";
import type { UpdateMultiplePaymentsIsTightError } from "../../domain/business/useCases/payment/UpdateMultiplePaymentsIsTight";
import type { GetPaymentsByStatusInput, GetPaymentsByStatusOutput } from "../../domain/business/useCases/payment/GetPaymentsByStatusUseCase";
import { encodeDate, decodeDate } from "../../../../core/shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";
import type { Installment } from "../../domain/business/entities/Installment";
import type { Debt } from "../../domain/business/entities/Debt";
import type { BankAccount } from "../../../bankAccounts/domain/business/entities/BankAccount";
import { documentToDebt } from "./DebtRepository";
import { DocumentToInstallment } from "./FirebaseInstallmentRepository";
import type {
    RegisterPaymentRepositoryInput,
    RegisterPaymentRepositoryOutput,
    RegisterPaymentRepositoryError,
    RegisterCashPaymentRepositoryInput,
    RegisterCashPaymentRepositoryOutput,
    RegisterCashPaymentRepositoryError,
    RegisterCascadingPaymentRepositoryInput,
    RegisterCascadingPaymentRepositoryOutput,
    RegisterCascadingPaymentRepositoryError
} from "../../domain/infraestructure/PaymentGateway";
import { DocumentToBankAccount } from "../../../bankAccounts/provider/firebase/BankAccountRepository";


export class FirebasePaymentRepository implements PaymentGateway {

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

    async deleteProof(
        companyId: string,
        paymentId: string,
        fileName: string
    ): Promise<void> {
        try {
            const ext = fileName.split(".").pop();
            const path = `companies/${companyId}/payments/${paymentId}/proof.${ext}`;
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
        } catch (error) {
            console.error("Error deleting proof:", error);
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

            await setDoc(refDoc, paymentToFirestore(payment));

            return ok({ payment: documentToPayment(refDoc.id, paymentToFirestore(payment)) });

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
                return documentToPayment(doc.id, doc.data());
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
                return documentToPayment(doc.id, doc.data());
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

            const dataToUpdate = paymentToFirestore(payment);
            await setDoc(refDoc, dataToUpdate, { merge: true });

            return ok({ payment: documentToPayment(payment.id, dataToUpdate) });

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

            const paymentData = documentToPayment(snapshot.id, snapshot.data());
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

            const payments: Payment[] = snapshot.docs.map(doc => documentToPayment(doc.id, doc.data()));

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

                    batch.set(docRef, paymentToFirestore(payment));
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

    async registerCashPayment(
        input: RegisterCashPaymentRepositoryInput
    ): Promise<Result<RegisterCashPaymentRepositoryOutput, RegisterCashPaymentRepositoryError>> {
        const {
            companyId,
            payment,
            collectorId,
            expectedInstallmentState,
            expectedDebtState,
            installmentOutstandingReceivables,
            debtOutstandingReceivables
        } = input;

        try {
            const installmentRef = doc(
                firestore,
                "companies",
                companyId,
                "installments",
                payment.installmentId
            );

            const debtRef = doc(firestore, "companies", companyId, "debts", payment.debtId);

            const paymentRef = doc(
                firestore,
                "companies",
                companyId,
                "payments",
                payment.id
            );

            const userRef = collectorId
                ? doc(firestore, "companies", companyId, "users", collectorId)
                : null;

            let installmentEntity: Installment | null = null;
            let debtEntity: Debt | null = null;
            let finalCollectorAmount: number | undefined = undefined;

            await runTransaction(firestore, async (tx) => {
                const installmentDocTx = await tx.get(installmentRef);
                if (!installmentDocTx.exists()) {
                    throw new Error("INSTALLMENT_NOT_FOUND");
                }
                installmentEntity = DocumentToInstallment(installmentDocTx.id, installmentDocTx.data() || {});

                const debtDocTx = await tx.get(debtRef);
                if (!debtDocTx.exists()) {
                    throw new Error("DEBT_NOT_FOUND");
                }
                debtEntity = documentToDebt(debtDocTx.data(), debtDocTx.id);

                let userUpdateData: {
                    totalAmount: number;
                    capitalAmount: number;
                    interestAmount: number;
                    arrearsAmount: number;
                    defermentAmount: number;
                } | null = null;

                if (userRef) {
                    const userDocTx = await tx.get(userRef);
                    if (!userDocTx.exists()) {
                        throw new Error("USER_NOT_FOUND");
                    }
                    const currentTotalAmount = userDocTx.data().totalAmount ?? 0;
                    const capitalCurrentAmount = userDocTx.data().capitalAmount ?? 0;
                    const interestCurrentAmount = userDocTx.data().interestAmount ?? 0;
                    const arrearsCurrentAmount = userDocTx.data().arrearsAmount ?? 0;
                    const defermentCurrentAmount = userDocTx.data().defermentAmount ?? 0;
                    finalCollectorAmount = currentTotalAmount + payment.amount;

                    userUpdateData = {
                        totalAmount: currentTotalAmount + payment.amount,
                        capitalAmount: capitalCurrentAmount + payment.capitalPaid,
                        interestAmount: interestCurrentAmount + payment.interestPaid,
                        arrearsAmount: arrearsCurrentAmount + payment.arrearsPaid,
                        defermentAmount: defermentCurrentAmount + payment.defermentPaid,
                    };
                }

                if (
                    installmentEntity.capitalPaid !== expectedInstallmentState.capitalPaid ||
                    installmentEntity.interestPaid !== expectedInstallmentState.interestPaid ||
                    installmentEntity.arrearsPaid !== expectedInstallmentState.arrearsPaid ||
                    installmentEntity.defermentPaid !== expectedInstallmentState.defermentPaid
                ) {
                    throw new Error("INSTALLMENT_STATE_MISMATCH");
                }

                if (
                    debtEntity.capitalPaid !== expectedDebtState.capitalPaid ||
                    debtEntity.interestPaid !== expectedDebtState.interestPaid ||
                    debtEntity.arrearsPaid !== expectedDebtState.arrearsPaid ||
                    debtEntity.defermentPaid !== expectedDebtState.defermentPaid
                ) {
                    throw new Error("DEBT_STATE_MISMATCH");
                }

                if (userRef && userUpdateData) {
                    tx.update(userRef, userUpdateData);
                }

                tx.set(paymentRef, paymentToFirestore(payment));

                tx.update(installmentRef, {
                    outstandingReceivables: installmentOutstandingReceivables.outstandingReceivables,
                    outstandingReceivablesAmount: installmentOutstandingReceivables.outstandingReceivablesAmount,
                    outstandingReceivablesArrears: installmentOutstandingReceivables.outstandingReceivablesArrears,
                    outstandingReceivablesDeferment: installmentOutstandingReceivables.outstandingReceivablesDeferment
                });

                tx.update(debtRef, {
                    outstandingReceivables: debtOutstandingReceivables.outstandingReceivables,
                    outstandingReceivablesAmount: debtOutstandingReceivables.outstandingReceivablesAmount,
                    outstandingReceivablesArrears: debtOutstandingReceivables.outstandingReceivablesArrears,
                    outstandingReceivablesDeferment: debtOutstandingReceivables.outstandingReceivablesDeferment
                });
            });

            if (!installmentEntity || !debtEntity) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return ok({
                payment: payment,
                installment: installmentEntity,
                debt: debtEntity,
                newCollectorAmount: finalCollectorAmount,
            });
        } catch (error) {
            console.error("[registerCashPayment]", error);
            if (error instanceof Error) {
                if (error.message === "DEBT_NOT_FOUND") {
                    return fail({ code: "DEBT_NOT_FOUND" });
                }
                if (error.message === "INSTALLMENT_NOT_FOUND") {
                    return fail({ code: "INSTALLMENT_NOT_FOUND" });
                }
                if (error.message === "USER_NOT_FOUND") {
                    return fail({ code: "USER_NOT_FOUND" });
                }
                if (error.message === "INSTALLMENT_STATE_MISMATCH") {
                    return fail({ code: "INSTALLMENT_STATE_MISMATCH" });
                }
                if (error.message === "DEBT_STATE_MISMATCH") {
                    return fail({ code: "DEBT_STATE_MISMATCH" });
                }
            }
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }


    async registerPayment(
        input: RegisterPaymentRepositoryInput
    ): Promise<Result<RegisterPaymentRepositoryOutput, RegisterPaymentRepositoryError>> {
        const {
            companyId,
            payment,
            bankAccount,
            expectedInstallmentState,
            expectedDebtState,
            installmentOutstandingReceivables,
            debtOutstandingReceivables
        } = input;

        try {
            const installmentRef = doc(
                firestore,
                "companies",
                companyId,
                "installments",
                payment.installmentId
            );

            const debtRef = doc(firestore, "companies", companyId, "debts", payment.debtId);

            const paymentRef = doc(
                firestore,
                "companies",
                companyId,
                "payments",
                payment.id
            );

            const bankAccountRef = bankAccount
                ? doc(
                    firestore,
                    "companies",
                    companyId,
                    "bankAccounts",
                    bankAccount.id
                )
                : null;

            let installmentEntity: Installment | null = null;
            let debtEntity: Debt | null = null;
            let bankAccountEntity: BankAccount | null = null;

            await runTransaction(firestore, async (tx) => {

                const installmentDocTx = await tx.get(installmentRef);
                if (!installmentDocTx.exists()) {
                    throw new Error("INSTALLMENT_NOT_FOUND");
                }
                installmentEntity = DocumentToInstallment(installmentDocTx.id, installmentDocTx.data() || {});

                const debtDocTx = await tx.get(debtRef);
                if (!debtDocTx.exists()) {
                    throw new Error("DEBT_NOT_FOUND");
                }
                debtEntity = documentToDebt(debtDocTx.data(), debtDocTx.id);

                let newMonto: number | undefined = undefined;
                if (bankAccountRef && bankAccount) {
                    const bankAccountDocTx = await tx.get(bankAccountRef);
                    if (!bankAccountDocTx.exists()) {
                        throw new Error("BANK_ACCOUNT_NOT_FOUND");
                    }
                    bankAccountEntity = DocumentToBankAccount(bankAccountDocTx.id, bankAccountDocTx.data() || {});

                    const currentMonto = bankAccountEntity.monto;
                    newMonto = currentMonto + payment.amount;
                }

                if (installmentEntity.capitalPaid !== expectedInstallmentState.capitalPaid ||
                    installmentEntity.interestPaid !== expectedInstallmentState.interestPaid ||
                    installmentEntity.arrearsPaid !== expectedInstallmentState.arrearsPaid ||
                    installmentEntity.defermentPaid !== expectedInstallmentState.defermentPaid) {

                    throw new Error("INSTALLMENT_STATE_MISMATCH");

                }

                if (debtEntity.capitalPaid !== expectedDebtState.capitalPaid ||
                    debtEntity.interestPaid !== expectedDebtState.interestPaid ||
                    debtEntity.arrearsPaid !== expectedDebtState.arrearsPaid ||
                    debtEntity.defermentPaid !== expectedDebtState.defermentPaid) {

                    throw new Error("DEBT_STATE_MISMATCH");
                }

                if (bankAccountRef && newMonto !== undefined) {
                    tx.update(bankAccountRef, { monto: newMonto });
                }

                tx.set(paymentRef, paymentToFirestore(payment));

                tx.update(installmentRef, {
                    outstandingReceivables: installmentOutstandingReceivables.outstandingReceivables,
                    outstandingReceivablesAmount: installmentOutstandingReceivables.outstandingReceivablesAmount,
                    outstandingReceivablesArrears: installmentOutstandingReceivables.outstandingReceivablesArrears,
                    outstandingReceivablesDeferment: installmentOutstandingReceivables.outstandingReceivablesDeferment
                });

                tx.update(debtRef, {
                    outstandingReceivables: debtOutstandingReceivables.outstandingReceivables,
                    outstandingReceivablesAmount: debtOutstandingReceivables.outstandingReceivablesAmount,
                    outstandingReceivablesArrears: debtOutstandingReceivables.outstandingReceivablesArrears,
                    outstandingReceivablesDeferment: debtOutstandingReceivables.outstandingReceivablesDeferment
                });
            });

            if (!installmentEntity || !debtEntity) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return ok({
                payment: payment,
                installment: installmentEntity,
                debt: debtEntity,
                bankAccount: bankAccountEntity ?? undefined,
            });
        } catch (error) {
            console.error("[registerPayment]", error);
            if (error instanceof Error) {
                if (error.message === "DEBT_NOT_FOUND") {
                    return fail({ code: "DEBT_NOT_FOUND" });
                }
                if (error.message === "INSTALLMENT_NOT_FOUND") {
                    return fail({ code: "INSTALLMENT_NOT_FOUND" });
                }
                if (error.message === "BANK_ACCOUNT_NOT_FOUND") {
                    return fail({ code: "BANK_ACCOUNT_NOT_FOUND" });
                }
                if (error.message === "INSTALLMENT_STATE_MISMATCH") {
                    return fail({ code: "INSTALLMENT_STATE_MISMATCH" });
                }
                if (error.message === "DEBT_STATE_MISMATCH") {
                    return fail({ code: "DEBT_STATE_MISMATCH" });
                }
            }
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async registerCascadingPayment(
        input: RegisterCascadingPaymentRepositoryInput
    ): Promise<Result<RegisterCascadingPaymentRepositoryOutput, RegisterCascadingPaymentRepositoryError>> {
        const {
            companyId,
            debt,
            items,
            collectorId,
            totalCollected,
            capitalCollected,
            interestCollected,
            arrearsCollected,
            defermentCollected,
            method,
            bankAccount,
        } = input;

        try {
            const debtRef = doc(firestore, "companies", companyId, "debts", debt.id);
            const userRef = collectorId
                ? doc(firestore, "companies", companyId, "users", collectorId)
                : null;
            const bankAccountRef = bankAccount?.id
                ? doc(firestore, "companies", companyId, "bankAccounts", bankAccount.id)
                : null;

            let finalCollectorAmount: number | undefined = undefined;
            let finalBankAccount: BankAccount | undefined = undefined;

            await runTransaction(firestore, async (tx) => {
                // ==========================================
                // FASE 1: TODAS LAS LECTURAS (READS FIRST)
                // ==========================================

                // 1. Validar que la deuda existe
                const debtDocTx = await tx.get(debtRef);
                if (!debtDocTx.exists()) {
                    throw new Error("DEBT_NOT_FOUND");
                }

                // 2. Leer datos del Cobrador (si es efectivo)
                let userDocTxData: DocumentData | null = null;
                if (method === "efectivo" && userRef) {
                    const userDocTx = await tx.get(userRef);
                    if (!userDocTx.exists()) {
                        throw new Error("USER_NOT_FOUND");
                    }
                    userDocTxData = userDocTx.data();
                }

                // 3. Leer datos de Cuenta bancaria (si es consignación)
                let bankAccountDocTxData: DocumentData | null = null;
                if (method === "consignacion" && bankAccountRef) {
                    const bankDocTx = await tx.get(bankAccountRef);
                    if (!bankDocTx.exists()) {
                        throw new Error("BANK_ACCOUNT_NOT_FOUND");
                    }
                    bankAccountDocTxData = bankDocTx.data() || {};
                }

                // 4. Leer TODAS las cuotas impactadas antes de escribir
                const installmentItemsToUpdate: Array<{
                    item: (typeof items)[number];
                    installmentRef: ReturnType<typeof doc>;
                }> = [];

                for (const item of items) {
                    const installmentRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "installments",
                        item.installment.id
                    );
                    const instDocTx = await tx.get(installmentRef);
                    if (!instDocTx.exists()) {
                        throw new Error("INSTALLMENT_NOT_FOUND");
                    }
                    installmentItemsToUpdate.push({ item, installmentRef });
                }

                // ==========================================
                // FASE 2: TODAS LAS ESCRITURAS (WRITES AFTER)
                // ==========================================

                // 1. Actualizar Cobrador (si es efectivo)
                if (method === "efectivo" && userRef && userDocTxData) {
                    const currentTotalAmount = userDocTxData.totalAmount ?? 0;
                    const capitalCurrentAmount = userDocTxData.capitalAmount ?? 0;
                    const interestCurrentAmount = userDocTxData.interestAmount ?? 0;
                    const arrearsCurrentAmount = userDocTxData.arrearsAmount ?? 0;
                    const defermentCurrentAmount = userDocTxData.defermentAmount ?? 0;

                    finalCollectorAmount = currentTotalAmount + totalCollected;
                    tx.update(userRef, {
                        totalAmount: currentTotalAmount + totalCollected,
                        capitalAmount: capitalCurrentAmount + capitalCollected,
                        interestAmount: interestCurrentAmount + interestCollected,
                        arrearsAmount: arrearsCurrentAmount + arrearsCollected,
                        defermentAmount: defermentCurrentAmount + defermentCollected,
                    });
                }

                // 2. Actualizar Cuenta bancaria (si es consignación)
                if (method === "consignacion" && bankAccountRef && bankAccountDocTxData) {
                    const bankAccountEntity = DocumentToBankAccount(bankAccountRef.id, bankAccountDocTxData);
                    const newBalance = bankAccountEntity.monto + totalCollected;
                    tx.update(bankAccountRef, {
                        monto: newBalance,
                    });
                    finalBankAccount = {
                        ...bankAccountEntity,
                        monto: newBalance,
                    };
                }

                // 3. Actualizar cada cuota impactada y crear su registro Payment
                for (const { item, installmentRef } of installmentItemsToUpdate) {
                    // Actualizar cuota con SOLO sus saldos pendientes por cobrar
                    tx.update(installmentRef, {
                        outstandingReceivables: item.installment.outstandingReceivables,
                        outstandingReceivablesAmount: item.installment.outstandingReceivablesAmount,
                        outstandingReceivablesArrears: item.installment.outstandingReceivablesArrears,
                        outstandingReceivablesDeferment: item.installment.outstandingReceivablesDeferment,
                    });

                    // Registrar documento de Payment individual
                    const paymentRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "payments",
                        item.payment.id
                    );
                    tx.set(paymentRef, paymentToFirestore(item.payment));
                }

                // 4. Actualizar la Deuda Global SOLO con sus saldos pendientes por cobrar
                tx.update(debtRef, {
                    outstandingReceivables: debt.outstandingReceivables,
                    outstandingReceivablesAmount: debt.outstandingReceivablesAmount,
                    outstandingReceivablesArrears: debt.outstandingReceivablesArrears,
                    outstandingReceivablesDeferment: debt.outstandingReceivablesDeferment,
                });
            });

            return ok({
                payments: items.map((i) => i.payment),
                installments: items.map((i) => i.installment),
                debt,
                newCollectorAmount: finalCollectorAmount,
                bankAccount: finalBankAccount,
            });
        } catch (error) {
            console.error("[registerCascadingPayment]", error);
            if (error instanceof Error) {
                if (error.message === "DEBT_NOT_FOUND") {
                    return fail({ code: "DEBT_NOT_FOUND" });
                }
                if (error.message === "INSTALLMENT_NOT_FOUND") {
                    return fail({ code: "INSTALLMENT_NOT_FOUND" });
                }
                if (error.message === "USER_NOT_FOUND") {
                    return fail({ code: "USER_NOT_FOUND" });
                }
                if (error.message === "BANK_ACCOUNT_NOT_FOUND") {
                    return fail({ code: "BANK_ACCOUNT_NOT_FOUND" });
                }
            }
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getNewId(companyId: string): Promise<string> {
        const paymentsRef = collection(firestore, "companies", companyId, "payments");
        const paymentRef = doc(paymentsRef);
        return paymentRef.id;
    }

}


export function paymentToFirestore(payment: Omit<Payment, "id">): DocumentData {

    const result2 = {
        clientId: payment.clientId,
        capitalPaid: payment.capitalPaid,
        interestPaid: payment.interestPaid,
        arrearsPaid: payment.arrearsPaid,
        defermentPaid: payment.defermentPaid,
        debtId: payment.debtId,
        idRoute: payment.idRoute,
        isTight: payment.isTight,
        collectorObservation: payment.collectorObservation,
        accountantObservation: payment.accountantObservation,
        installmentId: payment.installmentId,
        clientName: payment.clientName,
        collectorName: payment.collectorName,
        collectorId: payment.collectorId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        tightDate: payment.tightDate ? encodeDate(payment.tightDate) : null,
        paidAt: encodeDate(payment.paidAt),
        location: payment.location,
        bankAccountId: payment.bankAccountId,
        idProofOfPayment: payment.idProofOfPayment,
        transactionGroupId: payment.transactionGroupId,
    }
    return removeUndefined(result2)
}

export function documentToPayment(id: string, data: DocumentData): Payment {
    return {
        id: id,
        clientId: data.clientId ?? "",
        capitalPaid: data.capitalPaid ?? 0,
        interestPaid: data.interestPaid ?? 0,
        arrearsPaid: data.arrearsPaid ?? 0,
        defermentPaid: data.defermentPaid ?? 0,
        debtId: data.debtId ?? "",
        idRoute: data.idRoute ?? "",
        isTight: data.isTight ?? false,
        collectorObservation: data.collectorObservation ?? "",
        accountantObservation: data.accountantObservation ?? "",
        installmentId: data.installmentId ?? "",
        clientName: data.clientName ?? "",
        collectorName: data.collectorName ?? "",
        collectorId: data.collectorId ?? "",
        amount: data.amount ?? 0,
        method: data.method ?? "efectivo",
        status: data.status ?? "registrado",
        tightDate: data.tightDate ? decodeDate(data.tightDate) : undefined,
        paidAt: data.paidAt ? decodeDate(data.paidAt) : "",
        location: data.location,
        bankAccountId: data.bankAccountId,
        idProofOfPayment: data.idProofOfPayment ?? "",
        transactionGroupId: data.transactionGroupId ?? undefined,
    };
}
