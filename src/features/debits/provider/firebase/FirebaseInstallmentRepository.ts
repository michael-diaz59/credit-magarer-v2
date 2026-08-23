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
  CreateInstallmentsError,
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

      await updateDoc(ref, InstallmentToDocument(installment));

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
      const installment = DocumentToInstallment(snapshot.id, raw);

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
        DocumentToInstallment(doc.id, doc.data()),
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
        batch.set(docRef, InstallmentToDocument(installment));
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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  async createMany(input: {
    companyId: string;
    installments: Installment[];
  }): Promise<Result<void, CreateInstallmentsError>> {
    try {
      const collectionRef = collection(
        firestore,
        "companies",
        input.companyId,
        "installments",
      );

      const chunks = this.chunkArray(input.installments, 200);

      for (const chunk of chunks) {
        const batch = writeBatch(firestore);

        for (const installment of chunk) {
          const docRef = doc(collectionRef);
          // Asignar el id generado en Firestore al objeto original en memoria
          installment.id = docRef.id;

          batch.set(docRef, InstallmentToDocument(installment));
        }

        await batch.commit();
      }

      return ok(undefined);
    } catch (error) {
      console.error("[createMany installments]", error);
      if (error instanceof FirebaseError) {
        return fail({ code: "NETWORK_ERROR" });
      }
      return fail({ code: "UNKNOWN_ERROR" });
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

        batch.update(ref, InstallmentToDocument(installment));
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
        DocumentToInstallment(doc.id, doc.data()),
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
      const installment = DocumentToInstallment(docVal.id, docVal.data());

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

      console.log("start", start);
      console.log("end", end);

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      console.log("startTimestamp", startTimestamp.toDate());
      console.log("endTimestamp", endTimestamp.toDate());

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

      console.log(snapshot.data());

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

  async obtenerGananciasRangoDeTiempo(input: {
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

      console.log("start", start);
      console.log("end", end);

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      console.log("startTimestamp", startTimestamp.toDate());
      console.log("endTimestamp", endTimestamp.toDate());

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

      console.log(snapshot.data());

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
        DocumentToInstallment(doc.id, doc.data())
      );

      // Filtrado en memoria para las fechas para mayor flexibilidad y evitar índices compuestos complejos
      const filtered = installments.filter((inst) => {
        const isDueDatePastOrToday = inst.dueDate && inst.dueDate <= today;
        const isLateDueDatePastOrToday = inst.arrearsDueDate && inst.arrearsDueDate <= today;
        return isDueDatePastOrToday || isLateDueDatePastOrToday;
      });

      return ok(filtered);
    } catch (error) {
      console.error("[getPendingInstallmentsForCollector]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getPendingInstallmentsForCollectorByRoutes(
    input: import("../../domain/business/useCases/installment/GetManagementInstallmentsByRoutesUseCase").GetManagementInstallmentsByRoutesInput
  ): Promise<Result<Installment[], import("../../domain/business/useCases/installment/GetManagementInstallmentsByRoutesUseCase").GetManagementInstallmentsByRoutesError>> {
    const { companyId, routeIds, today } = input;

    if (!routeIds || routeIds.length === 0) {
      return ok([]);
    }

    try {
      const ref = collection(firestore, "companies", companyId, "installments");
      const allInstallments: Installment[] = [];

      // Firestore "in" queries are limited to 30 items
      const chunks = this.chunkArray(routeIds, 30);

      for (const chunk of chunks) {
        const q = query(
          ref,
          where("routeId", "in", chunk),
          where("status", "in", ["pendiente", "incompleto"])
        );

        const snapshot = await getDocs(q);

        const installments = snapshot.docs.map((doc) =>
          DocumentToInstallment(doc.id, doc.data())
        );
        allInstallments.push(...installments);
      }

      // Filtrado en memoria para las fechas para mayor flexibilidad y evitar índices compuestos complejos
      const filtered = allInstallments.filter((inst) => {
        const isDueDatePastOrToday = inst.dueDate && inst.dueDate <= today;
        const isLateDueDatePastOrToday = inst.arrearsDueDate && inst.arrearsDueDate <= today;
        return isDueDatePastOrToday || isLateDueDatePastOrToday;
      });

      return ok(filtered);
    } catch (error) {
      console.error("[getPendingInstallmentsForCollectorByRoutes]", error);
      if (error instanceof FirebaseError) {
        if (error.code === "unavailable") {
          return fail({ code: "NETWORK_ERROR" });
        }
      }
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}

export function InstallmentToDocument(
  installment: Omit<Installment, "id">
): DocumentData {
  const result: DocumentData = {
    // --- IDENTIFICACIÓN Y RUTA ---
    debtId: installment.debtId,
    companyId: installment.companyId,
    routeId: installment.routeId,

    installmentTotalNumber: installment.installmentTotalNumber,
    installmentNumber: installment.installmentNumber,

    // --- INFORMACIÓN DEL CLIENTE ---
    clientId: installment.clientId,
    clientName: installment.clientName,
    clientDocument: installment.clientDocument,
    clientNumber: installment.clientNumber,

    clientAddres: {
      address: installment.clientAddres?.address ?? "",
      neighborhood: installment.clientAddres?.neighborhood ?? "",
      stratum: installment.clientAddres?.stratum ?? 0,
      city: installment.clientAddres?.city ?? "",

      locationGPS: installment.clientAddres?.locationGPS
        ? {
          coordinates:
            installment.clientAddres.locationGPS.coordinates ?? "",
          latitude:
            installment.clientAddres.locationGPS.latitude ?? 0,
          longitude:
            installment.clientAddres.locationGPS.longitude ?? 0,
          accuracy:
            installment.clientAddres.locationGPS.accuracy ?? 0,
        }
        : undefined,
    },

    // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
    interestRate: installment.interestRate,
    arrearsInterestRate: installment.arrearsInterestRate,

    // --- VALORES BASE DE LA CUOTA ---
    capital: installment.capital,
    interest: installment.interest,
    amount: installment.amount,
    arrears: installment.arrears,
    total: installment.total,

    // --- PAGOS REALIZADOS ---
    capitalPaid: installment.capitalPaid,
    interestPaid: installment.interestPaid,
    amountPaid: installment.amountPaid,
    arrearsPaid: installment.arrearsPaid,
    totalPaid: installment.totalPaid,

    // --- PORCENTAJES DE PAGO ---
    percentageOfCapitalPaid: installment.percentageOfCapitalPaid,
    percentageOfInterestPaid: installment.percentageOfInterestPaid,
    percentageOfAmountPaid: installment.percentageOfAmountPaid,
    porcentageOfArrearsPaid: installment.porcentageOfArrearsPaid,
    percentageOfTotalPaid: installment.percentageOfTotalPaid,

    // --- RESTANTE POR PAGAR ---
    remainingCapitalToPay: installment.remainingCapitalToPay,
    remainingInterestToPay: installment.remainingInterestToPay,
    remainingAmountToPay: installment.remainingAmountToPay,
    remainingArrearsToPay: installment.remainingArrearsToPay,
    remainingTotalToPay: installment.remainingTotalToPay,

    // --- MORA Y RETRASO ---
    numberOfArrearsDays: installment.numberOfArrearsDays,

    arrearsDueDate: installment.arrearsDueDate
      ? encodeDate(installment.arrearsDueDate)
      : undefined,

    // --- ESTADO Y FECHAS ---
    status: installment.status,

    dueDate: installment.dueDate
      ? encodeDate(installment.dueDate)
      : undefined,

    createdAt: installment.createdAt
      ? encodeDate(installment.createdAt)
      : undefined,

    paidAt: installment.paidAt
      ? encodeDate(installment.paidAt)
      : undefined,

    payments: installment.payments ?? [],

    // --- GESTIÓN DE COBRO EN CAMPO ---
    deferred: installment.deferred,
    managed: installment.managed,

    managementDate: installment.managementDate
      ? encodeDate(installment.managementDate)
      : undefined,

    attemptedCollection: installment.attemptedCollection,

    dateAttemptedPayment: installment.dateAttemptedPayment
      ? encodeDate(installment.dateAttemptedPayment)
      : undefined,

    descriptionAttemptedPayment:
      installment.descriptionAttemptedPayment ?? "",

    locationAttemptedPayment: installment.locationAttemptedPayment
      ? {
        coordinates:
          installment.locationAttemptedPayment.coordinates ?? "",
        latitude:
          installment.locationAttemptedPayment.latitude ?? 0,
        longitude:
          installment.locationAttemptedPayment.longitude ?? 0,
        accuracy:
          installment.locationAttemptedPayment.accuracy ?? 0,
      }
      : undefined,
  };

  return removeUndefined(result);
}

export function DocumentToInstallment(
  id: string,
  data: DocumentData
): Installment {
  return {
    // --- IDENTIFICACIÓN Y RUTA ---
    id,

    debtId: data.debtId ?? "",
    companyId: data.companyId ?? "",
    routeId: data.routeId ?? "",

    installmentTotalNumber: data.installmentTotalNumber ?? 0,
    installmentNumber: data.installmentNumber ?? 0,

    // --- INFORMACIÓN DEL CLIENTE ---
    clientId: data.clientId ?? "",
    clientName: data.clientName ?? "",
    clientDocument: data.clientDocument ?? "",
    clientNumber: data.clientNumber ?? "",

    clientAddres: {
      address: data.clientAddres?.address ?? "",
      neighborhood: data.clientAddres?.neighborhood ?? "",
      stratum: data.clientAddres?.stratum ?? 0,
      city: data.clientAddres?.city ?? "",

      locationGPS: data.clientAddres?.locationGPS
        ? {
          coordinates:
            data.clientAddres.locationGPS.coordinates ?? "",
          latitude:
            data.clientAddres.locationGPS.latitude ?? 0,
          longitude:
            data.clientAddres.locationGPS.longitude ?? 0,
          accuracy:
            data.clientAddres.locationGPS.accuracy ?? 0,
        }
        : undefined,
    },

    // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
    interestRate: data.interestRate ?? 0,
    arrearsInterestRate: data.arrearsInterestRate ?? 0,

    // --- VALORES BASE DE LA CUOTA ---
    capital: data.capital ?? 0,
    interest: data.interest ?? 0,
    amount: data.amount ?? 0,
    arrears: data.arrears ?? 0,
    total: data.total ?? 0,

    // --- PAGOS REALIZADOS ---
    capitalPaid: data.capitalPaid ?? 0,
    interestPaid: data.interestPaid ?? 0,
    amountPaid: data.amountPaid ?? 0,
    arrearsPaid: data.arrearsPaid ?? 0,
    totalPaid: data.totalPaid ?? 0,

    // --- PORCENTAJES DE PAGO ---
    percentageOfCapitalPaid:
      data.percentageOfCapitalPaid ?? 0,

    percentageOfInterestPaid:
      data.percentageOfInterestPaid ?? 0,

    percentageOfAmountPaid:
      data.percentageOfAmountPaid ?? 0,

    porcentageOfArrearsPaid:
      data.porcentageOfArrearsPaid ?? 0,

    percentageOfTotalPaid:
      data.percentageOfTotalPaid ?? 0,

    // --- RESTANTE POR PAGAR ---
    remainingCapitalToPay:
      data.remainingCapitalToPay ?? 0,

    remainingInterestToPay:
      data.remainingInterestToPay ?? 0,

    remainingAmountToPay:
      data.remainingAmountToPay ?? 0,

    remainingArrearsToPay:
      data.remainingArrearsToPay ?? 0,

    remainingTotalToPay:
      data.remainingTotalToPay ?? 0,

    // --- MORA Y RETRASO ---
    numberOfArrearsDays:
      data.numberOfArrearsDays ?? 0,

    arrearsDueDate: data.arrearsDueDate
      ? decodeDate(data.arrearsDueDate)
      : undefined,

    // --- ESTADO Y FECHAS ---
    status: data.status ?? "pendiente",

    dueDate: data.dueDate
      ? decodeDate(data.dueDate)
      : "",

    createdAt: data.createdAt
      ? decodeDate(data.createdAt)
      : "",

    paidAt: data.paidAt
      ? decodeDate(data.paidAt)
      : undefined,

    payments: data.payments ?? [],

    // --- GESTIÓN DE COBRO EN CAMPO ---
    deferred: data.deferred ?? false,

    managed: data.managed ?? false,

    managementDate: data.managementDate
      ? decodeDate(data.managementDate)
      : undefined,

    attemptedCollection:
      data.attemptedCollection ?? false,

    dateAttemptedPayment: data.dateAttemptedPayment
      ? decodeDate(data.dateAttemptedPayment)
      : undefined,

    descriptionAttemptedPayment:
      data.descriptionAttemptedPayment ?? undefined,

    locationAttemptedPayment:
      data.locationAttemptedPayment
        ? {
          coordinates:
            data.locationAttemptedPayment.coordinates ?? "",
          latitude:
            data.locationAttemptedPayment.latitude ?? 0,
          longitude:
            data.locationAttemptedPayment.longitude ?? 0,
          accuracy:
            data.locationAttemptedPayment.accuracy ?? 0,
        }
        : undefined,
  };

}