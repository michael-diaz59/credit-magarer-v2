import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type {
  DebtGateway,
  InstallmentGateway,
} from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { GetInstallmentsByDebtCase } from "../installment/GetInstallmentsByDebtCase";
import { UpdateInstallmentByDebtCase } from "../installment/UpdateInstallmentsByDebtCase";
import { CreateInstallmentsUseCase } from "../installment/CreateInstallmentsUseCase";
import { GetDebitByIdCase } from "./GetDebitByIdCase";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";

export type UpdateDebtError =
  | { code: "no hay un cobrador" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "WITHOUT_ACTIVE_STATE" }
  | { code: "ERROR_INSTALLMENTS" };

export interface UpdateDebitInput {
  debt: Debt;
  isNewCollector: boolean;
  companyId: string;
}

export interface UpdateDebitOutput {
  state: Result<null, UpdateDebtError>;
}

export class UpdateDebtUseCase {
  private debtGateway: DebtGateway;
  private updateInstallmentByDebtCase: UpdateInstallmentByDebtCase;
  private getInstallmentsByDebtCase: GetInstallmentsByDebtCase;
  private createInstallmentsUseCase: CreateInstallmentsUseCase;
  private getDebitByIdCase: GetDebitByIdCase;
  private installmentGateway: InstallmentGateway;
  private costumerGateway: CostumerGateway;

  constructor(
    debtGateway: DebtGateway,
    installmentGateway: InstallmentGateway,
    costumerGateway: CostumerGateway,
  ) {
    this.debtGateway = debtGateway;
    this.installmentGateway = installmentGateway;
    this.costumerGateway = costumerGateway;
    this.getInstallmentsByDebtCase = new GetInstallmentsByDebtCase(
      this.installmentGateway,
    );
    this.updateInstallmentByDebtCase = new UpdateInstallmentByDebtCase(
      this.installmentGateway,
    );
    this.createInstallmentsUseCase = new CreateInstallmentsUseCase(
      this.installmentGateway,
    );
    this.getDebitByIdCase = new GetDebitByIdCase(this.debtGateway);
  }

  /** su funcion es actualizar un debt, si el debt tiene un nuevo collector actualiza el collector de sus installments que no esten pagos o cancelados*/
  async execute(input: UpdateDebitInput): Promise<UpdateDebitOutput> {
    if (input.debt.status === "activa") {
      if (!input.debt.collectorId) {
        return { state: fail({ code: "no hay un cobrador" }) };
      }
    }

    // Asegurar que el capital esté presente si se actualiza a través de este caso de uso
    if (!input.debt.capital) {
      input.debt.capital = input.debt.totalAmount;
    }

    // 1. Obtener la deuda actual para comparar
    const currentDebtResult = await this.getDebitByIdCase.execute({
      idDebt: input.debt.id,
      companyId: input.companyId,
    });

    if (!currentDebtResult.state.ok || !currentDebtResult.state.value) {
      return { state: fail({ code: "UNKNOWN_ERROR" }) };
    }

    const currentDebt = currentDebtResult.state.value;

    // 2. Detectar cambios financieros
    const financialChanged =
      currentDebt.totalAmount !== input.debt.totalAmount ||
      currentDebt.installmentCount !== input.debt.installmentCount ||
      currentDebt.interestRate !== input.debt.interestRate ||
      currentDebt.debtTerms !== input.debt.debtTerms;

    if (financialChanged) {
      // Sincronizar cuotas
      const syncResult = await this.syncInstallments(input, currentDebt);
      if (!syncResult.ok) {
        console.log(syncResult.error);
        return { state: fail({ code: "ERROR_INSTALLMENTS" }) };
      }
    } else if (input.isNewCollector) {
      // Solo cambio de cobrador
      const installments = await this.getInstallmentsByDebtCase.execute({
        companyId: input.companyId,
        debtId: input.debt.id,
        status: "pagada",
      });

      if (installments.state.ok) {
        const updateIOnstallment = await this.updateInstallments(
          input,
          installments.state.value,
        );
        if (!updateIOnstallment.ok) {
          return { state: fail(updateIOnstallment.error) };
        }
      }
    }

    const updateResult = await this.debtGateway.update(input);

    // 3. Actualizar contadores del cliente si la deuda pasa a un estado "activo"
    const preliminaryStates = ["tentativa", "preAprobada"];
    const isNowActive = !preliminaryStates.includes(input.debt.status);
    const wasPreliminary = preliminaryStates.includes(currentDebt.status);

    if (updateResult.state.ok && wasPreliminary && isNowActive) {
      const customerResult = await this.costumerGateway.getCostumerById(input.companyId, input.debt.clientId);
      if (customerResult.ok && customerResult.value) {
        const customer = customerResult.value;
        if (input.debt.originalDebt) {
          customer.renovationsCounter = (customer.renovationsCounter ?? 0) + 1;

          // 🆕 Marcar cuotas de la deuda original como renovadas al aprobar
          try {
            const originalInstallmentsResult = await this.installmentGateway.getByDebt({
              companyId: input.companyId,
              debtId: input.debt.originalDebt,
            });

            if (originalInstallmentsResult.state.ok) {
              const toUpdate = originalInstallmentsResult.state.value.filter(
                (inst) => inst.status !== "pagada" && inst.status !== "liquidada"
              );

              if (toUpdate.length > 0) {
                const updatedInstallments = toUpdate.map((inst) => ({
                  ...inst,
                  status: "renovada" as const,
                  paidAmount: inst.amount,
                }));

                await this.installmentGateway.updateByDebt({
                  companyId: input.companyId,
                  debtId: input.debt.originalDebt,
                  installments: updatedInstallments,
                });
              }
            }

            // 🆕 Vincular deuda original con el ID de la nueva deuda (si no se hizo al crear)
            const originalDebtResult = await this.debtGateway.getById({
              idDebt: input.debt.originalDebt,
              companyId: input.companyId,
            });

            if (originalDebtResult.state.ok && originalDebtResult.state.value) {
              const originalDebtEntity = originalDebtResult.state.value;
              if (originalDebtEntity.renewedToDebtId !== input.debt.id) {
                await this.debtGateway.update({
                  companyId: input.companyId,
                  isNewCollector: false,
                  debt: {
                    ...originalDebtEntity,
                    renewedToDebtId: input.debt.id,
                  },
                });
              }
            }
          } catch (error) {
            console.error("Error al actualizar la deuda original durante la aprobación", error);
          }
        } else {
          customer.debtCounter = (customer.debtCounter ?? 0) + 1;
        }
        await this.costumerGateway.UpdateCostumer({
          companyId: input.companyId,
          costumer: customer,
          idUser: "",
          isNameChange: false
        });
      }
    }

    return updateResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private async syncInstallments(
    input: UpdateDebitInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currentDebt: Debt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Result<null, any>> {
    // 1. Obtener todas las cuotas actuales
    const installmentsResult = await this.getInstallmentsByDebtCase.execute({
      companyId: input.companyId,
      debtId: input.debt.id,
    });

    if (!installmentsResult.state.ok) return fail(null);

    const allInstallments = installmentsResult.state.value;
    const paidInstallments = allInstallments.filter(
      (i) => i.status === "pagada",
    );
    const unpaidInstallments = allInstallments.filter(
      (i) => i.status !== "pagada",
    );

    // 2. Eliminar cuotas no pagadas
    if (unpaidInstallments.length > 0) {
      const deleteResult = await this.installmentGateway.deleteBatch(
        input.companyId,
        unpaidInstallments.map((i) => i.id),
      );
      if (!deleteResult.ok) return deleteResult;
    }

    // 3. Generar nuevas cuotas para el saldo restante
    const remainingCount =
      input.debt.installmentCount - paidInstallments.length;
    if (remainingCount <= 0) return ok(null);

    // Determinar fecha inicial para las nuevas cuotas
    let nextDueDate = input.debt.firstDueDate;
    if (paidInstallments.length > 0) {
      // Si hay pagadas, la siguiente sigue la secuencia de la última pagada
      const lastPaid = [...paidInstallments]
        .sort((a, b) => a.installmentNumber - b.installmentNumber)
        .pop()!;
      const lastDate = new Date(lastPaid.dueDate);
      const nextDate = this.createInstallmentsUseCase.getNextDueDate(
        lastDate,
        input.debt.debtTerms,
      );
      nextDueDate = nextDate.toISOString().split("T")[0];
    }

    // Para generar las nuevas cuotas necesitamos el objeto Customer (asumimos que los datos están en la deuda o necesitamos un Gateway)
    // Pero generateInstallmentsFromDebt en CreateInstallmentsUseCase usa customer para nombre/documento/etc.
    // Podemos "mockear" el customer usando los datos que ya vienen en la deuda (costumerName, costumerDocument, etc.)
    const mockCustomer: Customer = {
      debtCounter: 0,
      state: "default",
      whyWasDisable: "",
      renovationsCounter: 0,
      listId: "",
      observations: "",
      calification: "3",

      id: input.debt.clientId,
      coSigner: [],
      vehicle: [],
      familyReference: [],
      applicant: {
        fullName: input.debt.costumerName,
        idNumber: input.debt.costumerDocument,
        phone: "", // No lo tenemos en Debt, se podría añadir o dejar vacío
        address: {
          address: "", // Igual
          neighborhood: "",
          stratum: 0,
          city: "",
        },
        birthCity: "",
        birthDate: "",
        childrenCount: 0,
        housing: {
          landlordName: "",
          landlordPhone: "",
          rentValue: 0,
          type: "PROPIA",
        },
        issueCity: "",
        issueDate: "",
        maritalStatus: "CASADO",
        workInfo: {
          profession: "",
          economicSector: "",
          company: "",
          companyAddress: "",
        },
      },
    };

    const newInstallments =
      this.createInstallmentsUseCase.generateInstallmentsFromDebt(
        input.debt,
        { address: "", neighborhood: "", stratum: 0, city: "" }, // Address mock
        mockCustomer,
        input.companyId,
        {
          startNumber: paidInstallments.length + 1,
          installmentCount: remainingCount,
          firstDueDate: nextDueDate,

        },

      );

    // 4. Persistir las nuevas cuotas
    const saveResult = await this.installmentGateway.createForNewDebt({
      companyId: input.companyId,
      debtId: input.debt.id,
      input: newInstallments,
    });

    return saveResult.state;
  }

  /**actualiza los installments(unicamente el collector de los installments)*/
  private async updateInstallments(
    input: UpdateDebitInput,
    installments: Installment[],
  ): Promise<Result<null, UpdateDebtError>> {
    const updateInstallmentByDebtCase =
      await this.updateInstallmentByDebtCase.execute({
        installments: installments,
        debtId: input.debt.id,
        companyId: input.companyId,
      });

    if (updateInstallmentByDebtCase.state.ok) {
      return ok(null);
    } else {
      console.log(updateInstallmentByDebtCase.state.error);
      return fail<UpdateDebtError>({ code: "ERROR_INSTALLMENTS" });
    }
  }
}
