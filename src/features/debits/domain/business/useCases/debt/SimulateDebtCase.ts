import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { simulateInstallments } from "../helper";

export type SimulateDebtError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "STATE_INVALID" }
  | { code: "el capital debe ser mayor a 1000" }

export interface SimulateDebtInput {
  debt: Omit<Debt, "id">;
  /**este parametro representa los meses que se quiere que dure la deuda */
  months?: number
}


export interface SimulateDebtOutput {
  valueOfInstallments: number
  totalAmount: number
  capital: number
  totalInstallments: number
  cuotasCompletas: number
  pago_ultima_cuota: number
  pago_cuota_reound: number;
  installments: Installment[];
}

export function createEmptySimulateDebtOutput(): SimulateDebtOutput {
  return {
    installments: [],
    valueOfInstallments: 0,
    totalAmount: 0,
    capital: 0,
    totalInstallments: 0,
    cuotasCompletas: 0,
    pago_ultima_cuota: 0,
    pago_cuota_reound: 0,
  }
}


export class SimulateDebtCase {


  async execute(input: SimulateDebtInput): Promise<Result<SimulateDebtOutput, SimulateDebtError>> {
    /** 1️⃣ Estado válido */
    const allowedStatuses = ["tentativa", "preAprobada", "activa"];
    if (!allowedStatuses.includes(input.debt.status)) {
      return fail({ code: "STATE_INVALID" });
    }

    console.log(input.debt.capital)
    if (input.debt.capital < 1000) {
      return fail({ code: "el capital debe ser mayor a 1000" });
    }



    /** 3️⃣ Debt FINAL */
    const debt: Debt = {
      ...input.debt,
      id: "",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    /** 4️⃣ Generar cuotas */
    const { pago_cuota, total_deuda_a_pagar, cuotasCompletas, pago_ultima_cuota, pago_cuota_reound, installments } = simulateInstallments(
      debt,
      input.months
    );

    return ok({
      valueOfInstallments: pago_cuota,
      totalAmount: total_deuda_a_pagar,
      capital: debt.capital,
      totalInstallments: debt.installmentCount,
      cuotasCompletas: cuotasCompletas,
      pago_ultima_cuota: pago_ultima_cuota,
      pago_cuota_reound: pago_cuota_reound,
      installments: installments,
    })

  }
}
