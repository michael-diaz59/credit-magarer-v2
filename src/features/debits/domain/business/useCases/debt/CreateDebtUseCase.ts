
import { getLocalDate } from "../../../../../../core/helpers/dates/calculateDays";
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";
import { createEmptyDebt, type Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { generateInstallments2 } from "../helper";

export type CreateDebtError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "STATE_INVALID" }
  | { code: "CUSTOMER_NOT_FOUND" }
  | { code: "el capital debe ser mayor a 1000" }

export interface CreateDebtUInput {
  debt: Omit<Debt, "id">;
  companyId: string
  /**este parametro representa los meses que se quiere que dure la deuda */
  months?: number
}


export interface CreateDebtUOutput {
  debtName: string;
  debtId: string;
}

export interface createWithInstallmentsInput {
  companyId: string;
  debt: Debt;
  installments: Installment[];
}

export class CreateDebtUseCase {
  private debtGateway: DebtGateway;
  private costumerGateway: CostumerGateway;
  private installmentGateway: InstallmentGateway;

  constructor(
    debtGateway: DebtGateway,
    costumerGateway: CostumerGateway,
    installmentGateway: InstallmentGateway,
  ) {
    this.debtGateway = debtGateway;
    this.costumerGateway = costumerGateway;
    this.installmentGateway = installmentGateway;
  }

  async execute(input: CreateDebtUInput): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
    /** 1️⃣ Estado válido */
    const allowedStatuses = ["tentativa", "preAprobada", "activa"];
    if (!allowedStatuses.includes(input.debt.status)) {
      return fail({ code: "STATE_INVALID" });
    }

    if (input.debt.capital < 1000) {
      return fail({ code: "el capital debe ser mayor a 1000" });
    }

    /** 2️⃣ Buscar cliente */
    const clientResult =
      await this.costumerGateway.getCostumerByIdNumber({
        companyId: input.companyId,
        documentId: input.debt.clientDocument,
      });

    if (!clientResult.state.ok) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    if (!clientResult.state.value) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    const costumer: Customer = clientResult.state.value;

    /** 3️⃣ Debt FINAL */
    const debt: Debt = {
      ...createEmptyDebt(),

      //--- datos de la deuda---
      lateInterestRate: input.debt.lateInterestRate,
      type: input.debt.type,
      status: input.debt.status,
      routeId: input.debt.routeId,
      prepayment: input.debt.prepayment,

      //---  cliente ---
      clientId: costumer.id,
      clientName: costumer.applicant.fullName,
      clientDocument: costumer.applicant.idNumber,

      // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
      debtTerms: input.debt.debtTerms,
      daysPerMonth: input.debt.daysPerMonth,
      interestRate: input.debt.interestRate,
      installmentCount: input.debt.installmentCount,

      //dinero
      capital: input.debt.capital,
      interest: input.debt.interest,
      amount: input.debt.capital + input.debt.interest,
      total: input.debt.capital + input.debt.interest,

      processingFee: input.debt.processingFee,

      // --- GARANTÍAS Y PRENDA ---
      pledge: input.debt.pledge,
      pledgeDescription: input.debt.pledgeDescription,
      pledgeValue: input.debt.pledgeValue,

      // --- SEGUIMIENTO DE PAGOS Y SALDOS ---

      //restante por pagar
      remainingCapitalToPay: input.debt.capital,
      //pocentaje pagado
      percentageOfCapitalPaid: 0,
      percentageOfInteresPaid: 0,
      percentageOfAmountPaid: 0,
      percentageOfTotalPaid: 0,

      // --- CUOTAS Y FECHAS (yyyy-mm-dd) ---
      createdAt: getLocalDate(new Date()),
      startDate: input.debt.startDate,
    };

    console.log("debt", debt)

    /** 4️⃣ Generar cuotas */
    const { installments, expectedEndDate, nextPaymentDue, total_deuda_a_pagar } = generateInstallments2(
      debt,
      costumer.applicant.address,
      input.companyId,
      input.months,
    );
    debt.expectedEndDate = expectedEndDate;
    debt.nextPaymentDue = nextPaymentDue;
    debt.installmentCount = installments.length;

    //sumamos el total de las cuotas para obtener el total del credito a pagar
    for (const installment of installments) {
      console.log("installment.amount", installment.amount)
      debt.amount += installment.amount;
      console.log("debt.totalAmount", debt.amount)
    }

    debt.nextPaymentDue = nextPaymentDue;
    debt.expectedEndDate = expectedEndDate;
    debt.amount = total_deuda_a_pagar
    debt.total = total_deuda_a_pagar
    debt.interest = total_deuda_a_pagar - debt.capital

    console.log("debt", debt)

    /** 5️⃣ Persistir TODO */
    const result = await this.debtGateway.createWithInstallments({
      companyId: input.companyId,
      debt,
      installments,
    });

    if (result.ok) {
      const preliminaryStates = ["tentativa", "preAprobada"];
      if (!preliminaryStates.includes(debt.status)) {
        if (debt.originalDebt) {
          costumer.renovationsCounter = (costumer.renovationsCounter ?? 0) + 1;

          // 🆕 Marcar cuotas de la deuda original como renovadas
          try {
            const originalInstallmentsResult =
              await this.installmentGateway.getByDebt({
                companyId: input.companyId,
                debtId: debt.originalDebt,
              });

            if (originalInstallmentsResult.state.ok) {
              const toUpdate = originalInstallmentsResult.state.value.filter(
                (inst) =>
                  inst.status !== "pagada" && inst.status !== "liquidada",
              );

              if (toUpdate.length > 0) {
                const updatedInstallments = toUpdate.map((inst) => ({
                  ...inst,
                  status: "renovada" as const,
                  paidAmount: inst.amount, // Marcarlas como "pagadas" al renovar
                }));

                await this.installmentGateway.updateByDebt({
                  companyId: input.companyId,
                  debtId: debt.originalDebt,
                  installments: updatedInstallments,
                });
              }
            }

            // 🆕 Vincular deuda original con el ID de la nueva deuda
            const originalDebtResult = await this.debtGateway.getById({
              idDebt: debt.originalDebt,
              companyId: input.companyId,
            });

            if (originalDebtResult.state.ok && originalDebtResult.state.value) {
              const originalDebtEntity = originalDebtResult.state.value;
              if (originalDebtEntity.renewedToDebtId !== result.value.debtId) {
                await this.debtGateway.update({
                  companyId: input.companyId,
                  isNewRoute: false,
                  debt: {
                    ...originalDebtEntity,
                    renewedToDebtId: result.value.debtId,
                  },
                });
              }
            }
          } catch (error) {
            console.error("Error al actualizar la deuda original durante la renovación", error);
          }
        } else {
          costumer.debtCounter = (costumer.debtCounter ?? 0) + 1;
        }
        await this.costumerGateway.UpdateCostumer({
          companyId: input.companyId,
          costumer: costumer,
          idUser: "",
          isNameChange: false,
        });
      }
    }

    return result;
  }
}
