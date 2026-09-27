import { getLocalDate } from "../../../../../../core/helpers/dates/calculateDays";
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { createEmptyDebt, type Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { generateInstallments2 } from "../helper";

export type CreateDebtError2 =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "STATE_INVALID" }
  | { code: "CUSTOMER_NOT_FOUND" }
  | { code: "el capital debe ser mayor a 1000" };

export interface CreateDebtUInput2 {
  debt: Omit<Debt, "id">;
  companyId: string;
  /** Meses que se quiere que dure la deuda. */
  months?: number;
}

export interface CreateDebtUOutput2 {
  debtName: string;
  debtId: string;
}

export interface CreateWithInstallmentsInput2 {
  companyId: string;
  debt: Debt;
  installments: Installment[];
}

const percentage = (paid: number, total: number): number => {
  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, (paid / total) * 100));
};

const nonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export class CreateVariableDebtUseCase {
  private readonly debtGateway: DebtGateway
  private readonly costumerGateway: CostumerGateway
  constructor(
    debtGateway: DebtGateway,
    costumerGateway: CostumerGateway,
  ) {
    this.debtGateway = debtGateway
    this.costumerGateway = costumerGateway
  }

  async execute(
    input: CreateDebtUInput2,
  ): Promise<Result<CreateDebtUOutput2, CreateDebtError2>> {
    const { debt: inputDebt, companyId } = input;

    // 1. Validaciones básicas
    if (inputDebt.status !== "tentativa") {
      return fail({ code: "STATE_INVALID" });
    }

    if (!Number.isFinite(inputDebt.capital) || inputDebt.capital < 1000) {
      return fail({ code: "el capital debe ser mayor a 1000" });
    }

    // 2. Buscar cliente
    const clientResult = await this.costumerGateway.getCostumerByIdNumber({
      companyId,
      documentId: inputDebt.clientDocument,
    });

    if (!clientResult.state.ok || !clientResult.state.value) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    const customer: Customer = clientResult.state.value;

    // 3. Construir una deuda base para generar las cuotas.
    // Los montos definitivos se calculan después de generar las cuotas.
    const debt: Debt = {
      ...createEmptyDebt(),

      // Identificación / estado
      name: inputDebt.name,
      status: "tentativa",
      type: inputDebt.type,
      isLife: false,
      delivered: false,
      deliveredStatus: "false_preparacion",

      // Cliente
      clientId: customer.id,
      clientName: customer.applicant.fullName,
      clientDocument: customer.applicant.idNumber,

      // Ruta y condiciones
      routeId: inputDebt.routeId,
      routeName: inputDebt.routeName,
      debtTerms: inputDebt.debtTerms,
      daysPerMonth: inputDebt.daysPerMonth,
      interestRate: inputDebt.interestRate,
      lateInterestRate: inputDebt.lateInterestRate,
      installmentCount: inputDebt.installmentCount,
      prepayment: inputDebt.prepayment,

      // Configuraciones: mantenerlas separadas
      requiredArrears: inputDebt.requiredArrears,
      requiredState: inputDebt.requiredState,

      // Capital y valores iniciales
      capital: nonNegative(inputDebt.capital),
      interest: 0,
      amount: 0,
      arrears: 0,
      total: 0,
      processingFee: nonNegative(inputDebt.processingFee),

      // Pagos confirmados: una deuda recién creada no tiene pagos
      capitalPaid: 0,
      interestPaid: 0,
      amountPaid: 0,
      arrearsPaid: 0,
      totalPaid: 0,
      installmentsPaid: 0,

      // Saldos iniciales; se recalculan al conocer el total
      remainingCapitalToPay: nonNegative(inputDebt.capital),
      remainingInterestToPay: 0,
      remainingAmountToPay: 0,
      remainingArrearsToPay: 0,
      remainingTotalToPay: 0,

      // Porcentajes: no se ha pagado nada
      percentageOfCapitalPaid: 0,
      percentageOfInteresPaid: 0,
      percentageOfAmountPaid: 0,
      porcentageOfArrearsPaid: 0,
      percentageOfTotalPaid: 0,

      // Pendientes por cobrar
      outstandingReceivables: 0,
      outstandingReceivablesAmount: 0,
      outstandingReceivablesDeferment: 0,
      outstandingReceivablesArrears: 0,

      // Mora inicial
      numberOfArrearsInstallments: 0,
      numberOfArrearsDays: 0,
      maxNumberOfArrearsDays: 0,
      totalArrearsDays: 0,

      // Fechas
      createdAt: getLocalDate(new Date()),
      startDate: inputDebt.startDate,

      // Otros campos de la deuda
      pledge: inputDebt.pledge,
      pledgeDescription: inputDebt.pledgeDescription,
      pledgeValue: inputDebt.pledgeValue,
      auditorNotes: inputDebt.auditorNotes,
    };

    // 4. Generar cuotas
    const {
      installments,
      expectedEndDate,
      nextPaymentDue,
      total_deuda_a_pagar,
    } = generateInstallments2(
      debt,
      customer.applicant.address,
      customer.applicant.idNumber,
      companyId,
      input.months,
    );

    // Validar el resultado del generador antes de persistir
    if (
      !Number.isFinite(total_deuda_a_pagar) ||
      total_deuda_a_pagar < debt.capital ||
      installments.length === 0
    ) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    const total = nonNegative(total_deuda_a_pagar);
    const interest = total - debt.capital;

    // 5. Asignar montos definitivos y recalcular saldos
    debt.installmentCount = installments.length;
    debt.expectedEndDate = expectedEndDate;
    debt.nextPaymentDue = nextPaymentDue;

    debt.interest = interest;
    debt.amount = total; // Capital + intereses
    debt.total = total;  // Al crear, todavía no hay mora

    debt.remainingCapitalToPay = debt.capital;
    debt.remainingInterestToPay = interest;
    debt.remainingAmountToPay = total;
    debt.remainingArrearsToPay = 0;
    debt.remainingTotalToPay = total;

    debt.outstandingReceivablesAmount = total;
    debt.outstandingReceivablesArrears = 0;
    debt.outstandingReceivablesDeferment = 0;
    debt.outstandingReceivables = total;

    // Todos los porcentajes permanecen en 0 porque no hay pagos.
    debt.percentageOfCapitalPaid = percentage(debt.capitalPaid, debt.capital);
    debt.percentageOfInteresPaid = percentage(debt.interestPaid, debt.interest);
    debt.percentageOfAmountPaid = percentage(debt.amountPaid, debt.amount);
    debt.porcentageOfArrearsPaid = percentage(debt.arrearsPaid, debt.arrears);
    debt.percentageOfTotalPaid = percentage(debt.totalPaid, debt.total);

    // 6. Persistir
    return this.debtGateway.create({
      companyId,
      debt,
    });
  }
}
