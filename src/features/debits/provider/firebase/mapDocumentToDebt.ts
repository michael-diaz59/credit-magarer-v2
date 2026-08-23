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
        lateInterestRate: data.lateInterestRate ?? 0,
        name: "Crédito " + extraerNumeroDeString(data.name ?? ""),
        type: transformacionType(data.type),
        status: data.status ?? "tentativa",
        routeId: data.routeId ?? "",
        idVisit: data.idVisit,
        prepayment: data.prepayment,

        // --- INFORMACIÓN DEL CLIENTE ---
        clientId: data.clientId ?? "",
        clientName: data.clientName ?? "",
        clientDocument: data.clientDocument ?? "",

        // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
        debtTerms: data.debtTerms ?? "diario",
        daysPerMonth: data.daysPerMonth,
        interestRate: data.interestRate ?? 0,
        capital: data.capital ?? 0,
        interest: data.interest ?? 0,
        amount: data.amount ?? 0,
        arrears: data.arrears ?? 0,
        total: data.total ?? 0,
        processingFee: data.processingFee ?? 0,

        // --- DESEMBOLSO Y ENTREGA ---
        delivered: data.delivered ?? false,
        deliveredStatus: data.deliveredStatus ?? "false_preparacion",

        // --- GARANTÍAS Y PRENDA ---
        pledge: data.pledge ?? false,
        pledgeDescription: data.pledgeDescription,
        pledgeValue: data.pledgeValue,

        // --- SEGUIMIENTO DE PAGOS Y SALDOS ---
        capitalPaid: data.capitalPaid ?? 0,
        interestPaid: data.interestPaid ?? 0,
        amountPaid: data.amountPaid ?? 0,
        arrearsPaid: data.arrearsPaid ?? 0,
        totalPaid: data.totalPaid ?? 0,

        remainingCapitalToPay: data.remainingCapitalToPay ?? 0,
        remainingInterestToPay: data.remainingInterestToPay ?? 0,
        remainingAmountToPay: data.remainingAmountToPay ?? 0,
        remainingArrearsToPay: data.remainingArrearsToPay ?? 0,
        remainingTotalToPay: data.remainingTotalToPay ?? 0,

        percentageOfCapitalPaid: data.percentageOfCapitalPaid ?? 0,
        percentageOfInteresPaid: data.percentageOfInteresPaid ?? 0,
        percentageOfAmountPaid: data.percentageOfAmountPaid ?? 0,
        porcentageOfArrearsPaid: data.porcentageOfArrearsPaid ?? 0,
        percentageOfTotalPaid: data.percentageOfTotalPaid ?? 0,

        // --- GESTIÓN DE MORA Y RETRASO ---
        numberOfArrearsInstallments: data.numberOfArrearsInstallments ?? 0,
        numberOfArrearsDays: data.numberOfArrearsDays ?? 0,
        maxNumberOfArrearsDays: data.maxNumberOfArrearsDays ?? 0,
        totalArrearsDays: data.totalArrearsDays ?? 0,

        // --- CUOTAS Y FECHAS (yyyy-mm-dd) ---
        installmentCount: data.installmentCount ?? 0,
        installmentsPaid: data.installmentsPaid ?? 0,
        createdAt: decodeDate(data.createdAt),
        startDate: decodeDate(data.startDate),
        nextPaymentDue: decodeDate(data.nextPaymentDue),
        dateLastPayment: data.dateLastPayment ? decodeDate(data.dateLastPayment) : undefined,
        expectedEndDate: decodeDate(data.expectedEndDate),
        closedAt: data.closedAt ? decodeDate(data.closedAt) : undefined,

        // --- RENOVACIONES ---
        renewalPayment: data.renewalPayment ?? 0,
        originalDebt: data.originalDebt,
        renewedToDebtId: data.renewedToDebtId,

        // --- OBSERVACIONES Y NOTAS ---
        collectorNotes: data.collectorNotes,
        AuditorNotes: data.AuditorNotes,
        accountantNotes: data.accountantNotes,
        advisorNotes: data.advisorNotes,
    };
};

export const DebtToDocumentData = (debt: Omit<Debt, "id">): DocumentData => {
    console.log("doc", debt);
    return {
        name: debt.name ? extraerNumeroDeString(debt.name).toString() : "",
        type: debt.type,
        status: debt.status,
        routeId: debt.routeId,
        idVisit: debt.idVisit,
        prepayment: debt.prepayment,

        // --- INFORMACIÓN DEL CLIENTE ---
        clientId: debt.clientId,
        clientName: debt.clientName,
        clientDocument: debt.clientDocument,

        // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
        debtTerms: debt.debtTerms,
        daysPerMonth: debt.daysPerMonth,
        interestRate: debt.interestRate,
        capital: debt.capital,
        interest: debt.interest,
        amount: debt.amount,
        arrears: debt.arrears,
        total: debt.total,
        processingFee: debt.processingFee,

        // --- DESEMBOLSO Y ENTREGA ---
        delivered: debt.delivered,
        deliveredStatus: debt.deliveredStatus,

        // --- GARANTÍAS Y PRENDA ---
        pledge: debt.pledge,
        pledgeDescription: debt.pledgeDescription,
        pledgeValue: debt.pledgeValue,

        // --- SEGUIMIENTO DE PAGOS Y SALDOS ---
        capitalPaid: debt.capitalPaid,
        interestPaid: debt.interestPaid,
        amountPaid: debt.amountPaid,
        arrearsPaid: debt.arrearsPaid,
        totalPaid: debt.totalPaid,

        remainingCapitalToPay: debt.remainingCapitalToPay,
        remainingInterestToPay: debt.remainingInterestToPay,
        remainingAmountToPay: debt.remainingAmountToPay,
        remainingArrearsToPay: debt.remainingArrearsToPay,
        remainingTotalToPay: debt.remainingTotalToPay,

        percentageOfCapitalPaid: debt.percentageOfCapitalPaid,
        percentageOfInteresPaid: debt.percentageOfInteresPaid,
        percentageOfAmountPaid: debt.percentageOfAmountPaid,
        porcentageOfArrearsPaid: debt.porcentageOfArrearsPaid,
        percentageOfTotalPaid: debt.percentageOfTotalPaid,

        // --- GESTIÓN DE MORA Y RETRASO ---
        numberOfArrearsInstallments: debt.numberOfArrearsInstallments,
        numberOfArrearsDays: debt.numberOfArrearsDays,
        maxNumberOfArrearsDays: debt.maxNumberOfArrearsDays,
        totalArrearsDays: debt.totalArrearsDays,

        // --- CUOTAS Y FECHAS (yyyy-mm-dd) ---
        installmentCount: debt.installmentCount,
        installmentsPaid: debt.installmentsPaid,
        createdAt: encodeDate(debt.createdAt),
        startDate: encodeDate(debt.startDate),
        nextPaymentDue: encodeDate(debt.nextPaymentDue),
        dateLastPayment: debt.dateLastPayment ? encodeDate(debt.dateLastPayment) : undefined,
        expectedEndDate: encodeDate(debt.expectedEndDate),
        closedAt: debt.closedAt ? encodeDate(debt.closedAt) : undefined,

        // --- RENOVACIONES ---
        renewalPayment: debt.renewalPayment,
        originalDebt: debt.originalDebt,
        renewedToDebtId: debt.renewedToDebtId,

        // --- OBSERVACIONES Y NOTAS ---
        collectorNotes: debt.collectorNotes,
        Auditornotes: debt.AuditorNotes,
        accountantNotes: debt.accountantNotes,
        advisorNotes: debt.advisorNotes,
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