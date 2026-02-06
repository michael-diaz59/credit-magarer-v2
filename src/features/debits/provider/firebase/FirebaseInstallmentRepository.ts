import {
    collection,
    query,
    where,
    getDocs,
    doc,
    writeBatch,
    getDoc,
    updateDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { InstallmentGateway } from "../../domain/infraestructure/DebtGatweay";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { UpdateInstallmentByDebtInput, UpdateInstallmentByDebtOutput } from "../../domain/business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { GetInstallmentsByDebtInput, GetInstallmentsByDebtOutput } from "../../domain/business/useCases/installment/GetInstallmentsByDebtCase";
import { installmentConverter } from "./Convert";
import type { Installment } from "../../domain/business/entities/Installment";
import type { CreateInstallmentsGatewayInput, CreateInstallmentsOutput } from "../../domain/business/useCases/installment/CreateInstallmentsUseCase";
import type { GetByCollectorInput, GetByCollectorOutput, GetByCollectorError } from "../../domain/business/useCases/installment/GetByCollectorCase";
import type { GetByIdInput, GetByIdOutput, GetByIdError } from "../../domain/business/useCases/installment/GetByIdCase";
import type { UpdateByIdInput, UpdateByIdOutput, UpdateByIdError } from "../../domain/business/useCases/installment/UpdateByIdCase";

export class FirebaseInstallmentRepository implements InstallmentGateway {
    async updateById(
  input: UpdateByIdInput
): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
  const { companyId, installment } = input;

  try {
    const ref = doc(
      firestore,
      "companies",
      companyId,
      "installments",
      installment.id
    );

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return fail({ code: "INSTALLMENT_NOT_FOUND" });
    }

    // ⚠️ Nunca actualices el ID
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...dataToUpdate } = installment;

    await updateDoc(ref, {
      ...dataToUpdate,
    });

    return ok({
      state: null,
    });
  } catch (error) {
    console.log(error);

    if (error instanceof FirebaseError) {
      if (error.code === "unavailable") {
        return fail({ code: "NETWORK_ERROR" });
      }
    }

    return fail({ code: "UNKNOWN_ERROR" });
  }
}


    async getById(
        input: GetByIdInput
    ): Promise<Result<GetByIdOutput, GetByIdError>> {
        const { companyId, installmentId } = input;

        try {
            const ref = doc(
                firestore,
                "companies",
                companyId,
                "installments",
                installmentId
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const installment: Installment = {
                id: snapshot.id,
                ...(snapshot.data() as Omit<Installment, "id">),
            };

            return ok({
                state: installment,
            });
        } catch (error) {
            console.log(error);

            if (error instanceof FirebaseError) {
                if (error.code === "unavailable") {
                    return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getByCollector(
  input: GetByCollectorInput
): Promise<Result<GetByCollectorOutput, GetByCollectorError>> {
  const { companyId, collectorId, status } = input;

  try {
    const ref = collection(
      firestore,
      "companies",
      companyId,
      "installments"
    );
    console.log(collectorId)
 

    const constraints = [
      where("collectorId", "==", collectorId),
    ];

    // 👉 aplicar filtro solo si existe y tiene estados
    if (status && status.length > 0) {
      if (status.length === 1) {
        constraints.push(
          where("status", "==", status[0])
        );
      } else {
        constraints.push(
          where("status", "in", status)
        );
      }
    }

    const q = query(ref, ...constraints);

    const snapshot = await getDocs(q);

    const installments: Installment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Installment, "id">),
    }));

    return ok({
      state: installments,
    });
  } catch (error) {
    console.log(error);

    if (error instanceof FirebaseError) {
      if (error.code === "unavailable") {
        return fail({ code: "NETWORK_ERROR" });
      }
    }

    return fail({ code: "UNKNOWN_ERROR" });
  }
}
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
