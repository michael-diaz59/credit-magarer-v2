import {
    collection,
    getAggregateFromServer,
    query,
    where,
    sum,
} from "firebase/firestore";
import { firestore } from "../../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../../core/helpers/ResultC";
import type { SummaryGateway } from "../../domain/infraestructure/SummaryGateway";
import type { EquityDetails, GeneralSummary, ProfitDetails } from "../../domain/business/entities/Summary";
import type { GetExpensivesError, GetExpensivesOutput } from "../../domain/business/useCases/GetExpensivesCase";
import type { GetFinancialAggregatesError, GetFinancialAggregatesInput, GetFinancialAggregatesOutput } from "../../domain/business/useCases/GetFinancialAggregatesByDateRangeUseCase";
import { encodeDate } from "../../../shared/firebase/codeDecodeTime";

export class FirebaseSummaryRepository implements SummaryGateway {

    async getGeneralSummary(input: { companyId: string }): Promise<Result<GeneralSummary, { code: string }>> {
        try {
            const { companyId } = input;
            console.log("companyId:", companyId)

            // --- 1. Aportes sociales (sum de amount en incomes) ---
            const incomesRef = collection(firestore, "companies", companyId, "incomes");
            const incomesSnap = await getAggregateFromServer(incomesRef, {
                totalIncomes: sum("amount"),
            });
            const socialContribution = incomesSnap.data().totalIncomes ?? 0;
            console.log("aportes sociales: ", socialContribution)

            // --- 2. Gastos de nómina (sum de amount en payroll) ---
            const payrollRef = collection(firestore, "companies", companyId, "payroll");
            const payrollSnap = await getAggregateFromServer(payrollRef, {
                totalPayroll: sum("amount"),
            });
            const businessExpenses = payrollSnap.data().totalPayroll ?? 0;
            console.log("gastos de nomina: ", businessExpenses)

            // --- 3. Deuda adquirida (sum financialDebts.amount - sum financialsPayments.amount) ---
            const financialDebtsRef = collection(firestore, "companies", companyId, "financialDebts");
            const financialDebtsSnap = await getAggregateFromServer(financialDebtsRef, {
                totalDebt: sum("amount"),
            });
            const totalFinancialDebts = financialDebtsSnap.data().totalDebt ?? 0;
            console.log("deudas adquiridas: ", totalFinancialDebts)

            const financialPaymentsRef = collection(firestore, "companies", companyId, "financialsPayments");
            const financialPaymentsSnap = await getAggregateFromServer(financialPaymentsRef, {
                totalPayments: sum("amount"),
            });
            console.log("pagos de deudas: ", financialPaymentsSnap.data().totalPayments)
            const totalFinancialPayments = financialPaymentsSnap.data().totalPayments ?? 0;
            const acquiredDebt = totalFinancialDebts - totalFinancialPayments;
            console.log("deuda por pagar: ", acquiredDebt)

            // --- 4. Ganancias antes de gastos (sum totalPaid + renewalPayment de debts con earning=true) ---
            const debtsRef = collection(firestore, "companies", companyId, "debts");
            const earningDebtsQuery = query(debtsRef, where("earning", "==", true));
            const earningDebtsSnap = await getAggregateFromServer(earningDebtsQuery, {
                totalPaid: sum("totalPaid"),
                totalRenewal: sum("renewalPayment"),
                totalCapital: sum("capital"),
            });
            const totalPaid = earningDebtsSnap.data().totalPaid ?? 0;
            const totalRenewal = earningDebtsSnap.data().totalRenewal ?? 0;
            const totalCapital = earningDebtsSnap.data().totalCapital ?? 0;
            const profitsBeforeExpenses = totalPaid - totalRenewal - totalCapital;
            console.log("ganancias antes de gastos(total pagado + pago de renovación): ", profitsBeforeExpenses)


            const deliveredDebtsQuery = query(debtsRef, where("delivered", "==", true));
            const deliveredDebtsSnap = await getAggregateFromServer(deliveredDebtsQuery, {
                totalPapeleria: sum("papeleria"),
            });
            const totalPapeleria = deliveredDebtsSnap.data().totalPapeleria ?? 0;
            console.log("papeleria: ", totalPapeleria)

            const totalDeliveredCapitalSnap = await getAggregateFromServer(deliveredDebtsQuery, {
                totalCapital: sum("capital"),
            });

            const totalDeliveredCapital = totalDeliveredCapitalSnap.data().totalCapital ?? 0;

            console.log("capital entregado: ", totalDeliveredCapital)
            // Pagos de impuestos
            const taxtPaymentsRef = collection(firestore, "companies", companyId, "taxtPayments");
            const taxtPaymentsSnap = await getAggregateFromServer(taxtPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalTaxtPayments: number = taxtPaymentsSnap.data().totalPayments ?? 0;

            // Otros pagos
            const anotherPaymentsRef = collection(firestore, "companies", companyId, "anotherPayments");
            const anotherPaymentsSnap = await getAggregateFromServer(anotherPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalAnotherPayments: number = anotherPaymentsSnap.data().totalPayments ?? 0;

            const totalExpenses = totalFinancialPayments + totalTaxtPayments + totalAnotherPayments + businessExpenses;

            // --- 6. Cálculos derivados ---
            const stationeryProfits = profitsBeforeExpenses + totalPapeleria;       // ganancias con papelería
            const profitAfterExpenses = stationeryProfits - totalExpenses;        // ganancia después de gastos
            const cashOnHand = socialContribution + profitAfterExpenses - totalDeliveredCapital;          // dinero en caja
            const equityAfterExpenses = socialContribution - totalExpenses;       // patrimonio después de gastos

            console.log("se toma por gastos los pagos de nomina y pagos a deudas de la empresa(financiamientos) ")
            console.log('dinero en caja igual a patrimonio(' + socialContribution + ")+ ganancias despues de gastos(" + profitAfterExpenses + ")-capital entregado(" + totalDeliveredCapital + ")")

            return ok({
                cashOnHand,
                profitAfterExpenses,
                equityAfterExpenses,
                businessExpenses: totalExpenses,
                acquiredDebt,
                overdueMoney: 0, // TODO: calcular dinero atrasado cuando se defina la lógica
            });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getGeneralSummary]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getProfitDetails(input: { companyId: string }): Promise<Result<ProfitDetails, { code: string }>> {
        try {
            const { companyId } = input;
            console.log(companyId)

            // Ganancias antes de gastos
            const debtsRef = collection(firestore, "companies", companyId, "debts");
            const earningDebtsQuery = query(debtsRef, where("earning", "==", true));
            const earningDebtsSnap = await getAggregateFromServer(earningDebtsQuery, {
                totalPaid: sum("totalPaid"),
                totalRenewal: sum("renewalPayment"),
            });
            const profitsBeforeExpenses =
                (earningDebtsSnap.data().totalPaid ?? 0) +
                (earningDebtsSnap.data().totalRenewal ?? 0);

            // Papelería (delivered=true)
            const deliveredDebtsQuery = query(debtsRef, where("delivered", "==", true));
            const deliveredDebtsSnap = await getAggregateFromServer(deliveredDebtsQuery, {
                totalPapeleria: sum("papeleria"),
            });
            const totalPapeleria = deliveredDebtsSnap.data().totalPapeleria ?? 0;

            return ok({ stationeryProfits: totalPapeleria, profitsBeforeExpenses });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getProfitDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getEquityDetails(input: { companyId: string }): Promise<Result<EquityDetails, { code: string }>> {
        try {
            const { companyId } = input;

            const incomesRef = collection(firestore, "companies", companyId, "incomes");
            const snap = await getAggregateFromServer(incomesRef, {
                totalIncomes: sum("amount"),
            });

            const payrollRef = collection(firestore, "companies", companyId, "payroll");
            const payrollSnap = await getAggregateFromServer(payrollRef, {
                totalPayroll: sum("amount"),
            });
            const businessExpenses = payrollSnap.data().totalPayroll ?? 0;

            const financialPaymentsRef = collection(firestore, "companies", companyId, "financialsPayments");
            const financialPaymentsSnap = await getAggregateFromServer(financialPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalFinancialPayments = financialPaymentsSnap.data().totalPayments ?? 0;


            const debtsRef = collection(firestore, "companies", companyId, "debts");
            const earningDebtsQuery = query(debtsRef, where("earning", "==", true));
            const earningDebtsSnap = await getAggregateFromServer(earningDebtsQuery, {
                totalPaid: sum("totalPaid"),
                totalRenewal: sum("renewalPayment"),
            });

            const profitsBeforeExpenses =
                (earningDebtsSnap.data().totalPaid ?? 0) +
                (earningDebtsSnap.data().totalRenewal ?? 0);

            const deliveredDebtsQuery = query(debtsRef, where("delivered", "==", true));
            const deliveredDebtsSnap = await getAggregateFromServer(deliveredDebtsQuery, {
                totalPapeleria: sum("papeleria"),
            });
            const totalPapeleria = deliveredDebtsSnap.data().totalPapeleria ?? 0;
            const stationeryProfits = profitsBeforeExpenses + totalPapeleria;

            const profitAfterExpenses = stationeryProfits - businessExpenses - totalFinancialPayments;
            const socialContribution = snap.data().totalIncomes ?? 0;

            return ok({ socialContribution, profitAfterExpenses });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getEquityDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getExpensivesDetails(input: { companyId: string }): Promise<Result<GetExpensivesOutput, GetExpensivesError>> {
        try {
            const { companyId } = input;

            // Gastos de nómina
            const payrollRef = collection(firestore, "companies", companyId, "payroll");
            const payrollSnap = await getAggregateFromServer(payrollRef, {
                totalPayroll: sum("amount"),
            });
            const businessExpenses: number = payrollSnap.data().totalPayroll ?? 0;

            // Pagos a deudas de la empresa (financiamientos)
            const financialPaymentsRef = collection(firestore, "companies", companyId, "financialsPayments");
            const financialPaymentsSnap = await getAggregateFromServer(financialPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalFinancialPayments: number = financialPaymentsSnap.data().totalPayments ?? 0;

            // Pagos de impuestos
            const taxtPaymentsRef = collection(firestore, "companies", companyId, "taxtPayments");
            const taxtPaymentsSnap = await getAggregateFromServer(taxtPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalTaxtPayments: number = taxtPaymentsSnap.data().totalPayments ?? 0;

            // Otros pagos
            const anotherPaymentsRef = collection(firestore, "companies", companyId, "anotherPayments");
            const anotherPaymentsSnap = await getAggregateFromServer(anotherPaymentsRef, {
                totalPayments: sum("amount"),
            });
            const totalAnotherPayments: number = anotherPaymentsSnap.data().totalPayments ?? 0;

            const totalExpenses = (businessExpenses) + (totalFinancialPayments) + (totalTaxtPayments) + (totalAnotherPayments);

            return ok({ payrollExpenses: businessExpenses, financingPayments: totalFinancialPayments, taxExpenses: totalTaxtPayments, othersExpenses: totalAnotherPayments, totalExpenses: totalExpenses });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getExpensivesDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getFinancialAggregatesByDateRange(input: GetFinancialAggregatesInput): Promise<Result<GetFinancialAggregatesOutput, GetFinancialAggregatesError>> {
        try {
            const { companyId, startDate, endDate } = input;

            const startTs = encodeDate(startDate);

            // Para incluir todo el día de endDate, calculamos el inicio del día siguiente
            const nextDayDate = new Date(endDate + 'T00:00:00');
            nextDayDate.setDate(nextDayDate.getDate() + 1);
            const nextDayStr = nextDayDate.toISOString().split("T")[0];
            const endTs = encodeDate(nextDayStr);

            const collectionsConfig = [
                { key: "payments" as const, path: "payments", dateField: "paidAt" },
                { key: "taxtPayments" as const, path: "taxtPayments", dateField: "createdAt" },
                { key: "payroll" as const, path: "payroll", dateField: "createdAt" },
                { key: "financialPayments" as const, path: "financialsPayments", dateField: "paidAt" },
                { key: "anotherPayments" as const, path: "anotherPayments", dateField: "createdAt" },
                { key: "financialDebts" as const, path: "financialDebts", dateField: "createdAt" },
                { key: "incomes" as const, path: "incomes", dateField: "createdAt" },
            ];

            const results: any = {};

            await Promise.all(collectionsConfig.map(async (conf) => {
                const ref = collection(firestore, "companies", companyId, conf.path);
                const q = query(ref, where(conf.dateField, ">=", startTs), where(conf.dateField, "<", endTs));
                const snap = await getAggregateFromServer(q, {
                    total: sum("amount"),
                });
                results[conf.key] = snap.data().total ?? 0;
            }));

            return ok(results as GetFinancialAggregatesOutput);
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getFinancialAggregatesByDateRange]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

}
