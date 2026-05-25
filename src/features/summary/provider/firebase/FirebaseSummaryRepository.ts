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
import type { EquityDetails, GeneralSummary, GrossProfitDetails, ProfitDetails } from "../../domain/business/entities/Summary";
import type { GetExpensivesError, GetExpensivesInput, GetExpensivesOutput } from "../../domain/business/useCases/GetExpensivesCase";
import type { GetFinancialAggregatesError, GetFinancialAggregatesInput, GetFinancialAggregatesOutput } from "../../domain/business/useCases/GetFinancialAggregatesByDateRangeUseCase";
import { encodeDate } from "../../../shared/firebase/codeDecodeTime";
import { minZero } from "../../../../core/helpers/limits";

export class FirebaseSummaryRepository implements SummaryGateway {

    private async getTotalAmountFromCollection(companyId: string, collectionName: string): Promise<number> {
        const ref = collection(firestore, "companies", companyId, collectionName);
        const snap = await getAggregateFromServer(ref, {
            total: sum("amount"),
        });
        return snap.data().total ?? 0;
    }

    private async getEarningDebtsAggregates(companyId: string) {
        const debtsRef = collection(firestore, "companies", companyId, "debts");
        const earningDebtsQuery = query(debtsRef, where("creditPaid", "==", 100));
        const snap = await getAggregateFromServer(earningDebtsQuery, {
            totalPaid: sum("totalPaid"),
            totalRenewal: sum("renewalPayment"),
            totalPaymentForLate: sum("paymentForLate"),
            totalCapital: sum("capital"),
        });
        const data = snap.data();
        return {
            totalPaid: data.totalPaid ?? 0,
            totalRenewal: data.totalRenewal ?? 0,
            totalPaymentForLate: data.totalPaymentForLate ?? 0,
            totalCapital: data.totalCapital ?? 0,
        };
    }

    private async getDeliveredDebtsAggregates(companyId: string) {
        const debtsRef = collection(firestore, "companies", companyId, "debts");
        const deliveredDebtsQuery = query(debtsRef, where("delivered", "==", true));
        const snap = await getAggregateFromServer(deliveredDebtsQuery, {
            totalPapeleria: sum("papeleria"),
            totalCapital: sum("capital"),
        });
        const data = snap.data();
        return {
            totalPapeleria: data.totalPapeleria ?? 0,
            totalCapital: data.totalCapital ?? 0,
        };
    }

    private async getInactiveDebtsAggregates(companyId: string) {
        const debtsRef = collection(firestore, "companies", companyId, "debts");
        const cancelledCreditsQuery = query(debtsRef, where("status", "==", "inactivo"));
        const snap = await getAggregateFromServer(cancelledCreditsQuery, {
            totalPaid: sum("totalPaid"),
            totalCapital: sum("capital"),
        });
        const data = snap.data();
        return {
            totalPaid: data.totalPaid ?? 0,
            totalCapital: data.totalCapital ?? 0,
        };
    }

    async getGeneralSummary(input: { companyId: string }): Promise<Result<GeneralSummary, { code: string }>> {
        try {
            const { companyId } = input;
            console.log("companyId:", companyId);

            // --- 1. Aportes sociales (sum de amount en incomes) ---
            const socialContribution = await this.getTotalAmountFromCollection(companyId, "incomes");
            console.log("aportes sociales: ", socialContribution);

            // --- 2. Gastos de nómina (sum de amount en payroll) ---
            const businessExpenses = await this.getTotalAmountFromCollection(companyId, "payroll");
            console.log("gastos de nomina: ", businessExpenses);

            // --- 3. Deuda adquirida (sum financialDebts.amount - sum financialsPayments.amount) ---
            const totalFinancialDebts = await this.getTotalAmountFromCollection(companyId, "financialDebts");
            console.log("financiamiento: ", totalFinancialDebts);

            const totalFinancialPayments = await this.getTotalAmountFromCollection(companyId, "financialsPayments");
            console.log("pagos de financiamientos: ", totalFinancialPayments);

            const acquiredDebt = totalFinancialDebts - totalFinancialPayments;
            console.log("financiamientos por pagar: ", acquiredDebt);

            // --- 4. Ganancias antes de gastos (sum totalPaid + renewalPayment de debts con earning=true) ---
            const earningAggregates = await this.getEarningDebtsAggregates(companyId);
            const { totalPaid, totalRenewal, totalPaymentForLate, totalCapital } = earningAggregates;

            console.log("total pago por mora: ", totalPaymentForLate);
            console.log("ganancia por interes: ", totalPaid - totalCapital);
            const totalImport = (totalPaid - totalCapital) - totalRenewal;
            console.log("total importado de intereses: ", totalImport);
            const profitsBeforeExpensesWithOutPapeleria = totalImport + totalPaymentForLate;
            console.log("ganancias antes de gastos (Sin Papelería)-> recaudo + mora: ", profitsBeforeExpensesWithOutPapeleria);

            const deliveredAggregates = await this.getDeliveredDebtsAggregates(companyId);
            const { totalPapeleria, totalCapital: totalDeliveredCapital } = deliveredAggregates;

            console.log("ganancias por papeleria: ", totalPapeleria);
            const profitsBeforeExpenses = profitsBeforeExpensesWithOutPapeleria + totalPapeleria;
            console.log("ganancias antes de gastos recaudo + mora + papeleria: ", profitsBeforeExpenses);
            console.log("capital entregado: ", totalDeliveredCapital);

            // Pagos de impuestos
            const totalTaxtPayments = await this.getTotalAmountFromCollection(companyId, "taxtPayments");

            // Otros pagos
            const totalAnotherPayments = await this.getTotalAmountFromCollection(companyId, "anotherPayments");

            // 1. perdida por creditos inactivos
            const inactiveAggregates = await this.getInactiveDebtsAggregates(companyId);
            const cancelledCredits = minZero(inactiveAggregates.totalCapital - inactiveAggregates.totalPaid);

            console.log(cancelledCredits);

            const totalExpenses = totalFinancialPayments + totalTaxtPayments + totalAnotherPayments + businessExpenses + cancelledCredits;

            // --- 6. Cálculos derivados ---
            const stationeryProfits = profitsBeforeExpenses;       // ganancias antes de gastos
            const profitAfterExpenses = stationeryProfits - totalExpenses;        // ganancia después de gastos
            const equityAfterExpenses = profitAfterExpenses + socialContribution + totalFinancialDebts;       // patrimonio después de gastos
            const capitalInversion = totalPaid + totalFinancialDebts + totalPapeleria + totalPaymentForLate + socialContribution;
            console.log("dinero invertido", capitalInversion);
            console.log("gastos de negocio ", totalExpenses);
            const totalImported = totalCapital - totalRenewal;
            console.log("total importado  ", totalImported);

            const cashOnHand = capitalInversion - totalExpenses - totalImport;
            console.log("dinero en caja ", cashOnHand);

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
            console.log(companyId);

            // Ganancias antes de gastos
            const earningAggregates = await this.getEarningDebtsAggregates(companyId);
            const profitsBeforeExpenses = earningAggregates.totalPaid + earningAggregates.totalRenewal;

            // Papelería (delivered=true)
            const deliveredAggregates = await this.getDeliveredDebtsAggregates(companyId);
            const totalPapeleria = deliveredAggregates.totalPapeleria;

            return ok({ stationeryProfits: totalPapeleria, profitsBeforeExpenses });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getProfitDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getGrossProfitDetails(input: { companyId: string }): Promise<Result<GrossProfitDetails, { code: string }>> {
        try {
            const { companyId } = input;

            // 1. Recaudo e Intereses (earning=true)
            const earningAggregates = await this.getEarningDebtsAggregates(companyId);
            const { totalPaid, totalRenewal, totalPaymentForLate, totalCapital } = earningAggregates;

            // Recaudo = Intereses (Total pagado - Capital - Renovación)
            const collectionProfits = (totalPaid - totalCapital) - totalRenewal;

            // Atrasos = Mora
            const lateFeeProfits = totalPaymentForLate;

            // 2. Papelería (delivered=true)
            const deliveredAggregates = await this.getDeliveredDebtsAggregates(companyId);
            const stationeryProfits = deliveredAggregates.totalPapeleria;

            const totalGrossProfit = collectionProfits + lateFeeProfits + stationeryProfits;

            return ok({
                collectionProfits,
                lateFeeProfits,
                stationeryProfits,
                totalGrossProfit
            });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getGrossProfitDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getEquityDetails(input: { companyId: string }): Promise<Result<EquityDetails, { code: string }>> {
        try {
            const { companyId } = input;

            const socialContribution = await this.getTotalAmountFromCollection(companyId, "incomes");
            const payRolls = await this.getTotalAmountFromCollection(companyId, "payroll");
            const totalFinancialPayments = await this.getTotalAmountFromCollection(companyId, "financialsPayments");

            // --- 4. Ganancias antes de gastos (sum totalPaid + renewalPayment de debts con earning=true) ---
            const earningAggregates = await this.getEarningDebtsAggregates(companyId);
            const { totalPaid, totalRenewal, totalPaymentForLate, totalCapital } = earningAggregates;

            console.log("total pago por mora: ", totalPaymentForLate);
            console.log("ganancia por interes: ", totalPaid - totalCapital);
            const profitsBeforeExpensesWithOutPapeleria = ((totalPaid - totalCapital) - totalRenewal) + totalPaymentForLate;
            console.log("ganancias antes de gastos (Sin Papelería)-> recaudo + mora: ", profitsBeforeExpensesWithOutPapeleria);

            const deliveredAggregates = await this.getDeliveredDebtsAggregates(companyId);
            const totalPapeleria = deliveredAggregates.totalPapeleria;

            console.log("ganancias por papeleria: ", totalPapeleria);
            const profitsBeforeExpenses = profitsBeforeExpensesWithOutPapeleria + totalPapeleria;
            console.log("ganancias antes de gastos recaudo + mora + papeleria: ", profitsBeforeExpenses);

            // Pagos de impuestos
            const totalTaxtPayments = await this.getTotalAmountFromCollection(companyId, "taxtPayments");

            // Otros pagos
            const totalAnotherPayments = await this.getTotalAmountFromCollection(companyId, "anotherPayments");

            // --- 3. Deuda adquirida (sum financialDebts.amount - sum financialsPayments.amount) ---
            const totalFinancialDebts = await this.getTotalAmountFromCollection(companyId, "financialDebts");
            console.log("financiamiento: ", totalFinancialDebts);

            // 1. perdida por creditos inactivos
            const inactiveAggregates = await this.getInactiveDebtsAggregates(companyId);
            const cancelledCredits = minZero(inactiveAggregates.totalCapital - inactiveAggregates.totalPaid);

            const totalExpenses = totalFinancialPayments + totalAnotherPayments + totalTaxtPayments + payRolls + cancelledCredits;

            const profitAfterExpenses = profitsBeforeExpenses - totalExpenses;

            return ok({ socialContribution, profitAfterExpenses, totalFinancialDebts });
        } catch (error) {
            console.error("[FirebaseSummaryRepository.getEquityDetails]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getExpensivesDetails(input: GetExpensivesInput): Promise<Result<GetExpensivesOutput, GetExpensivesError>> {
        try {
            const { companyId } = input;

            // Gastos de nómina
            const businessExpenses = await this.getTotalAmountFromCollection(companyId, "payroll");

            // Pagos a deudas de la empresa (financiamientos)
            const totalFinancialPayments = await this.getTotalAmountFromCollection(companyId, "financialsPayments");

            // Pagos de impuestos
            const totalTaxtPayments = await this.getTotalAmountFromCollection(companyId, "taxtPayments");

            // Otros pagos
            const totalAnotherPayments = await this.getTotalAmountFromCollection(companyId, "anotherPayments");

            const totalExpenses = (businessExpenses) + (totalFinancialPayments) + (totalTaxtPayments) + (totalAnotherPayments);

            // 1. perdida por creditos inactivos
            const inactiveAggregates = await this.getInactiveDebtsAggregates(companyId);
            const cancelledCredits = minZero(inactiveAggregates.totalCapital - inactiveAggregates.totalPaid);

            console.log(cancelledCredits);

            return ok({ payrollExpenses: businessExpenses, financingPayments: totalFinancialPayments, taxExpenses: totalTaxtPayments, othersExpenses: totalAnotherPayments, totalExpenses: totalExpenses, cancelledCredits });
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

