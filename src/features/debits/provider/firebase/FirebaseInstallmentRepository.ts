import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  getDoc,
  updateDoc,
  type DocumentData,
  Timestamp,
  getAggregateFromServer,
  sum,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { InstallmentGateway } from "../../domain/infraestructure/DebtGatweay";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type {
  UpdateInstallmentByDebtInput,
  UpdateInstallmentByDebtOutput,
} from "../../domain/business/useCases/installment/UpdateInstallmentsByDebtCase";
import type {
  GetInstallmentsByDebtInput,
  GetInstallmentsByDebtOutput,
} from "../../domain/business/useCases/installment/GetInstallmentsByDebtCase";
import type { Installment } from "../../domain/business/entities/Installment";
import type {
  CreateInstallmentsGatewayInput,
  CreateInstallmentsOutput,
} from "../../domain/business/useCases/installment/CreateInstallmentsUseCase";
import type {
  GetByCollectorInput,
  GetByCollectorOutput,
  GetByCollectorError,
} from "../../domain/business/useCases/installment/GetByCollectorCase";
import type {
  GetByIdInput,
  GetByIdOutput,
  GetByIdError,
} from "../../domain/business/useCases/installment/GetByIdCase";
import type {
  UpdateByIdInput,
  UpdateByIdOutput,
  UpdateByIdError,
} from "../../domain/business/useCases/installment/UpdateByIdCase";
import { encodeDate, decodeDate } from "../../../shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";
import type { GetManagementInstallmentsInput } from "../../domain/business/useCases/installment/GetManagementInstallmentsUseCase";

export class FirebaseInstallmentRepository implements InstallmentGateway {


  private InstallmetToDocument(installment: Omit<Installment, "id">): DocumentData {
    const result: DocumentData = {
      companyId: installment.companyId,
      debtId: installment.debtId,
      interestRate: installment.interestRate,
      lateInterestRate: installment.lateInterestRate,
      routeId: installment.routeId,
      costumerId: installment.costumerId,
      costumerDocument: installment.costumerDocument,
      costumerName: installment.costumerName,
      costumerNumber: installment.costumerNumber,
      costumerAddres: {
        address: installment.costumerAddres?.address ?? "",
        neighborhood: installment.costumerAddres?.neighborhood ?? "",
        stratum: installment.costumerAddres?.stratum ?? 0,
        city: installment.costumerAddres?.city ?? "",
      },
      managed: installment.managed,
      managementDate: installment.managementDate ? encodeDate(installment.managementDate) : undefined,
      attemptedCollection: installment.attemptedCollection,
      dateAttemptedPayment: installment.dateAttemptedPayment ? encodeDate(installment.dateAttemptedPayment) : undefined,
      descriptionAttemptedPayment: installment.descriptionAttemptedPayment,
      locationAttemptedPayment: installment.locationAttemptedPayment,
      installmentTotalNumber: installment.installmentTotalNumber,
      installmentNumber: installment.installmentNumber,
      amount: installment.amount,
      paidAmount: installment.paidAmount,
      latepayment: installment.latepayment,
      dueDate: installment.dueDate ? encodeDate(installment.dueDate) : undefined,
      lateDueDate: installment.lateDueDate ? encodeDate(installment.lateDueDate) : undefined,
      status: installment.status,
      paidAt: installment.paidAt ? encodeDate(installment.paidAt) : undefined,
      createdAt: installment.createdAt ? encodeDate(installment.createdAt) : undefined,
      payments: installment.payments,
      paidLatePayment: installment.paidLatePayment,
      aplazado: installment.aplazado,
    };

    return removeUndefined(result);
  }


  private DocumentToInstallment(id: string, data: DocumentData): Installment {
    return {
      id,
      companyId: data.companyId ?? "",
      debtId: data.debtId ?? "",
      interestRate: data.interestRate ?? 0,
      lateInterestRate: data.lateInterestRate ?? 0,
      routeId: data.routeId ?? "",
      costumerId: data.costumerId ?? "",
      costumerDocument: data.costumerDocument ?? "",
      costumerName: data.costumerName ?? "",
      costumerNumber: data.costumerNumber ?? "",

      costumerAddres: {
        address: data.costumerAddres?.address ?? "",
        neighborhood: data.costumerAddres?.neighborhood ?? "",
        stratum: data.costumerAddres?.stratum ?? 0,
        city: data.costumerAddres?.city ?? "",
      },
      managed: data.managed ?? false,
      managementDate: data.managementDate ? decodeDate(data.managementDate) : "",

      attemptedCollection: data.attemptedCollection ?? false,
      dateAttemptedPayment: data.dateAttemptedPayment ? decodeDate(data.dateAttemptedPayment) : "",
      descriptionAttemptedPayment: data.descriptionAttemptedPayment ?? "",
      locationAttemptedPayment: data.locationAttemptedPayment,

      installmentTotalNumber: data.installmentTotalNumber ?? 0,
      installmentNumber: data.installmentNumber ?? 0,
      amount: data.amount ?? 0,
      paidAmount: data.paidAmount ?? 0,
      latepayment: data.latepayment ?? 0,
      dueDate: data.dueDate ? decodeDate(data.dueDate) : "",
      lateDueDate: data.lateDueDate ? decodeDate(data.lateDueDate) : "",
      status: data.status ?? "pendiente",
      paidAt: data.paidAt ? decodeDate(data.paidAt) : "",
      createdAt: data.createdAt ? decodeDate(data.createdAt) : "",
      payments: data.payments ?? [],
      paidLatePayment: data.paidLatePayment ?? 0,
      aplazado: data.aplazado ?? false,
    };
  }




  async updateById(
    input: UpdateByIdInput,
  ): Promise<Result<UpdateByIdOutput, UpdateByIdError>> {
    const { companyId, installment } = input;

    try {
      const ref = doc(
        firestore,
        "companies",
        companyId,
        "installments",
        installment.id,
      );

      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        return fail({ code: "INSTALLMENT_NOT_FOUND" });
      }

      await updateDoc(ref, this.InstallmetToDocument(installment));

      return ok({
        state: null,
      });
    } catch (error) {
      console.log(error);

      console.log(installment);

      if (error instanceof FirebaseError) {
        if (error.code === "unavailable") {
          return fail({ code: "NETWORK_ERROR" });
        }
      }

      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getById(
    input: GetByIdInput,
  ): Promise<Result<GetByIdOutput, GetByIdError>> {
    const { companyId, installmentId } = input;

    try {
      const ref = doc(
        firestore,
        "companies",
        companyId,
        "installments",
        installmentId,
      );

      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        return fail({ code: "UNKNOWN_ERROR" });
      }
      const raw: DocumentData = snapshot.data();
      const installment = this.DocumentToInstallment(snapshot.id, raw);

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
    input: GetByCollectorInput,
  ): Promise<Result<GetByCollectorOutput, GetByCollectorError>> {
    const { companyId, collectorId, status } = input;

    try {
      console.log("llega");
      console.log(collectorId);

      const ref = collection(firestore, "companies", companyId, "installments");
      console.log(collectorId);

      const constraints = [where("collectorId", "==", collectorId)];

      // 👉 aplicar filtro solo si existe y tiene estados
      if (status && status.length > 0) {
        if (status.length === 1) {
          constraints.push(where("status", "==", status[0]));
        } else {
          constraints.push(where("status", "in", status));
        }
      }

      const q = query(ref, ...constraints);

      const snapshot = await getDocs(q);

      const installments: Installment[] = snapshot.docs.map((doc) =>
        this.DocumentToInstallment(doc.id, doc.data()),
      );

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
  async createForNewDebt(
    input: CreateInstallmentsGatewayInput,
  ): Promise<CreateInstallmentsOutput> {
    try {
      const { companyId, input: installments } = input;

      const batch = writeBatch(firestore);

      const collectionRef = collection(
        firestore,
        "companies",
        companyId,
        "installments",
      );

      for (const installment of installments) {
        // Firestore genera el id automáticamente
        const docRef = doc(collectionRef);

        // NUNCA guardes el id dentro del documento
        batch.set(docRef, this.InstallmetToDocument(installment));
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
    input: UpdateInstallmentByDebtInput,
  ): Promise<UpdateInstallmentByDebtOutput> {
    try {
      const batch = writeBatch(firestore);

      for (const installment of input.installments) {
        const ref = doc(
          firestore,
          "companies",
          input.companyId,
          "installments",
          installment.id,
        );

        batch.update(ref, this.InstallmetToDocument(installment));
      }

      await batch.commit();

      return { state: ok(null) };
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.log(error);
        return { state: fail({ code: "NETWORK_ERROR" }) };
      }

      return { state: fail({ code: "UNKNOWN_ERROR" }) };
    }
  }

  async getByDebt(
    input: GetInstallmentsByDebtInput,
  ): Promise<GetInstallmentsByDebtOutput> {
    try {
      const ref = collection(
        firestore,
        "companies",
        input.companyId,
        "installments",
      )

      const q = query(ref, where("debtId", "==", input.debtId));

      const snapshot = await getDocs(q);

      const installments = snapshot.docs.map((doc) =>
        this.DocumentToInstallment(doc.id, doc.data()),
      );

      return { state: ok<Installment[]>(installments) };
    } catch (error) {
      if (error instanceof FirebaseError) {
        return { state: fail({ code: "NETWORK_ERROR" }) };
      }
      return { state: fail({ code: "UNKNOWN_ERROR" }) };
    }
  }


  async deleteBatch(
    companyId: string,
    installmentIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Result<null, any>> {
    try {
      const batch = writeBatch(firestore);

      for (const id of installmentIds) {
        const ref = doc(firestore, "companies", companyId, "installments", id);
        batch.delete(ref);
      }

      await batch.commit();
      return ok(null);
    } catch (error) {
      console.log(error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getByDebtAndNumber(input: {
    companyId: string;
    debtId: string;
    installmentNumber: number;
  }): Promise<Result<Installment | null, any>> {
    try {
      const { companyId, debtId, installmentNumber } = input;
      const ref = collection(firestore, "companies", companyId, "installments");

      const q = query(
        ref,
        where("debtId", "==", debtId),
        where("installmentNumber", "==", installmentNumber),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return ok(null);
      }

      const docVal = snapshot.docs[0];
      const installment = this.DocumentToInstallment(docVal.id, docVal.data());

      return ok(installment);
    } catch (error) {
      console.error("[getByDebtAndNumber]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getInstallmentsSummaryByDateRange(input: {
    companyId: string;
    startDate: string;
    endDate: string;
  }): Promise<Result<{
    totalAmount: number;
    totalPaidAmount: number;
    totalPaidLatePayment: number;
    totalLatePayment: number;
  }, any>> {
    const { companyId, startDate, endDate } = input;
    try {
      const ref = collection(firestore, "companies", companyId, "installments");

      // Normalize dates to Timestamps
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      const q = query(
        ref,
        where("dueDate", ">=", startTimestamp),
        where("dueDate", "<=", endTimestamp)
      );

      const snapshot = await getAggregateFromServer(q, {
        totalAmount: sum("amount"),
        totalPaidAmount: sum("paidAmount"),
        totalPaidLatePayment: sum("paidLatePayment"),
        totalLatePayment: sum("latepayment"),
      });

      const data = snapshot.data();

      return ok({
        totalAmount: data.totalAmount ?? 0,
        totalPaidAmount: data.totalPaidAmount ?? 0,
        totalPaidLatePayment: data.totalPaidLatePayment ?? 0,
        totalLatePayment: data.totalLatePayment ?? 0,
      });
    } catch (error) {
      console.error("[getInstallmentsSummaryByDateRange]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getPendingInstallmentsForCollector(input: GetManagementInstallmentsInput): Promise<Result<Installment[], any>> {
    const { companyId, routeId, today } = input;
    try {
      const ref = collection(firestore, "companies", companyId, "installments");

      const q = query(
        ref,
        where("routeId", "==", routeId),
        where("status", "in", ["pendiente", "incompleto"])
      );

      const snapshot = await getDocs(q);

      const installments = snapshot.docs.map((doc) =>
        this.DocumentToInstallment(doc.id, doc.data())
      );

      // Filtrado en memoria para las fechas para mayor flexibilidad y evitar índices compuestos complejos
      const filtered = installments.filter((inst) => {
        const isDueDatePastOrToday = inst.dueDate && inst.dueDate <= today;
        const isLateDueDatePastOrToday = inst.lateDueDate && inst.lateDueDate <= today;
        return isDueDatePastOrToday || isLateDueDatePastOrToday;
      });

      return ok(filtered);
    } catch (error) {
      console.error("[getPendingInstallmentsForCollector]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}