import {
  diasDelMesPorTermino,
  diasPorTermino,
} from "../../../../../core/helpers/debts/diasPorTermino";
import type { Debt, DebtTerms } from "../entities/Debt";
import type { Installment } from "../entities/Installment";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getTermDays(term: DebtTerms): number {
  return diasDelMesPorTermino[term];
}

type RoundResult = {
  rounded: number;
  difference: number;
};

/** cada cuota se redondea hacia arriba al múltiplo de 1000 más cercano */
export function roundUpToThousand(amount: number): RoundResult {
  const rounded = amount <= 1000 ? 1000 : Math.ceil(amount / 1000) * 1000;

  const difference = rounded - amount;
  console.log("valor original de la cuota", amount);
  console.log("redondeado a ", rounded);
  console.log("el cliente va a abonar un extra a cada cuota de ", difference);

  return {
    rounded: rounded,
    difference: difference,
  };
}

export function generateInstallments2(
  debt: Debt,
  costumerAddress: Installment["costumerAddres"],
  companyId: string,
  months?: number,
): {
  installments: Installment[];
  firstDueDate: string;
  nextPaymentDue: string;
} {
  const installments: Installment[] = [];

  const [year, month, day] = debt.startDate.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  console.log("start date:", start)
  const stepDays = diasPorTermino[debt.debtTerms]
  console.log("stepDays:", stepDays)

  const { pago_cuota, total_deuda_a_pagar } = calculateDebtFinancials(
    debt,
    months,
  );

  // 🔹 1. Redondear cuota
  const redondeo = roundUpToThousand(pago_cuota);

  const total_con_redondeo = redondeo.rounded * debt.installmentCount;

  let excedente = total_con_redondeo - total_deuda_a_pagar;

  // 🔹 2. Crear arreglo base con todas las cuotas redondeadas
  const valoresCuotas = Array(debt.installmentCount).fill(redondeo.rounded);

  // 🔹 3. Descontar excedente desde la última cuota hacia atrás
  for (let i = valoresCuotas.length - 1; i >= 0; i--) {
    if (excedente <= 0) break;

    const descuento = Math.min(excedente, valoresCuotas[i]);

    valoresCuotas[i] -= descuento;
    excedente -= descuento;
  }

  // 🔹 4. Generar cuotas finales
  for (let i = 0; i < debt.installmentCount; i++) {
    const dueDate = addDays(start, stepDays * (i + 1));

    installments.push({
      installmentTotalNumber: debt.installmentCount,
      paidAmount: 0,
      paidAt: "",
      costumerNumber: "",
      payments: [],
      lateDueDate: "",
      lateInterestRate: 0,
      aplazado: false,
      latepayment: 0,
      paidLatePayment: 0,

      companyId: companyId,
      id: crypto.randomUUID(),
      debtId: debt.id,
      collectorId: debt.collectorId,
      costumerId: debt.clientId,
      costumerDocument: debt.costumerDocument,
      costumerName: debt.costumerName,
      costumerAddres: costumerAddress,
      installmentNumber: i + 1,
      interestRate: debt.interestRate,
      amount: valoresCuotas[i],
      dueDate: dueDate.toISOString().slice(0, 10),
      status: "pendiente",
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  return {
    installments,
    firstDueDate: installments[0].dueDate,
    nextPaymentDue: installments[0].dueDate,
  };
}

export function simulateInstallments(
  debt: Debt,
  months?: number,
): {
  total_deuda_a_pagar: number;
  pago_cuota: number;
  cuotasCompletas: number;
  pago_ultima_cuota: number;
  pago_cuota_reound: number;
} {
  const {
    total_deuda_a_pagar,
    pago_cuota,
    cuotasCompletas,
    pago_ultima_cuota,
    pago_cuota_reound,
  } = calculateDebtFinancials(debt, months);
  return {
    total_deuda_a_pagar: total_deuda_a_pagar,
    pago_cuota: pago_cuota,
    cuotasCompletas: cuotasCompletas,
    pago_ultima_cuota: pago_ultima_cuota,
    pago_cuota_reound: pago_cuota_reound,
  };
}

export function calculateDebtFinancials(debt: Debt, months?: number) {
  if (months) {
    const duration_in_days = debt.diasMes * months;
    console.log(
      `se calculo que el credito tendra una duracion de ${duration_in_days} dias`,
    );
    const installmentCount = duration_in_days / getTermDays(debt.debtTerms);
    console.log(`se calculo que el credito tendra ${installmentCount} cuotas`);

    debt.installmentCount = installmentCount;
  }

  console.log(`la deuda tendra un monto capital de ${debt.totalAmount} `);

  console.log(`esta deuda maneja los meses por ${debt.diasMes} dias`);

  const dias_por_cuota = diasPorTermino[debt.debtTerms];

  console.log("termino de las cuotas:", debt.debtTerms);

  console.log("dias por cada cuota:", dias_por_cuota);

  console.log("cantidad de cuotas:", debt.installmentCount);

  const total_dias_deuda = dias_por_cuota * debt.installmentCount;

  console.log(`la deuda durara : ${total_dias_deuda} dias`);

  let total_meses_deuda = total_dias_deuda / debt.diasMes;

  console.log(`la deuda dura ${total_meses_deuda} meses`);

  if (total_meses_deuda < 1) {
    total_meses_deuda = 1;
    console.log(
      `la deuda se calibro a ${total_meses_deuda} mes ya que ninguna deuda puede reducir el interes mensual pactado`,
    );
  }

  console.log(
    `la deuda tiene una tasa de interes mensual del ${debt.interestRate}%`,
  );

  const interes_global = debt.interestRate * total_meses_deuda;

  console.log(`la deuda tendra un interes global de  ${interes_global}%`);

  const total_deuda_a_pagar =
    debt.totalAmount * (interes_global / 100) + debt.totalAmount;

  console.log(
    `la deuda tendra un monto total(capital+interes) de ${total_deuda_a_pagar} `,
  );

  const pago_cuota = total_deuda_a_pagar / debt.installmentCount;

  console.log(`cada cuota sale originalmente a ${pago_cuota} pesos`);

  const redondeo: RoundResult = roundUpToThousand(pago_cuota);

  const total_con_redondeo = redondeo.rounded * debt.installmentCount;

  console.log(
    `con el redondeo el cliente estaria pagando un total de ${total_con_redondeo} pesos`,
  );

  const excedente_del_cliente = total_con_redondeo - total_deuda_a_pagar;

  console.log(
    `para no cobrarle ese extra al cliente se calcula el excedente que esta pagando el cliente: ${excedente_del_cliente}`,
  );

  const numero_cuotas_pagadas_con_excedente =
    excedente_del_cliente / redondeo.rounded;

  console.log(
    `con el excedente el cliente ha pagado: ${numero_cuotas_pagadas_con_excedente} cuotas`,
  );

  const cuotasCompletas = Math.floor(numero_cuotas_pagadas_con_excedente);

  console.log(
    `en otras palabras el cliente ha completado con excedente ${cuotasCompletas} cuotas`,
  );

  //indica el .x por el cual se multiplica el valor de una cuota redondeada para saber cuanto es el valor de la ultima cuota que paga el cliente
  //const parteDecimal =numero_cuotas_pagadas_con_excedente - cuotasCompletas;

  const excedente_restante_de_cuotas_completas =
    excedente_del_cliente - cuotasCompletas * redondeo.rounded;

  const pago_ultima_cuota =
    redondeo.rounded - excedente_restante_de_cuotas_completas;

  //const montoUltimaCuotaAjustada =redondeo.rounded * parteDecimal;

  console.log(
    `en la ultima cuota al cliente solo se le cobran ${pago_ultima_cuota} pesos, ya que es lo que le quedo de excedente despues de descontar cuotas completas con su excedente`,
  );

  return {
    dias_por_cuota,
    total_dias_deuda,
    total_meses_deuda,
    interes_global,
    total_deuda_a_pagar,
    pago_cuota,
    pago_cuota_reound: redondeo.rounded,
    cuotasCompletas,
    pago_ultima_cuota,
  };
}

type CalculateDebtParams = {
  totalAmount: number;
  interestRate: number; // % mensual
  installmentCount: number;
  debtTerms: DebtTerms;
  diasMes: number;
  delayDays?: number;
};

export function calculateDebtFinancialsSimple({
  totalAmount,
  interestRate,
  installmentCount,
  debtTerms,
  diasMes,
  delayDays,
}: CalculateDebtParams) {
  const diasPorCuota = diasPorTermino[debtTerms];

  console.log("se registra que la deuda tiene dias por cuota:", diasPorCuota);

  const totalDiasDeuda = diasPorCuota * installmentCount;

  console.log(`la deuda dura ${totalDiasDeuda} dias`);

  let totalMesesDeuda = totalDiasDeuda / diasMes;

  console.log(`la deuda dura ${totalMesesDeuda} meses`);

  // Ninguna deuda puede generar menos de 1 mes de interés
  if (totalMesesDeuda < 1) {
    totalMesesDeuda = 1;
    console.log(
      `se calibro la duracion a 1 mes que es lo minimo para no bjar la tasa de interes`,
    );
  }

  const interesGlobal = interestRate * totalMesesDeuda;

  console.log(`la deuda tendra un interes global de  ${interesGlobal}%`);

  const totalDeudaAPagar = totalAmount * (interesGlobal / 100) + totalAmount;
  console.log(
    `la deuda tendra un monto total(capital+interes) de ${totalDeudaAPagar} `,
  );

  const pagoCuotaOriginal = totalDeudaAPagar / installmentCount;

  console.log(`cada cuota sale originalmente a ${pagoCuotaOriginal} pesos`);

  let pagoCuotaFinal = pagoCuotaOriginal;

  if (delayDays !== undefined) {
    const gananciaMensual = totalAmount * (interestRate / 100);
    const diasMesPorTermino = diasDelMesPorTermino[debtTerms];
    const valorDiaRetraso = gananciaMensual / diasMesPorTermino;
    const valorTotalRetraso = valorDiaRetraso * delayDays;

    console.log(
      `Cálculo por retraso: ${delayDays} días. Valor diario: ${valorDiaRetraso}. Total retraso: ${valorTotalRetraso}`,
    );

    pagoCuotaFinal = valorTotalRetraso;
  }

  return {
    diasPorCuota,
    totalDiasDeuda,
    totalMesesDeuda,
    interesGlobal,
    totalDeudaAPagar,
    pagoCuota: pagoCuotaFinal,
    installmentCount: installmentCount,
  };
}
