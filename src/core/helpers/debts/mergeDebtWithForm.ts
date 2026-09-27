import type { DebtFormValues } from "../../../atomic_design/templates/debt/debtForm";
import type { Debt } from "../../../features/debits/domain/business/entities/Debt";

export function mergeDebtWithForm(
    originalDebt: Debt,
    formValues: DebtFormValues
): Debt {
    const debt: Debt = {
        ...originalDebt,

        // ============================================================
        // DATOS CONTROLADOS POR EL FORMULARIO
        // ============================================================

        routeId: formValues.routeId,
        status: formValues.status,
        clientDocument: formValues.clientDocument,

        type: formValues.type,
        capital: formValues.capital,
        debtTerms: formValues.debtTerms,
        interestRate: formValues.interestRate,
        installmentCount: formValues.installmentCount,
        startDate: formValues.startDate,
        daysPerMonth: formValues.daysPerMonth,
    };

    return recalculateDebtAfterEdit(debt, originalDebt);
}

function recalculateDebtAfterEdit(
    debt: Debt,
    originalDebt: Debt
): Debt {
    // Aquí se recalculan únicamente los valores
    // que dependen de los datos editables.

    return {
        ...debt,
        id: originalDebt.id,
        // Se recalculan posteriormente
        interest: 0,
        amount: 0,
        total: 0,

        remainingCapitalToPay: 0,
        remainingInterestToPay: 0,
        remainingAmountToPay: 0,
        remainingTotalToPay: 0,

        percentageOfCapitalPaid: 0,
        percentageOfInteresPaid: 0,
        percentageOfAmountPaid: 0,
        percentageOfTotalPaid: 0,
    };
}