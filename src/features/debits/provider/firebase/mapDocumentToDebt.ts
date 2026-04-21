import { type DocumentData } from "firebase/firestore";
import type { Debt } from "../../domain/business/entities/Debt";
import { decodeDate, encodeDate } from "../../../shared/firebase/codeDecodeTime";
// Importa tu tipo Debt aquí

export const documentToDebt = (doc: DocumentData, id?: string): Debt => {
    // Si pasas un snapshot, extraemos la data y el id automáticamente
    const data = "data" in doc ? doc.data() : doc;
    const documentId = "id" in doc ? doc.id : (id ?? "");


    return {
        id: documentId,
        earning: data.earning ?? false,
        papeleria: data.papeleria ?? 0,
        collectorId: data.collectorId ?? "",
        routeId: data.routeId ?? "",
        type: data.type ?? "credito",
        idVisit: data.idVisit ?? "",
        debtTerms: data.debtTerms ?? "diario",
        name: data.name ?? "",
        diasMes: data.diasMes ?? 30,
        status: data.status ?? "tentativa",
        delivered: data.delivered ?? false,
        deliveredStatus: data.deliveredStatus ?? "false_preparacion",
        renewalPayment: data.renewalPayment ?? 0,
        capital: data.capital ?? 0,
        totalAmount: data.totalAmount ?? 0,
        totalPaid: data.totalPaid ?? 0,
        totalPaymentForLate: data.totalPaymentForLate ?? 0,
        interestRate: data.interestRate ?? 0,
        installmentCount: data.installmentCount ?? 0,
        installmentsPaid: data.installmentsPaid ?? 0,
        overdueInstallmentsCount: data.overdueInstallmentsCount ?? 0,
        clientId: data.clientId ?? "",
        costumerName: data.costumerName ?? "",
        costumerDocument: data.costumerDocument ?? "",
        originalDebt: data.originalDebt ?? "",
        renewedToDebtId: data.renewedToDebtId ?? "",

        // Mapeo de fechas utilizando la lógica de normalización
        startDate: data.startDate ? decodeDate(data.startDate) : "",
        createdAt: data.createdAt ? decodeDate(data.createdAt) : "",
        firstDueDate: data.firstDueDate ? decodeDate(data.firstDueDate) : "",
        nextPaymentDue: data.nextPaymentDue ? decodeDate(data.nextPaymentDue) : "",
        dateLastPayment: data.dateLastPayment ? decodeDate(data.dateLastPayment) : "",
    };
};

export const DebtToDocumentData = (doc: Omit<Debt, "id">): DocumentData => {
    return {
        papeleria: doc.papeleria,
        collectorId: doc.collectorId,
        routeId: doc.routeId,
        earning: doc.earning,
        type: doc.type,
        idVisit: doc.idVisit,
        debtTerms: doc.debtTerms,
        name: doc.name,
        diasMes: doc.diasMes,
        status: doc.status,
        delivered: doc.delivered,
        deliveredStatus: doc.deliveredStatus,
        renewalPayment: doc.renewalPayment,
        capital: doc.capital,
        totalAmount: doc.totalAmount,
        totalPaid: doc.totalPaid,
        totalPaymentForLate: doc.totalPaymentForLate,
        interestRate: doc.interestRate,
        installmentCount: doc.installmentCount,
        installmentsPaid: doc.installmentsPaid,
        overdueInstallmentsCount: doc.overdueInstallmentsCount,
        clientId: doc.clientId,
        costumerName: doc.costumerName,
        costumerDocument: doc.costumerDocument,
        originalDebt: doc.originalDebt,
        renewedToDebtId: doc.renewedToDebtId,

        // Mapeo de fechas utilizando la lógica de normalización
        startDate: doc.startDate ? encodeDate(doc.startDate) : "",
        createdAt: doc.createdAt ? encodeDate(doc.createdAt) : "",
        firstDueDate: doc.firstDueDate ? encodeDate(doc.firstDueDate) : "",
        nextPaymentDue: doc.nextPaymentDue ? encodeDate(doc.nextPaymentDue) : "",
        dateLastPayment: doc.dateLastPayment ? encodeDate(doc.dateLastPayment) : "",
    };
};