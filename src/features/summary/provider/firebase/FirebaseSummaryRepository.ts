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
import { encodeDate } from "../../../../core/shared/firebase/codeDecodeTime";
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
        const earningDebtsQuery = query(debtsRef, where("capitalPaid", "==", 100));
        const snap = await getAggregateFromServer(earningDebtsQuery, {
            totalPaid: sum("totalPaid"),
            totalRenewal: sum("renewalPayment"),
            totalPaymentForLate: sum("totalPaymentForLate"),
            totalCapital: sum("capital"),
        });
        const data = snap.data();
        console.table(data);
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

    async getSocialContribution(companyId: string) {
        return await this.getTotalAmountFromCollection(companyId, "incomes");
    }

    async getGeneralSummary(input: { companyId: string }): Promise<Result<GeneralSummary, { code: string }>> {
        try {

            const debtsRef = collection(firestore, "companies", input.companyId, "debts");

            const globalTotals = await getAggregateFromServer(debtsRef, {
                totalPaid: sum("totalPaid"),
            });

            // --- 1. Aportes sociales (sum de amount en incomes)
            const socialContribution = await this.getSocialContribution(input.companyId);
            console.log("aportes sociales: ", socialContribution);

            // --- 3. Deuda adquirida (sum financialDebts.amount - sum financialsPayments.amount)
            const totalFinancialDebts = await this.getTotalAmountFromCollection(input.companyId, "financialDebts");
            console.log("financiamiento: ", totalFinancialDebts);

            const aporteExcel = socialContribution + totalFinancialDebts
            console.log("socialContribution: ", socialContribution);
            console.log("totalFinancialDebts: ", totalFinancialDebts);
            console.log("globalTotals.data().totalPaid: ", globalTotals.data().totalPaid);


            const patrimonioExcel = aporteExcel + globalTotals.data().totalPaid;

            const renovaciones = await getAggregateFromServer(debtsRef, {
                renewalPayment: sum("renewalPayment"),
            });

            const capital = await getAggregateFromServer(debtsRef, {
                capital: sum("capital"),
            });

            console.log("capital: ", capital.data().capital);
            console.log("renovaciones.data().renewalPayment: ", renovaciones.data().renewalPayment);

            const activoCapital = capital.data().capital - renovaciones.data().renewalPayment;




            const grossProfitDetails = await this.getGrossProfitDetails(input);

            if (!grossProfitDetails.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const gastos = await this.getExpensivesDetails(input)
            if (!gastos.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const snap = await getAggregateFromServer(debtsRef, {
                totalPapeleria: sum("papeleria"),
            });

            console.log("patrimonioExcel:", patrimonioExcel);
            console.log("activoCapital:", activoCapital);
            console.log("gastos.value.totalExpenses:", gastos.value.totalExpenses);





            return ok({
                cashOnHand: patrimonioExcel - activoCapital - gastos.value.totalExpenses + snap.data().totalPapeleria,
                profitAfterExpenses: 0, // TODO: calcular dinero atrasado cuando se defina la lógica
                equityAfterExpenses: 0, // TODO: calcular dinero atrasado cuando se defina la lógica
                businessExpenses: gastos.value.totalExpenses,
                acquiredDebt: 0, // TODO: calcular dinero atrasado cuando se defina la lógica
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
            const grossProfits = await this.getGrossProfitDetails(input);

            if (!grossProfits.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            // Papelería (delivered=true)
            const deliveredAggregates = await this.getDeliveredDebtsAggregates(companyId);
            const totalPapeleria = deliveredAggregates.totalPapeleria;

            return ok({ stationeryProfits: totalPapeleria, profitsBeforeExpenses: grossProfits.value.collectionProfits });
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
            const collectionProfits = (totalPaid - totalCapital) + totalRenewal;

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
            const ganancias = await this.getGrossProfitDetails(input)

            if (!ganancias.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }
            const socialContributionQ = await this.getTotalAmountFromCollection(input.companyId, "incomes");
            const totalFinancialDebtsQ = await this.getTotalAmountFromCollection(input.companyId, "financialDebts");
            console.log("financiamiento: ", totalFinancialDebtsQ);

            const gastos = await this.getExpensivesDetails(input)

            if (!gastos.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }


            return ok({ socialContribution: socialContributionQ, profitAfterExpenses: (ganancias.value.totalGrossProfit - gastos.value.totalExpenses), totalFinancialDebts: totalFinancialDebtsQ });
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

