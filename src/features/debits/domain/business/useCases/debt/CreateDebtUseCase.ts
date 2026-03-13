
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";
import type { DebtGateway, InstallmentGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { generateInstallments2 } from "../helper";

export type CreateDebtError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "STATE_INVALID" }
  | { code: "CUSTOMER_NOT_FOUND" }
  | { code: "el monton total debe ser mayor a 1000" }

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

    console.log(input.debt.totalAmount)
    if (input.debt.totalAmount < 1000) {
      return fail({ code: "el monton total debe ser mayor a 1000" });
    }

    /** 2️⃣ Buscar cliente */
    const costumerResult =
      await this.costumerGateway.getCostumerByIdNumber({
        companyId: input.companyId,
        documentId: input.debt.costumerDocument,
      });

    if (!costumerResult.state.ok) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    if (!costumerResult.state.value) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    const costumer = costumerResult.state.value;

    /** 3️⃣ Debt FINAL */
    const debt: Debt = {
      id: crypto.randomUUID(),
      collectorId: input.debt.collectorId,
      type: input.debt.type,
      idVisit: input.debt.idVisit,
      debtTerms: input.debt.debtTerms,
      name: input.debt.name || "",
      diasMes: input.debt.diasMes,
      status: input.debt.status,
      clientId: costumer.id,
      costumerName: costumer.applicant.fullName,
      costumerDocument: input.debt.costumerDocument,
      totalAmount: input.debt.totalAmount,
      totalPaid: 0,
      totalPaymentForLate: 0,
      installmentCount: input.debt.installmentCount,
      interestRate: input.debt.interestRate,
      startDate: input.debt.startDate,
      createdAt: new Date().toISOString().slice(0, 10),
      firstDueDate: "",
      nextPaymentDue: "",
      dateLastPayment: "",
      installmentsPaid: 0,
      overdueInstallmentsCount: 0,
      capital: input.debt.totalAmount,
      originalDebt: input.debt.originalDebt ?? undefined,
    };

    /** 4️⃣ Generar cuotas */
    const { installments, firstDueDate, nextPaymentDue } = generateInstallments2(
      debt,
      costumer.applicant.address,
      input.companyId,
      input.months,

    );

    debt.nextPaymentDue = nextPaymentDue;
    debt.overdueInstallmentsCount = 0;

    debt.firstDueDate = firstDueDate;

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
                  isNewCollector: false,
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
