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
    runTransaction
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
import { encodeDate, decodeDate } from "../../../../core/shared/firebase/codeDecodeTime";
import type { DocumentData } from "firebase/firestore";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";
import type { Installment } from "../../domain/business/entities/Installment";
import type { Debt } from "../../domain/business/entities/Debt";
import type { BankAccount } from "../../../bankAccounts/domain/business/entities/BankAccount";
import { paidPorcential } from "../../../../core/shared/helpers/calculate";
import { DebtToDocumentData, documentToDebt } from "./DebtRepository";
import { DocumentToInstallment, InstallmentToDocument } from "./FirebaseInstallmentRepository";
import type { RegisterCashPaymentInput, RegisterCashPaymentOutput, RegisterCashPaymentError } from "../../domain/business/useCases/payment/RegisterCashPaymentUseCase";
import type { RegisterConsignmentPaymentRepositoryInput, RegisterConsignmentPaymentOutput, RegisterConsignmentPaymentError } from "../../domain/business/useCases/payment/RegisterConsignmentPaymentUseCase";


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
        input: RegisterCashPaymentInput
    ): Promise<Result<RegisterCashPaymentOutput, RegisterCashPaymentError>> {
        const { payment, companyId, collectorId, currentCollectorAmount } = input;

        try {
            const installmentRef = doc(
                firestore,
                "companies",
                companyId,
                "installments",
                payment.installmentId
            );

            const initialInstallmentSnap = await getDoc(installmentRef);
            if (!initialInstallmentSnap.exists()) {
                return fail({ code: "INSTALLMENT_NOT_FOUND" });
            }

            const initialInstallmentData = initialInstallmentSnap.data();
            const debtId = initialInstallmentData.debtId;

            const debtRef = doc(firestore, "companies", companyId, "debts", debtId);
            const debtSnap = await getDoc(debtRef);
            if (!debtSnap.exists()) {
                return fail({ code: "DEBT_NOT_FOUND" });
            }

            const installmentsQuery = query(
                collection(firestore, "companies", companyId, "installments"),
                where("debtId", "==", debtId)
            );
            const allInstallmentsSnap = await getDocs(installmentsQuery);
            const allInstallmentRefs = allInstallmentsSnap.docs.map((d) => d.ref);

            const userRef = collectorId
                ? doc(firestore, "companies", companyId, "users", collectorId)
                : null;

            const newPaymentRef = payment.id
                ? doc(firestore, "companies", companyId, "payments", payment.id)
                : doc(collection(firestore, "companies", companyId, "payments"));

            const paymentIdToSave = newPaymentRef.id;
            const paymentWithId: Payment = {
                ...payment,
                id: paymentIdToSave,
            };

            let distributionRes: DistributionResult | null = null;
            let finalCollectorAmount = currentCollectorAmount + payment.amount;

            await runTransaction(firestore, async (tx) => {
                const debtDocTx = await tx.get(debtRef);
                if (!debtDocTx.exists()) {
                    throw new Error("DEBT_NOT_FOUND");
                }
                const debtEntity = documentToDebt(debtDocTx.data(), debtDocTx.id);

                const instDocsTx = await Promise.all(
                    allInstallmentRefs.map((ref) => tx.get(ref))
                );

                const allInstEntities: Installment[] = instDocsTx.map((snap) =>
                    DocumentToInstallment(snap.id, snap.data() || {})
                );

                let fetchedCollectorAmount = currentCollectorAmount;
                if (userRef) {
                    const userSnap = await tx.get(userRef);
                    if (userSnap.exists()) {
                        fetchedCollectorAmount = userSnap.data().totalAmount ?? currentCollectorAmount;
                    }
                }
                finalCollectorAmount = fetchedCollectorAmount + payment.amount;

                distributionRes = distributePayment(
                    payment.amount,
                    false,
                    payment.paidAt || new Date().toISOString(),
                    payment.installmentId,
                    allInstEntities,
                    debtEntity
                );

                tx.set(newPaymentRef, paymentToFirestore(paymentWithId));

                for (const updatedInst of distributionRes.updatedInstallments) {
                    const instDocRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "installments",
                        updatedInst.id
                    );
                    tx.update(instDocRef, InstallmentToDocument(updatedInst));
                }

                tx.update(debtRef, DebtToDocumentData(distributionRes.updatedDebt));

                if (userRef) {
                    tx.update(userRef, { totalAmount: finalCollectorAmount });
                }
            });

            if (!distributionRes) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const res: DistributionResult = distributionRes;

            return ok({
                payment: paymentWithId,
                installment: res.targetInstallment,
                debt: res.updatedDebt,
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
            }
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async registerConsignmentPayment(
        input: RegisterConsignmentPaymentRepositoryInput
    ): Promise<Result<RegisterConsignmentPaymentOutput, RegisterConsignmentPaymentError>> {
        const {
            companyId,
            amount,
            location,
            paymentId,
            proofUrl,
            bankAccount,
            installmentId,
            debtId,
            clientId,
        } = input;

        try {
            const installmentRef = doc(
                firestore,
                "companies",
                companyId,
                "installments",
                installmentId
            );
            const initialInstallmentSnap = await getDoc(installmentRef);
            if (!initialInstallmentSnap.exists()) {
                return fail({ code: "INSTALLMENT_NOT_FOUND" });
            }

            const targetDebtId = debtId || initialInstallmentSnap.data().debtId;
            const debtRef = doc(firestore, "companies", companyId, "debts", targetDebtId);
            const debtSnap = await getDoc(debtRef);
            if (!debtSnap.exists()) {
                return fail({ code: "DEBT_NOT_FOUND" });
            }

            const bankAccountRef = doc(
                firestore,
                "companies",
                companyId,
                "bankAccounts",
                bankAccount.id
            );

            const installmentsQuery = query(
                collection(firestore, "companies", companyId, "installments"),
                where("debtId", "==", targetDebtId)
            );
            const allInstallmentsSnap = await getDocs(installmentsQuery);
            const allInstallmentRefs = allInstallmentsSnap.docs.map((d) => d.ref);

            const paymentRef = doc(firestore, "companies", companyId, "payments", paymentId);

            let distributionRes: DistributionResult | null = null;
            let updatedBankAccount: BankAccount = bankAccount;
            let finalPayment: Payment | null = null;

            await runTransaction(firestore, async (tx) => {
                const debtDocTx = await tx.get(debtRef);
                if (!debtDocTx.exists()) {
                    throw new Error("DEBT_NOT_FOUND");
                }
                const debtEntity = documentToDebt(debtDocTx.data(), debtDocTx.id);

                const bankAccountDocTx = await tx.get(bankAccountRef);
                if (!bankAccountDocTx.exists()) {
                    throw new Error("BANK_ACCOUNT_NOT_FOUND");
                }
                const currentMonto = bankAccountDocTx.data().monto ?? bankAccount.monto;
                const newMonto = currentMonto + amount;
                updatedBankAccount = {
                    ...bankAccount,
                    monto: newMonto,
                };

                const instDocsTx = await Promise.all(
                    allInstallmentRefs.map((ref) => tx.get(ref))
                );
                const allInstEntities: Installment[] = instDocsTx.map((snap) =>
                    DocumentToInstallment(snap.id, snap.data() || {})
                );

                const targetInst = allInstEntities.find((i) => i.id === installmentId);

                const paidAtStr = new Date().toISOString();

                finalPayment = {
                    id: paymentId,
                    clientId: clientId || targetInst?.clientId || "",
                    capitalPaid: targetInst?.capitalPaid ?? 0,
                    interestPaid: targetInst?.interestPaid ?? 0,
                    arrearsPaid: targetInst?.arrearsPaid ?? 0,
                    defermentPaid: targetInst?.defermentPaid ?? 0,
                    debtId: targetDebtId,
                    idRoute: debtEntity.routeId || "",
                    isTight: false,
                    idProofOfPayment: proofUrl,
                    collectorObservation: "",
                    accountantObservation: "",
                    installmentId,
                    clientName: targetInst?.clientName ?? "",
                    collectorName: "Consignación",
                    collectorId: "",
                    amount,
                    method: "consignacion",
                    status: "registrado",
                    paidAt: paidAtStr,
                    location,
                    bankAccountId: bankAccount.id,
                };

                distributionRes = distributePayment(
                    amount,
                    false,
                    paidAtStr,
                    installmentId,
                    allInstEntities,
                    debtEntity
                );

                tx.set(paymentRef, paymentToFirestore(finalPayment));

                for (const updatedInst of distributionRes.updatedInstallments) {
                    const instDocRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "installments",
                        updatedInst.id
                    );
                    tx.update(instDocRef, InstallmentToDocument(updatedInst));
                }

                tx.update(debtRef, DebtToDocumentData(distributionRes.updatedDebt));
                tx.update(bankAccountRef, { monto: newMonto });
            });

            if (!distributionRes || !finalPayment) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const res: DistributionResult = distributionRes;

            return ok({
                payment: finalPayment,
                installment: res.targetInstallment,
                debt: res.updatedDebt,
                bankAccount: updatedBankAccount,
            });
        } catch (error) {
            console.error("[registerConsignmentPayment]", error);
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
            }
            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}

interface DistributionResult {
    updatedInstallments: Installment[];
    updatedDebt: Debt;
    targetInstallment: Installment;
}

function distributePayment(
    paymentAmount: number,
    payLatePayment: boolean,
    paidAt: string,
    targetInstallmentId: string,
    allInstallments: Installment[],
    debt: Debt
): DistributionResult {
    if (paymentAmount <= 0) {
        throw new Error("PAYMENT_AMOUNT_INVALID");
    }

    const sortedInstallments = [...allInstallments].sort(
        (a, b) => a.installmentNumber - b.installmentNumber
    );

    const currentIndex = sortedInstallments.findIndex(
        (installment) => installment.id === targetInstallmentId
    );

    if (currentIndex === -1) {
        throw new Error("INSTALLMENT_NOT_FOUND");
    }

    const targetInstallment = sortedInstallments[currentIndex];

    /**
     * Según la entidad Installment:
     *
     * isLife === true  -> cuota todavía pendiente/viva
     * isLife === false -> cuota liquidada/inactiva/etc.
     */
    const installmentsToPay = sortedInstallments
        .slice(currentIndex)
        .filter((installment) => installment.isLife);

    let remainingPayment = paymentAmount;

    let totalPaidToCapital = 0;
    let totalPaidToInterest = 0;
    let totalPaidToAmount = 0;
    let totalPaidToDeferment = 0;
    let totalPaidToArrears = 0;

    const updatedInstallmentsMap = new Map<string, Installment>();

    const paymentDate = paidAt.split("T")[0];

    for (const installment of installmentsToPay) {
        if (remainingPayment <= 0) {
            break;
        }

        /*
         * ============================================================
         * VALORES PENDIENTES
         * ============================================================
         */

        const pendingCapital = Math.max(
            0,
            (installment.capital ?? 0) -
            (installment.capitalPaid ?? 0)
        );

        const pendingInterest = Math.max(
            0,
            (installment.interest ?? 0) -
            (installment.interestPaid ?? 0)
        );

        const pendingDeferment = Math.max(
            0,
            (installment.deferment ?? 0) -
            (installment.defermentPaid ?? 0)
        );

        const pendingArrears = Math.max(
            0,
            (installment.arrears ?? 0) -
            (installment.arrearsPaid ?? 0)
        );

        let installmentPayment = remainingPayment;

        let paidToCapital = 0;
        let paidToInterest = 0;
        let paidToDeferment = 0;
        let paidToArrears = 0;

        /*
         * ============================================================
         * 1. CAPITAL / INTERÉS
         *
         * FIJO:
         *   capital -> interest
         *
         * VARIABLE:
         *   interest -> capital
         * ============================================================
         */

        if (installment.type === "fijo") {
            // Primero capital
            paidToCapital = Math.min(
                installmentPayment,
                pendingCapital
            );

            installmentPayment -= paidToCapital;

            // Después interés
            if (installmentPayment > 0) {
                paidToInterest = Math.min(
                    installmentPayment,
                    pendingInterest
                );

                installmentPayment -= paidToInterest;
            }
        } else {
            // Primero interés
            paidToInterest = Math.min(
                installmentPayment,
                pendingInterest
            );

            installmentPayment -= paidToInterest;

            // Después capital
            if (installmentPayment > 0) {
                paidToCapital = Math.min(
                    installmentPayment,
                    pendingCapital
                );

                installmentPayment -= paidToCapital;
            }
        }

        /*
         * ============================================================
         * 2. DEFERMENT
         *
         * Siempre después de capital/interés.
         * ============================================================
         */

        if (installmentPayment > 0) {
            paidToDeferment = Math.min(
                installmentPayment,
                pendingDeferment
            );

            installmentPayment -= paidToDeferment;
        }

        /*
         * ============================================================
         * 3. MORA
         *
         * Siempre después de capital/interés/deferment.
         *
         * payLatePayment permite decidir si este pago puede
         * cubrir mora.
         * ============================================================
         */

        if (installmentPayment > 0 && payLatePayment) {
            paidToArrears = Math.min(
                installmentPayment,
                pendingArrears
            );

            installmentPayment -= paidToArrears;
        }

        /*
         * ============================================================
         * ACUMULAR DISTRIBUCIÓN GLOBAL
         * ============================================================
         */

        const paidToBase = paidToCapital + paidToInterest;

        totalPaidToCapital += paidToCapital;
        totalPaidToInterest += paidToInterest;
        totalPaidToAmount += paidToBase;
        totalPaidToDeferment += paidToDeferment;
        totalPaidToArrears += paidToArrears;

        /*
         * ============================================================
         * NUEVOS VALORES PAGADOS
         * ============================================================
         */

        const newCapitalPaid =
            (installment.capitalPaid ?? 0) +
            paidToCapital;

        const newInterestPaid =
            (installment.interestPaid ?? 0) +
            paidToInterest;

        const newAmountPaid =
            newCapitalPaid +
            newInterestPaid;

        const newDefermentPaid =
            (installment.defermentPaid ?? 0) +
            paidToDeferment;

        const newArrearsPaid =
            (installment.arrearsPaid ?? 0) +
            paidToArrears;

        /*
         * ============================================================
         * TOTAL
         * ============================================================
         *
         * amount = capital + interest
         *
         * total = amount + deferment + arrears
         */

        const installmentAmount =
            (installment.capital ?? 0) +
            (installment.interest ?? 0);

        const installmentTotal =
            installmentAmount +
            (installment.deferment ?? 0) +
            (installment.arrears ?? 0);

        const newTotalPaid =
            newAmountPaid +
            newDefermentPaid +
            newArrearsPaid;

        /*
         * ============================================================
         * VALORES RESTANTES
         * ============================================================
         */

        const remainingCapitalToPay = Math.max(
            0,
            (installment.capital ?? 0) -
            newCapitalPaid
        );

        const remainingInterestToPay = Math.max(
            0,
            (installment.interest ?? 0) -
            newInterestPaid
        );

        const remainingAmountToPay = Math.max(
            0,
            installmentAmount -
            newAmountPaid
        );

        const remainingDefermentToPay = Math.max(
            0,
            (installment.deferment ?? 0) -
            newDefermentPaid
        );

        const remainingArrearsToPay = Math.max(
            0,
            (installment.arrears ?? 0) -
            newArrearsPaid
        );

        const remainingTotalToPay = Math.max(
            0,
            installmentTotal -
            newTotalPaid
        );

        /*
         * ============================================================
         * PORCENTAJES
         * ============================================================
         */

        const percentageOfCapitalPaid = paidPorcential(
            newCapitalPaid,
            installment.capital
        );

        const percentageOfInterestPaid = paidPorcential(
            newInterestPaid,
            installment.interest
        );

        const percentageOfAmountPaid = paidPorcential(
            newAmountPaid,
            installmentAmount
        );

        const percentageOfDefermentPaid = paidPorcential(
            newDefermentPaid,
            installment.deferment
        );

        const porcentageOfArrearsPaid = paidPorcential(
            newArrearsPaid,
            installment.arrears
        );

        const percentageOfTotalPaid = paidPorcential(
            newTotalPaid,
            installmentTotal
        );

        /*
         * ============================================================
         * FECHAS DE PAGO
         * ============================================================
         */

        const capitalPaidAt =
            newCapitalPaid >= (installment.capital ?? 0)
                ? installment.capitalPaidAt ?? paymentDate
                : installment.capitalPaidAt;

        const interestPaidAt =
            newInterestPaid >= (installment.interest ?? 0)
                ? installment.interestPaidAt ?? paymentDate
                : installment.interestPaidAt;

        const amountPaidAt =
            newAmountPaid >= installmentAmount
                ? installment.amountPaidAt ?? paymentDate
                : installment.amountPaidAt;

        const defermentPaidAt =
            newDefermentPaid >= (installment.deferment ?? 0)
                ? installment.deferredPaidAt ?? paymentDate
                : installment.deferredPaidAt;

        const arrearsPaidAt =
            newArrearsPaid >= (installment.arrears ?? 0)
                ? installment.arrearsPaidAt ?? paymentDate
                : installment.arrearsPaidAt;

        /*
         * ============================================================
         * ESTADO
         * ============================================================
         *
         * requiredState / requiredArrears determinan si la mora
         * es requisito para considerar la cuota completamente pagada.
         *
         * Si requiredArrears === "si", la mora pendiente impide
         * marcarla como pagada.
         */

        const baseAndDefermentPaid =
            remainingAmountToPay <= 0 &&
            remainingDefermentToPay <= 0;

        const arrearsRequired = installment.requiredState === true


        const arrearsCompleted =
            remainingArrearsToPay <= 0;

        const installmentCompleted =
            baseAndDefermentPaid &&
            (!arrearsRequired || arrearsCompleted);

        let status = installment.status;
        let newPaidAt = installment.paidAt;

        if (installmentCompleted) {
            status = "pagada";
            newPaidAt = paymentDate;
        } else if (newTotalPaid > 0) {
            status = "pendiente";
        }

        /*
         * ============================================================
         * OUTSTANDING RECEIVABLES
         * ============================================================
         */

        const outstandingReceivablesDeferment =
            remainingDefermentToPay;

        const outstandingReceivablesArrears =
            remainingArrearsToPay;

        const outstandingReceivables =
            remainingTotalToPay;

        /*
         * ============================================================
         * ACTUALIZAR CUOTA
         * ============================================================
         */

        const updatedInstallment: Installment = {
            ...installment,

            // Valores base
            amount: installmentAmount,
            total: installmentTotal,

            // Pagos
            capitalPaid: newCapitalPaid,
            interestPaid: newInterestPaid,
            amountPaid: newAmountPaid,
            defermentPaid: newDefermentPaid,
            arrearsPaid: newArrearsPaid,
            totalPaid: newTotalPaid,

            // Porcentajes
            percentageOfCapitalPaid,
            percentageOfInterestPaid,
            percentageOfAmountPaid,
            percentageOfDefermentPaid,
            porcentageOfArrearsPaid,
            percentageOfTotalPaid,

            // Restantes
            remainingCapitalToPay,
            remainingInterestToPay,
            remainingAmountToPay,
            remainingDefermentToPay,
            remainingArrearsToPay,
            remainingTotalToPay,

            // Fechas
            capitalPaidAt,
            interestPaidAt,
            amountPaidAt,
            deferredPaidAt: defermentPaidAt,
            arrearsPaidAt,

            // Estado
            status,
            paidAt: newPaidAt,

            // Cartera pendiente
            outstandingReceivables,
            outstandingReceivablesAmount:
                remainingAmountToPay,
            outstandingReceivablesDeferment,
            outstandingReceivablesArrears,
        };

        updatedInstallmentsMap.set(
            updatedInstallment.id,
            updatedInstallment
        );

        /*
         * Lo que no se utilizó de este pago continúa hacia
         * la siguiente cuota.
         */
        remainingPayment = installmentPayment;
    }

    /*
     * ================================================================
     * TODAS LAS CUOTAS ACTUALIZADAS
     * ================================================================
     */

    const allUpdatedInstallments = sortedInstallments.map(
        (installment) =>
            updatedInstallmentsMap.get(installment.id) ??
            installment
    );

    /*
     * ================================================================
     * CUOTAS PAGADAS
     * ================================================================
     */

    const installmentsPaidCount =
        allUpdatedInstallments.filter(
            (installment) =>
                installment.status === "pagada"
        ).length;

    /*
     * ================================================================
     * ACTUALIZAR DEBT
     * ================================================================
     *
     * Mantenemos aquí únicamente los campos de Debt que ya utiliza
     * tu implementación original.
     */

    const newDebtAmountPaid =
        (debt.amountPaid ?? 0) +
        totalPaidToAmount;

    const newDebtArrearsPaid =
        (debt.arrearsPaid ?? 0) +
        totalPaidToArrears;

    const totalPaidForDebtCalc =
        newDebtAmountPaid +
        newDebtArrearsPaid +
        (debt.renewalPayment ?? 0);

    const updatedDebt: Debt = {
        ...debt,

        amountPaid: newDebtAmountPaid,
        arrearsPaid: newDebtArrearsPaid,

        percentageOfCapitalPaid: paidPorcential(
            totalPaidForDebtCalc,
            debt.capital
        ),

        percentageOfInteresPaid: paidPorcential(
            totalPaidForDebtCalc,
            debt.interest
        ),

        percentageOfAmountPaid: paidPorcential(
            totalPaidForDebtCalc,
            debt.amount
        ),

        dateLastPayment: paidAt,
        installmentsPaid: installmentsPaidCount,
    };

    /*
     * ================================================================
     * CUOTA OBJETIVO
     * ================================================================
     */

    const updatedTargetInstallment =
        updatedInstallmentsMap.get(targetInstallmentId) ??
        targetInstallment;

    return {
        updatedInstallments: Array.from(
            updatedInstallmentsMap.values()
        ),
        updatedDebt,
        targetInstallment: updatedTargetInstallment,
    };
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
    };
}
