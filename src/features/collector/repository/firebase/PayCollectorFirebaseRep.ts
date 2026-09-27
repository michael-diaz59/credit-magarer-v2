import { addDoc, collection, getDocs, query, where, type DocumentData } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";

import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";

import type { CreatePayCollectorOutput, CreatePayCollectorError } from "../../domain/business/useCases/CreatePayCollectorCase";
import type { CreatePayCollectorGatewayInput, PayCollectorGateway } from "../../domain/infraestructure/PayCollectorGateway";
import type { CollectorPayment } from "../../domain/business/entities/CollectorPayment";
import type { GetPayCollectorsError, GetPayCollectorsInput, GetPayCollectorsOutput } from "../../domain/business/useCases/GetPaysCollectorCase";
import { AddressToDocument, DocumentToAddress } from "../../../../core/controllers/mappers";

export class FirebaseUserRepository implements PayCollectorGateway {

    /**obtener los pagos que se deben pagar al cliente */
    async getPayCollectors(
        input: GetPayCollectorsInput
    ): Promise<
        Result<GetPayCollectorsOutput, GetPayCollectorsError>
    > {
        const { companyId, collectorId } = input;

        try {
            const ref = collection(
                firestore,
                "companies",
                companyId,
                "payCollector"
            );

            const q = collectorId
                ? query(ref, where("collectorId", "==", collectorId), where("ToPay", "==", true))
                : ref;

            const snapshot = await getDocs(q);

            const payments: CollectorPayment[] =
                snapshot.docs.map((doc) =>
                    DocumentToCollectorPayment(
                        doc.data(),
                        doc.id
                    )
                );

            return ok({ state: payments });
        } catch (error) {
            console.error(error);

            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async createPayCollector(
        input: CreatePayCollectorGatewayInput
    ): Promise<
        Result<CreatePayCollectorOutput, CreatePayCollectorError>
    > {
        try {

            const ref = collection(
                firestore,
                "companies",
                input.companyId,
                "payCollector"
            );

            await addDoc(ref, CollectorPaymentToDocument(input.payCollector));

            return ok({ state: null });
        } catch (error) {
            console.error(error);

            if (error instanceof FirebaseError) {
                console.log(error)
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }


}

export function CollectorPaymentToDocument(
    collectorPayment: Omit<CollectorPayment, "id">
): DocumentData {
    return {
        collectorId: collectorPayment.collectorId,
        collectorName: collectorPayment.collectorName,
        collectorNotes: collectorPayment.collectorNotes,

        clientId: collectorPayment.clientId,
        clientName: collectorPayment.clientName,
        clientDocument: collectorPayment.clientDocument,
        clientPhone: collectorPayment.clientPhone,

        clientAddres: AddressToDocument(
            collectorPayment.clientAddres
        ),

        amount: collectorPayment.amount,
        amountPaid: collectorPayment.amountPaid,
        amountPending: collectorPayment.amountPending,
        percentageOfAmountPaid: collectorPayment.percentageOfAmountPaid,

        status: collectorPayment.status,
        ToPay: collectorPayment.ToPay,

        registresDate: collectorPayment.registresDate,
        dateToPay: collectorPayment.dateToPay,
        paymentDate: collectorPayment.paymentDate,

        routeId: collectorPayment.routeId,
        routeName: collectorPayment.routeName,

        debtId: collectorPayment.debtId,

        accountantId: collectorPayment.accountantId,
        accountantNotes: collectorPayment.accountantNotes,
    };
}

export function DocumentToCollectorPayment(
    document: DocumentData,
    id: string
): CollectorPayment {
    return {
        id,

        collectorId: document.collectorId,
        collectorName: document.collectorName,
        collectorNotes: document.collectorNotes,

        clientId: document.clientId,
        clientName: document.clientName,
        clientDocument: document.clientDocument,
        clientPhone: document.clientPhone,

        clientAddres: DocumentToAddress(
            document.clientAddres
        ),

        amount: document.amount,
        amountPaid: document.amountPaid,
        amountPending: document.amountPending,
        percentageOfAmountPaid: document.percentageOfAmountPaid,

        status: document.status,
        ToPay: document.ToPay,

        registresDate: document.registresDate,
        dateToPay: document.dateToPay,
        paymentDate: document.paymentDate,

        routeId: document.routeId,
        routeName: document.routeName,

        debtId: document.debtId,

        accountantId: document.accountantId,
        accountantNotes: document.accountantNotes,
    };
}