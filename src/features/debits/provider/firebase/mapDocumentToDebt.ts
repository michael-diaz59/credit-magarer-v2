import { type DocumentData } from "firebase/firestore";
import type { Debt, DebtType } from "../../domain/business/entities/Debt";
import { decodeDate, encodeDate } from "../../../shared/firebase/codeDecodeTime";
// Importa tu tipo Debt aquí

export const documentToDebt = (doc: DocumentData, id?: string): Debt => {
    // Si pasas un snapshot, extraemos la data y el id automáticamente
    const data = "data" in doc ? doc.data() : doc;
    const documentId = "id" in doc ? doc.id : (id ?? "");


    return {
        id: documentId,
        prenda: data.prenda ?? false,
        prendaValue: data.prendaValue ?? 0,
        prendaDescription: data.prendaDescription ?? "",
        creditPaid: data.earning ?? false,
        papeleria: data.papeleria ?? 0,
        capitalPaid: data.capitalPaid ?? 0,
        interestPaid: data.interestPaid ?? 0,
        remainingToCompleteCredit: data.remainingToCompleteCredit ?? 0,
        totalInterest: data.totalInterest ?? 0,
        routeId: data.routeId ?? "",
        type: transformacionType(data.type),
        idVisit: data.idVisit ?? "",
        debtTerms: data.debtTerms ?? "diario",
        name: "Crédito " + extraerNumeroDeString(data.name),
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

export const DebtToDocumentData = (debt: Omit<Debt, "id">): DocumentData => {
    console.log("doc", debt)
    return {
        prenda: debt.prenda,
        prendaDescription: debt.prendaDescription,
        prendaValue: debt.prendaValue,
        totalInterest: debt.totalInterest,
        remainingToCompleteCredit: debt.remainingToCompleteCredit,
        capitalPaid: debt.capitalPaid,
        interestPaid: debt.interestPaid,
        creditPaid: debt.creditPaid,
        papeleria: debt.papeleria,
        routeId: debt.routeId,
        type: debt.type,
        idVisit: debt.idVisit,
        debtTerms: debt.debtTerms,
        name: extraerNumeroDeString(debt.name).toString(),
        diasMes: debt.diasMes,
        status: debt.status,
        delivered: debt.delivered,
        deliveredStatus: debt.deliveredStatus,
        renewalPayment: debt.renewalPayment,
        capital: debt.capital,
        totalAmount: debt.totalAmount,
        totalPaid: debt.totalPaid,
        totalPaymentForLate: debt.totalPaymentForLate,
        interestRate: debt.interestRate,
        installmentCount: debt.installmentCount,
        installmentsPaid: debt.installmentsPaid,
        overdueInstallmentsCount: debt.overdueInstallmentsCount,
        clientId: debt.clientId,
        costumerName: debt.costumerName,
        costumerDocument: debt.costumerDocument,
        originalDebt: debt.originalDebt,
        renewedToDebtId: debt.renewedToDebtId,

        // Mapeo de fechas utilizando la lógica de normalización
        startDate: debt.startDate ? encodeDate(debt.startDate) : "",
        createdAt: debt.createdAt ? encodeDate(debt.createdAt) : "",
        firstDueDate: debt.firstDueDate ? encodeDate(debt.firstDueDate) : "",
        nextPaymentDue: debt.nextPaymentDue ? encodeDate(debt.nextPaymentDue) : "",
        dateLastPayment: debt.dateLastPayment ? encodeDate(debt.dateLastPayment) : "",
    };
};

export function extraerNumeroDeString(texto: string): number {
    // La RegEx /\d+/g busca secuencias de uno o más números en el texto
    const coincidencias = texto.match(/\d+/);

    // Si encuentra números, los une y los convierte a tipo 'number'
    if (coincidencias) {
        return Number(coincidencias[0]);
    }

    // Si el string no tenía ningún número (ej: "credit-none"), devuelve null
    return 0;
}

export const transformacionType = (type: string): DebtType => {
    if (type === "credito") return "fijo"
    if (type === "variable") return "variable"
    return "fijo"
}