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
    increment,
    runTransaction,
    Timestamp,
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
import type {
    UpdateMultiplePaymentsIsTightRepositoryInput,
    UpdateMultiplePaymentsIsTightRepositoryOutput,
    UpdateMultiplePaymentsIsTightRepositoryError,
    GetPaymentsByDateError
} from "../../domain/infraestructure/PaymentGateway";
import { paidPorcential } from "../../../../core/shared/helpers/calculate";
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

    async getAllByDate(companyId: string, date: string): Promise<Result<Payment[], GetPaymentsByDateError>> {
        try {
            console.log("[FirebasePaymentRepository.getAllByDate]", companyId, date);
            const ref = collection(firestore, "companies", companyId, "payments");

            // Rango de medianoche local a medianoche del siguiente día
            const [year, month, day] = date.split("-").map(Number);
            const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
            const endLocal = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
            const startTimestamp = Timestamp.fromDate(startLocal);
            const endTimestamp = Timestamp.fromDate(endLocal);

            const q = query(
                ref,
                where("paidAt", ">=", startTimestamp),
                where("paidAt", "<", endTimestamp)
            );

            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Fallback para documentos que hayan guardado paidAt como string
                const nextDayDate = new Date(date);
                nextDayDate.setDate(nextDayDate.getDate() + 1);
                const nextDay = nextDayDate.toISOString().split("T")[0];

                const qString = query(
                    ref,
                    where("paidAt", ">=", date),
                    where("paidAt", "<", nextDay)
                );
                const stringSnapshot = await getDocs(qString);
                if (!stringSnapshot.empty) {
                    snapshot = stringSnapshot;
                }
            }

            const payments: Payment[] = snapshot.docs.map(doc => documentToPayment(doc.id, doc.data()));

            console.log("[FirebasePaymentRepository.getAllByDate]", payments);

            return ok(payments);
        } catch (error) {
            console.error("[FirebasePaymentRepository.getAllByDate]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
    async updateMultipleIsTight(
        input: UpdateMultiplePaymentsIsTightRepositoryInput
    ): Promise<Result<UpdateMultiplePaymentsIsTightRepositoryOutput, UpdateMultiplePaymentsIsTightRepositoryError>> {
        const { companyId, payments } = input;
        if (payments.length === 0) {
            return ok({ updatedCount: 0 });
        }

        try {
            const paymentChunks = this.chunkArray(payments, 50);
            let totalUpdated = 0;

            for (const chunk of paymentChunks) {
                await runTransaction(firestore, async (tx) => {
                    const distinctInstallmentIds = Array.from(
                        new Set(chunk.map((p) => p.installmentId).filter((id): id is string => Boolean(id)))
                    );
                    const distinctDebtIds = Array.from(
                        new Set(chunk.map((p) => p.debtId).filter((id): id is string => Boolean(id)))
                    );
                    const distinctCollectorIds = Array.from(
                        new Set(
                            chunk
                                .filter((p) => p.method === "efectivo" && p.collectorId)
                                .map((p) => p.collectorId)
                                .filter((id): id is string => Boolean(id))
                        )
                    );

                    // ==========================================
                    // FASE 1: TODAS LAS LECTURAS (READS FIRST)
                    // ==========================================

                    // 1. Leer cuotas afectadas
                    const installmentDocs = new Map<string, Installment>();
                    for (const instId of distinctInstallmentIds) {
                        const instRef = doc(firestore, "companies", companyId, "installments", instId);
                        const snap = await tx.get(instRef);
                        if (snap.exists()) {
                            installmentDocs.set(instId, DocumentToInstallment(snap.id, snap.data() || {}));
                        }
                    }

                    // 2. Leer deudas afectadas
                    const debtDocs = new Map<string, Debt>();
                    for (const debtId of distinctDebtIds) {
                        const debtRef = doc(firestore, "companies", companyId, "debts", debtId);
                        const snap = await tx.get(debtRef);
                        if (snap.exists()) {
                            debtDocs.set(debtId, documentToDebt(snap.data() || {}, snap.id));
                        }
                    }

                    // 3. Leer cobradores (efectivo)
                    const userDocs = new Map<string, DocumentData>();
                    for (const colId of distinctCollectorIds) {
                        const userRef = doc(firestore, "companies", companyId, "users", colId);
                        const snap = await tx.get(userRef);
                        if (snap.exists()) {
                            userDocs.set(colId, snap.data() || {});
                        }
                    }

                    // ==========================================
                    // CÁLCULOS MATEMÁTICOS EN MEMORIA
                    // ==========================================
                    const tightDateStr = new Date().toISOString();
                    const encodedTightDate = encodeDate(tightDateStr);

                    // Agrupaciones
                    const paymentsByInstallment = new Map<string, Payment[]>();
                    for (const p of chunk) {
                        if (p.installmentId) {
                            const list = paymentsByInstallment.get(p.installmentId) ?? [];
                            list.push(p);
                            paymentsByInstallment.set(p.installmentId, list);
                        }
                    }

                    const paymentsByDebt = new Map<string, Payment[]>();
                    for (const p of chunk) {
                        if (p.debtId) {
                            const list = paymentsByDebt.get(p.debtId) ?? [];
                            list.push(p);
                            paymentsByDebt.set(p.debtId, list);
                        }
                    }

                    const cashByCollector = new Map<string, Payment[]>();
                    for (const p of chunk) {
                        if (p.method === "efectivo" && p.collectorId) {
                            const list = cashByCollector.get(p.collectorId) ?? [];
                            list.push(p);
                            cashByCollector.set(p.collectorId, list);
                        }
                    }

                    const routeAmounts = new Map<string, number>();
                    for (const p of chunk) {
                        const rId = p.idRoute || "default";
                        if (rId !== "default") {
                            routeAmounts.set(rId, (routeAmounts.get(rId) ?? 0) + (p.amount ?? 0));
                        }
                    }

                    // Cálculos de cuotas
                    const installmentUpdates = new Map<string, DocumentData>();
                    const newlyPaidInstallmentIds = new Set<string>();

                    for (const [instId, instPayments] of paymentsByInstallment.entries()) {
                        const currentInst = installmentDocs.get(instId);
                        if (!currentInst) continue;

                        let addCapital = 0;
                        let addInterest = 0;
                        let addArrears = 0;
                        let addDeferment = 0;
                        let addTotal = 0;
                        const paymentIdsToAdd: string[] = [];

                        for (const p of instPayments) {
                            addCapital += (p.capitalPaid ?? 0);
                            addInterest += (p.interestPaid ?? 0);
                            addArrears += (p.arrearsPaid ?? 0);
                            addDeferment += (p.defermentPaid ?? 0);
                            addTotal += (p.amount ?? 0);
                            paymentIdsToAdd.push(p.id);
                        }

                        const newCapitalPaid = (currentInst.capitalPaid ?? 0) + addCapital;
                        const newInterestPaid = (currentInst.interestPaid ?? 0) + addInterest;
                        const newAmountPaid = (currentInst.amountPaid ?? 0) + (addCapital + addInterest);
                        const newArrearsPaid = (currentInst.arrearsPaid ?? 0) + addArrears;
                        const newDefermentPaid = (currentInst.defermentPaid ?? 0) + addDeferment;
                        const newTotalPaid = (currentInst.totalPaid ?? 0) + addTotal;

                        const remainingCapital = Math.max(0, (currentInst.capital ?? 0) - newCapitalPaid);
                        const remainingInterest = Math.max(0, (currentInst.interest ?? 0) - newInterestPaid);
                        const remainingAmount = remainingCapital + remainingInterest;
                        const remainingArrears = Math.max(0, (currentInst.arrears ?? 0) - newArrearsPaid);
                        const remainingDeferment = Math.max(0, (currentInst.deferment ?? 0) - newDefermentPaid);
                        const remainingTotal = remainingAmount + remainingArrears + remainingDeferment;

                        const existingPayments = currentInst.payments ?? [];
                        const updatedPayments = Array.from(new Set([...existingPayments, ...paymentIdsToAdd]));

                        const pctCapital = paidPorcential(newCapitalPaid, currentInst.capital);
                        const pctInterest = paidPorcential(newInterestPaid, currentInst.interest);
                        const pctAmount = paidPorcential(newAmountPaid, currentInst.amount);
                        const pctArrears = paidPorcential(newArrearsPaid, currentInst.arrears);
                        const pctDeferment = paidPorcential(newDefermentPaid, currentInst.deferment);
                        const pctTotal = paidPorcential(newTotalPaid, currentInst.total);

                        const isFullyPaid = remainingTotal <= 0 || newAmountPaid >= currentInst.amount;
                        const newStatus = isFullyPaid ? "pagada" : currentInst.status;
                        const newIsLife = isFullyPaid ? false : currentInst.isLife;
                        const newPaidAt = isFullyPaid ? (currentInst.paidAt || tightDateStr) : currentInst.paidAt;

                        if (currentInst.status !== "pagada" && newStatus === "pagada") {
                            newlyPaidInstallmentIds.add(instId);
                        }

                        installmentUpdates.set(instId, {
                            capitalPaid: newCapitalPaid,
                            interestPaid: newInterestPaid,
                            amountPaid: newAmountPaid,
                            arrearsPaid: newArrearsPaid,
                            defermentPaid: newDefermentPaid,
                            totalPaid: newTotalPaid,
                            remainingCapitalToPay: remainingCapital,
                            remainingInterestToPay: remainingInterest,
                            remainingAmountToPay: remainingAmount,
                            remainingArrearsToPay: remainingArrears,
                            remainingDefermentToPay: remainingDeferment,
                            remainingTotalToPay: remainingTotal,
                            percentageOfCapitalPaid: pctCapital,
                            percentageOfInterestPaid: pctInterest,
                            percentageOfAmountPaid: pctAmount,
                            porcentageOfArrearsPaid: pctArrears,
                            percentageOfDefermentPaid: pctDeferment,
                            percentageOfTotalPaid: pctTotal,
                            payments: updatedPayments,
                            status: newStatus,
                            isLife: newIsLife,
                            ...(newPaidAt ? { paidAt: encodeDate(newPaidAt) } : {}),
                        });
                    }

                    // Cálculos de deudas
                    const debtUpdates = new Map<string, DocumentData>();

                    for (const [debtId, debtPayments] of paymentsByDebt.entries()) {
                        const currentDebt = debtDocs.get(debtId);
                        if (!currentDebt) continue;

                        let addCapital = 0;
                        let addInterest = 0;
                        let addArrears = 0;
                        let addDeferment = 0;
                        let addTotal = 0;
                        let latestPaymentDate = currentDebt.dateLastPayment;

                        for (const p of debtPayments) {
                            addCapital += (p.capitalPaid ?? 0);
                            addInterest += (p.interestPaid ?? 0);
                            addArrears += (p.arrearsPaid ?? 0);
                            addDeferment += (p.defermentPaid ?? 0);
                            addTotal += (p.amount ?? 0);
                            if (p.paidAt && (!latestPaymentDate || p.paidAt > latestPaymentDate)) {
                                latestPaymentDate = p.paidAt;
                            }
                        }

                        const newCapitalPaid = (currentDebt.capitalPaid ?? 0) + addCapital;
                        const newInterestPaid = (currentDebt.interestPaid ?? 0) + addInterest;
                        const newAmountPaid = (currentDebt.amountPaid ?? 0) + (addCapital + addInterest);
                        const newArrearsPaid = (currentDebt.arrearsPaid ?? 0) + addArrears;
                        const newDefermentPaid = (currentDebt.defermentPaid ?? 0) + addDeferment;
                        const newTotalPaid = (currentDebt.totalPaid ?? 0) + addTotal;

                        const remainingCapital = Math.max(0, (currentDebt.capital ?? 0) - newCapitalPaid);
                        const remainingInterest = Math.max(0, (currentDebt.interest ?? 0) - newInterestPaid);
                        const remainingAmount = remainingCapital + remainingInterest;
                        const remainingArrears = Math.max(0, (currentDebt.arrears ?? 0) - newArrearsPaid);
                        const remainingDeferment = Math.max(0, (currentDebt.deferment ?? 0) - newDefermentPaid);
                        const remainingTotal = remainingAmount + remainingArrears + remainingDeferment;

                        const pctCapital = paidPorcential(newCapitalPaid, currentDebt.capital);
                        const pctInterest = paidPorcential(newInterestPaid, currentDebt.interest);
                        const pctAmount = paidPorcential(newAmountPaid, currentDebt.amount);
                        const pctArrears = paidPorcential(newArrearsPaid, currentDebt.arrears);
                        const pctDeferment = paidPorcential(newDefermentPaid, currentDebt.deferment);
                        const pctTotal = paidPorcential(newTotalPaid, currentDebt.total);

                        let newlyPaidCount = 0;
                        for (const p of debtPayments) {
                            if (p.installmentId && newlyPaidInstallmentIds.has(p.installmentId)) {
                                newlyPaidCount++;
                                newlyPaidInstallmentIds.delete(p.installmentId);
                            }
                        }

                        const newInstallmentsPaid = (currentDebt.installmentsPaid ?? 0) + newlyPaidCount;
                        const isDebtFullyPaid =
                            remainingCapital <= 0 ||
                            (currentDebt.installmentCount > 0 && newInstallmentsPaid >= currentDebt.installmentCount);

                        const newStatus = isDebtFullyPaid ? "pagada" : currentDebt.status;
                        const newIsLife = isDebtFullyPaid ? false : currentDebt.isLife;
                        const newClosedAt = isDebtFullyPaid ? (currentDebt.closedAt || tightDateStr) : currentDebt.closedAt;

                        debtUpdates.set(debtId, {
                            capitalPaid: newCapitalPaid,
                            interestPaid: newInterestPaid,
                            amountPaid: newAmountPaid,
                            arrearsPaid: newArrearsPaid,
                            defermentPaid: newDefermentPaid,
                            totalPaid: newTotalPaid,
                            remainingCapitalToPay: remainingCapital,
                            remainingInterestToPay: remainingInterest,
                            remainingAmountToPay: remainingAmount,
                            remainingArrearsToPay: remainingArrears,
                            remainingDefermentToPay: remainingDeferment,
                            remainingTotalToPay: remainingTotal,
                            percentageOfCapitalPaid: pctCapital,
                            percentageOfInteresPaid: pctInterest,
                            percentageOfAmountPaid: pctAmount,
                            porcentageOfArrearsPaid: pctArrears,
                            percentageOfDefermentPaid: pctDeferment,
                            percentageOfTotalPaid: pctTotal,
                            installmentsPaid: newInstallmentsPaid,
                            status: newStatus,
                            isLife: newIsLife,
                            ...(latestPaymentDate ? { dateLastPayment: encodeDate(latestPaymentDate) } : {}),
                            ...(newClosedAt ? { closedAt: encodeDate(newClosedAt) } : {}),
                        });
                    }

                    // Cálculos de cobradores
                    const userUpdates = new Map<string, DocumentData>();
                    for (const [collectorId, cashPayments] of cashByCollector.entries()) {
                        const currentData = userDocs.get(collectorId);
                        if (!currentData) continue;

                        let totalCashAmount = 0;
                        let capitalCashAmount = 0;
                        let interestCashAmount = 0;
                        let arrearsCashAmount = 0;
                        let defermentCashAmount = 0;

                        for (const p of cashPayments) {
                            totalCashAmount += (p.amount ?? 0);
                            capitalCashAmount += (p.capitalPaid ?? 0);
                            interestCashAmount += (p.interestPaid ?? 0);
                            arrearsCashAmount += (p.arrearsPaid ?? 0);
                            defermentCashAmount += (p.defermentPaid ?? 0);
                        }

                        const currentTotal = currentData.totalAmount ?? 0;
                        const currentCapital = currentData.capitalAmount ?? 0;
                        const currentInterest = currentData.interestAmount ?? 0;
                        const currentArrears = currentData.arrearsAmount ?? 0;
                        const currentDeferment = currentData.defermentAmount ?? 0;

                        userUpdates.set(collectorId, {
                            totalAmount: Math.max(0, currentTotal - totalCashAmount),
                            capitalAmount: Math.max(0, currentCapital - capitalCashAmount),
                            interestAmount: Math.max(0, currentInterest - interestCashAmount),
                            arrearsAmount: Math.max(0, currentArrears - arrearsCashAmount),
                            defermentAmount: Math.max(0, currentDeferment - defermentCashAmount),
                        });
                    }

                    // ==========================================
                    // FASE 2: TODAS LAS ESCRITURAS (WRITES AFTER)
                    // ==========================================

                    // 1. Actualizar pagos
                    for (const p of chunk) {
                        const paymentRef = doc(firestore, "companies", companyId, "payments", p.id);
                        tx.update(paymentRef, {
                            isTight: true,
                            tightDate: encodedTightDate,
                            status: "confirmado",
                        });
                    }

                    // 2. Actualizar cuotas
                    for (const [instId, data] of installmentUpdates.entries()) {
                        const instRef = doc(firestore, "companies", companyId, "installments", instId);
                        tx.update(instRef, removeUndefined(data));
                    }

                    // 3. Actualizar deudas
                    for (const [debtId, data] of debtUpdates.entries()) {
                        const debtRef = doc(firestore, "companies", companyId, "debts", debtId);
                        tx.update(debtRef, removeUndefined(data));
                    }

                    // 4. Actualizar cobradores
                    for (const [colId, data] of userUpdates.entries()) {
                        const userRef = doc(firestore, "companies", companyId, "users", colId);
                        tx.update(userRef, removeUndefined(data));
                    }

                    // 5. Actualizar rutas
                    for (const [routeId, amount] of routeAmounts.entries()) {
                        const routeRef = doc(firestore, "companies", companyId, "routes", routeId);
                        tx.set(routeRef, { totalCollected: increment(amount) }, { merge: true });
                    }
                });

                totalUpdated += chunk.length;
            }

            return ok({ updatedCount: totalUpdated });
        } catch (error) {
            console.error("Error updating payments isTight:", error);
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
