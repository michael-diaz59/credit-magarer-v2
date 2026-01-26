import {
    collection,
    query,
    where,
    getDocs,
    doc,
    writeBatch,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { InstallmentGateway } from "../../domain/infraestructure/DebtGatweay";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok } from "../../../../core/helpers/ResultC";
import type { UpdateInstallmentByDebtInput, UpdateInstallmentByDebtOutput } from "../../domain/business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { GetInstallmentsByDebtInput, GetInstallmentsByDebtOutput } from "../../domain/business/useCases/installment/GetInstallmentsByDebtCase";
import { installmentConverter } from "./Convert";
import type { Installment } from "../../domain/business/entities/Installment";
import type { CreateInstallmentsGatewayInput, CreateInstallmentsOutput } from "../../domain/business/useCases/installment/CreateInstallmentsUseCase";

export class FirebaseInstallmentRepository implements InstallmentGateway {
    async createForNewDebt(input: CreateInstallmentsGatewayInput): Promise<CreateInstallmentsOutput> {
        try {
            const { companyId, input: installments } = input;

            const batch = writeBatch(firestore);

            const collectionRef = collection(
                firestore,
                "companies",
                companyId,
                "installments"
            );

            for (const installment of installments) {
                // Firestore genera el id automáticamente
                const docRef = doc(collectionRef);

                // NUNCA guardes el id dentro del documento
                batch.set(docRef, installment);
            }

            await batch.commit();

            return { state: ok(null) };

        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "NETWORK_ERROR" }) };
            }

            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }



    async updateByDebt(
        input: UpdateInstallmentByDebtInput
    ): Promise<UpdateInstallmentByDebtOutput> {
        try {
            const batch = writeBatch(firestore);

            for (const installment of input.installments) {
                const ref = doc(
                    firestore,
                    "companies",
                    input.companyId,
                    "installments",
                    installment.id
                );

                //  Nunca mandes el id dentro del documento
                const { ...data } = installment;

                batch.update(ref, data);
            }

            await batch.commit();

            return { state: ok(null) };
        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "NETWORK_ERROR" }) };
            }

            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }

    async getByDebt(
        input: GetInstallmentsByDebtInput
    ): Promise<GetInstallmentsByDebtOutput> {
        try {
            const ref = collection(
                firestore,
                "companies",
                input.companyId,
                "installments"
            ).withConverter(installmentConverter);

            const q = query(
                ref,
                where("debtId", "==", input.debtId)
            );

            const snapshot = await getDocs(q);

            const installments = snapshot.docs.map(doc => doc.data());

            return { state: ok<Installment[]>(installments) };
        } catch (error) {
            if (error instanceof FirebaseError) {
                return { state: fail({ code: "NETWORK_ERROR" }) };
            }
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }
}
