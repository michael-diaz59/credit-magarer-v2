import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type DisbursementGateway from "../../domain/infraestructure/DisbursementGateway";
import type { Disbursement } from "../../domain/business/entities/Disbursement";
import type { CreateDisbursementError, CreateDisbursementOutput } from "../../domain/business/useCases/disbursement/CreateDisbursementCase";
import type { GetPendentingsDisbursementForCollectorError, GetPendentingsDisbursementForCollectorInput, GetPendentingsDisbursementForCollectorOutput } from "../../domain/business/useCases/disbursement/GetPendentingsDisbursementForCollectorCase";
import { collection, doc, getDocs, query, setDoc, Timestamp, where, writeBatch, type DocumentData } from "firebase/firestore";
import type { createGatewayInput, MarkDisbursementDeliveryItem, MarkDisbursementsAsDeliveredInput } from "../../domain/infraestructure/DisbursementGateway";
import { firestore } from "../../../../store/firebase/firebase";
import { uploadProof } from "./FirebaseAnotherPaymentRepository";
import type { GetPendentingsDisbursementError, GetPendentingsDisbursementInput, GetPendentingsDisbursementOutput } from "../../domain/business/useCases/disbursement/GetPendentingsDisbursementCase";
import type { MarkDisbursementAsDeliveredInput, MarkDisbursementAsDeliveredOutput, MarkDisbursementAsDeliveredError } from "../../domain/business/useCases/disbursement/MarkDisbursementAsDeliveredCase";
import type { MarkDisbursementDeliveredAndActivateDebtOutput, MarkDisbursementDeliveredAndActivateDebtError } from "../../domain/business/useCases/disbursement/MarkDisbursementDeliveredAndActivateDebt";
import { InstallmentToDocument } from "../../../debits/provider/firebase/FirebaseInstallmentRepository";

export class DisbursementRepository implements DisbursementGateway {

    private async processDisbursementDelivery(
        companyId: string,
        item: MarkDisbursementDeliveryItem,
    ): Promise<void> {
        const batch = writeBatch(firestore);

        const disbursementsCollection = collection(
            firestore,
            "companies",
            companyId,
            "disbursements",
        );

        const installmentsCollection = collection(
            firestore,
            "companies",
            companyId,
            "installments",
        );

        const disbursementRef = doc(disbursementsCollection);

        const debtRef = doc(
            firestore,
            "companies",
            companyId,
            "debts",
            item.debtId,
        );

        /**
         * 1. Crear desembolso
         */
        batch.set(
            disbursementRef,
            disbursementToDocument(item.disbursement),
        );

        /**
         * 2. Activar deuda
         */
        batch.update(debtRef, {
            status: "activa",
            deliveredStatus: "entregado",
            delivered: true,
            isLife: true,
        });

        /**
         * 3. Crear cuotas de ESTA deuda
         */
        for (const installment of item.installments) {
            const installmentRef = doc(
                installmentsCollection,
            );

            batch.set(
                installmentRef,
                InstallmentToDocument(installment),
            );
        }

        /**
         * 4. Commit atómico:
         *
         * - desembolso
         * - deuda
         * - cuotas
         *
         * Todo o nada para este crédito.
         */
        await batch.commit();
    }

    async markAsDeliveredAndActivateDebt(
        input: MarkDisbursementsAsDeliveredInput,
    ): Promise<
        Result<
            MarkDisbursementDeliveredAndActivateDebtOutput,
            MarkDisbursementDeliveredAndActivateDebtError
        >
    > {
        try {
            const results = await Promise.allSettled(
                input.items.map((item) =>
                    this.processDisbursementDelivery(
                        input.companyId,
                        item,
                    )
                ),
            );

            const failed = results.filter(
                (result): result is PromiseRejectedResult =>
                    result.status === "rejected",
            );

            if (failed.length > 0) {
                console.error(
                    "[markDisbursementsAsDelivered] Some operations failed",
                    failed,
                );

                return fail({
                    code: "TRANSACTION_ERROR",
                });
            }

            return ok({
                state: true,
            });
        } catch (error) {
            console.error(
                "[markDisbursementsAsDelivered]",
                error,
            );

            return fail({
                code: "TRANSACTION_ERROR",
            });
        }
    }


    async markDisbursementAsDelivered(input: MarkDisbursementAsDeliveredInput): Promise<Result<MarkDisbursementAsDeliveredOutput, MarkDisbursementAsDeliveredError>> {
        try {
            const ref = collection(firestore, "companies", input.companyId, "disbursements");
            const docRef = doc(ref, input.disbursementId);
            await setDoc(docRef, { isValidCollector: false, isValidAccountant: false, status: "entregado" }, { merge: true });
            return ok({ state: true });
        } catch (error) {
            console.error("[markDisbursementAsDelivered]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getPendentingsDisbursement(input: GetPendentingsDisbursementInput): Promise<Result<GetPendentingsDisbursementOutput, GetPendentingsDisbursementError>> {
        const { companyId } = input;
        try {
            const ref = collection(firestore, "companies", companyId, "disbursements");

            const q = query(
                ref,
                where("isValidAccountant", "==", true),
            );

            const snapshot = await getDocs(q);

            const disbursements = snapshot.docs.map((doc) =>
                documentToDisbursement(doc.id, doc.data())
            );
            return ok({ disbursements });
        } catch (error) {
            console.error("[getPendentingsDisbursementForCollector]", error);
            return fail({ code: "INTERNAL_SERVER_ERROR" });
        }
    }

    async getPendentingsDisbursementForCollector(input: GetPendentingsDisbursementForCollectorInput): Promise<Result<GetPendentingsDisbursementForCollectorOutput, GetPendentingsDisbursementForCollectorError>> {
        const { companyId, collectorId } = input;
        try {
            const ref = collection(firestore, "companies", companyId, "disbursements");

            const q = query(
                ref,
                where("collectorId", "==", collectorId),
                where("isValidCollector", "==", true),
            );

            const snapshot = await getDocs(q);

            const disbursements = snapshot.docs.map((doc) =>
                documentToDisbursement(doc.id, doc.data())
            );
            return ok({ disbursements });
        } catch (error) {
            console.error("[getPendentingsDisbursementForCollector]", error);
            return fail({ code: "INTERNAL_SERVER_ERROR" });
        }
    }
    async create(input: createGatewayInput): Promise<Result<CreateDisbursementOutput, CreateDisbursementError>> {
        try {
            const { companyId, disbursement, file } = input
            const refCollection = collection(firestore, "companies", companyId, "disbursements");
            const docRef = doc(refCollection);
            const id = docRef.id;

            let idProofOfPayment = disbursement.idProofOfPayment;

            if (file) {
                const uploadResult = await uploadProof(companyId, id, file);
                if (uploadResult.ok) {
                    idProofOfPayment = uploadResult.value;
                }
            }

            const data = disbursementToDocument({ ...disbursement, idProofOfPayment });
            await setDoc(docRef, { ...data, id });

            return ok({ state: null });
        } catch (error) {
            console.error("Error creating disbursements:", error);
            return fail({ code: "NETWORK_ERROR" });
        }
    }

}

/**
 * Convierte un documento/data de Firestore a la entidad de dominio Disbursement.
 * 
 * @param id ID del documento en Firestore
 * @param data Datos crudos devueltos por doc.data()
 */
export function documentToDisbursement(id: string, data: DocumentData): Disbursement {
    // Manejo flexible de fecha: Timestamp de Firestore, string ISO o Date
    let createdAtStr = new Date().toISOString();
    if (data.createdAt instanceof Timestamp) {
        createdAtStr = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === "string") {
        createdAtStr = data.createdAt;
    }

    return {
        id,
        createdAt: createdAtStr,
        deliveredAmount: Number(data.deliveredAmount ?? 0),
        pendingAmount: Number(data.pendingAmount ?? 0),
        amount: Number(data.amount ?? 0),
        method: data.method ?? "efectivo",
        isValidCollector: Boolean(data.isValidCollector ?? true),
        isValidAccountant: Boolean(data.isValidAccountant ?? true),
        status: data.status ?? "entregado",
        bankAccountId: data.bankAccountId ?? undefined,
        updatedAt: data.updatedAt ?? "",
        idProofOfPayment: data.idProofOfPayment ?? undefined,
        accountantNotes: data.accountantNotes ?? "",
        clientId: data.clientId ?? "",
        clientName: data.clientName ?? "",
        accountantId: data.accountantId ?? "",
        accountantName: data.accountantName ?? "",
        routeId: data.routeId ?? "",
        routeName: data.routeName ?? "",
        debtId: data.debtId ?? "",
        debtName: data.debtName ?? "",
        collectorId: data.collectorId ?? "",
        collectorName: data.collectorName ?? "",
    };
}

/**
 * Convierte una entidad de dominio Disbursement al formato plano para guardar en Firestore.
 * Conerva el campo createdAt como un Timestamp de Firestore.
 * 
 * @param disbursement Entidad de dominio
 */
export function disbursementToDocument(
    disbursement: Omit<Disbursement, "id"> | Disbursement
): DocumentData {
    // Parsear la cadena de fecha a Timestamp nativo de Firestore
    const createdDate = disbursement.createdAt
        ? new Date(disbursement.createdAt)
        : new Date();

    const docData: DocumentData = {
        createdAt: Timestamp.fromDate(createdDate),
        amount: disbursement.amount,
        deliveredAmount: disbursement.deliveredAmount,
        pendingAmount: disbursement.pendingAmount,
        method: disbursement.method,
        isValidCollector: disbursement.isValidCollector,
        updatedAt: disbursement.updatedAt,
        isValidAccountant: disbursement.isValidAccountant,
        status: disbursement.status,
        accountantNotes: disbursement.accountantNotes,
        clientId: disbursement.clientId,
        clientName: disbursement.clientName,
        accountantId: disbursement.accountantId,
        accountantName: disbursement.accountantName,
        routeId: disbursement.routeId,
        routeName: disbursement.routeName,
        debtId: disbursement.debtId,
        debtName: disbursement.debtName,
        collectorId: disbursement.collectorId ?? null,
        collectorName: disbursement.collectorName ?? null,
    };

    // Firestore rechaza guardar campos con valor 'undefined'.
    // Solo los incluimos si tienen un valor definido.
    if (disbursement.bankAccountId !== undefined) {
        docData.bankAccountId = disbursement.bankAccountId;
    }

    if (disbursement.idProofOfPayment !== undefined) {
        docData.idProofOfPayment = disbursement.idProofOfPayment;
    }

    return docData;
}