import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";

import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";

import type { CreatePayCollectorInput, CreatePayCollectorOutput, CreatePayCollectorError } from "../../domain/business/useCases/CreatePayCollectorCase";
import type { PayCollectorGateway } from "../../domain/infraestructure/PayCollectorGateway";
import type { CollectorPayment } from "../../domain/business/entities/CollectorPayment";
import type { GetPayCollectorsError, GetPayCollectorsInput, GetPayCollectorsOutput } from "../../domain/business/useCases/GetPaysCollectorCase";

export class FirebaseUserRepository implements PayCollectorGateway {

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
                ? query(ref, where("collectorId", "==", collectorId))
                : ref;

            const snapshot = await getDocs(q);

            const payments: CollectorPayment[] =
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<CollectorPayment, "id">),
                }));

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
        input: CreatePayCollectorInput
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

            await addDoc(ref, {
                collectorId: input.payCollector.collectorId,
                amount: input.payCollector.amount, // 👈 o el valor que corresponda
                registresDate: input.payCollector.registresDate,
                paymentDate: input.payCollector.paymentDate,
            });

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