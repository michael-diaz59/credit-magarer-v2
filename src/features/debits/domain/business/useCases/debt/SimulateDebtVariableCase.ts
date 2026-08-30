import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import { cloneDebt, type Debt } from "../../entities/Debt";
import { type Installment, defaultInstallment } from "../../entities/Installment";
import { obtenerDiaMesSiguiente, obtenerDiaSiguienteQuincena, obtenerDiaSimple } from "../../../../../../core/shared/helpers/Days";
import { getValidDueDate } from "../../../../../../core/shared/helpers/calcularFestivosColombia";

export type SimulateDebtVariableError =
  | { code: "STATE_INVALID" }
  | { code: "CAPITAL_MINIMO_1000" };

export interface SimulateDebtVariableInput {
  debt: Omit<Debt, "id">;
}

export interface SimulateDebtVariableOutput {
  valueOfInstallments: number;
  installments: Installment[];
}

export class SimulateDebtVariableCase {
  async execute(
    input: SimulateDebtVariableInput
  ): Promise<Result<SimulateDebtVariableOutput, SimulateDebtVariableError>> {
    const allowedStatuses = ["tentativa", "preAprobada", "activa"];
    if (!allowedStatuses.includes(input.debt.status)) {
      return fail({ code: "STATE_INVALID" });
    }

    if (input.debt.capital < 1000) {
      return fail({ code: "CAPITAL_MINIMO_1000" });
    }

    const debt = cloneDebt({ ...input.debt, id: "" });

    const gananciaMensual = debt.capital * (debt.interestRate / 100);

    // Solo interés
    const pago_cuota_interes = gananciaMensual

    const installments: Installment[] = [];
    const [year, month, day] = debt.startDate.split("-").map(Number);
    let start = new Date(year, month - 1, day);
    let dayParasiguientes: number = start.getDate();

    for (let i = 0; i < 2; i++) {
      let rawDueDate: Date;

      switch (debt.debtTerms) {
        case "diario":
          rawDueDate = obtenerDiaSimple(start, "diario");
          break;
        case "semanal":
          rawDueDate = obtenerDiaSimple(start, "semanal");
          break;
        case "quincenal":
          const { date, nextDay } = obtenerDiaSiguienteQuincena(start, dayParasiguientes);
          rawDueDate = date;
          dayParasiguientes = nextDay;
          break;
        case "mensual":
          rawDueDate = obtenerDiaMesSiguiente(start.getFullYear(), start.getMonth(), start.getDate());
          break;
        default:
          rawDueDate = obtenerDiaSimple(start, "diario");
      }

      const dueDate = getValidDueDate(rawDueDate);

      const isAdelanto = debt.prepayment === "si";
      const isFirst = i === 0;

      const status = isAdelanto && isFirst ? "pagada" : "pendiente";
      const paidAmount = isAdelanto && isFirst ? pago_cuota_interes : 0;
      const basePaidRatio = isAdelanto && isFirst ? 100 : 0;

      installments.push({
        ...defaultInstallment(),
        id: crypto.randomUUID(),
        debtId: "",
        clientId: debt.clientId,
        clientDocument: debt.clientDocument,
        clientName: debt.clientName,
        installmentTotalNumber: 2,
        installmentNumber: i + 1,
        interestRate: debt.interestRate,
        amount: pago_cuota_interes,
        dueDate: dueDate.toISOString().slice(0, 10),
        status: status,
        amountPaid: paidAmount,
        percentageOfCapitalPaid: basePaidRatio,
        createdAt: new Date().toISOString().slice(0, 10),
      });

      if (debt.debtTerms === "diario") {
        start = dueDate;
      } else {
        start = rawDueDate;
      }
    }

    return ok({
      valueOfInstallments: pago_cuota_interes,
      installments: installments,
    });
  }
}
