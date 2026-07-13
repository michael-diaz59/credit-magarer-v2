import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type {
    DebtGateway,
    InstallmentGateway,
} from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { GetInstallmentsByDebtCase } from "../installment/GetInstallmentsByDebtCase";
import { UpdateInstallmentByDebtCase } from "../installment/UpdateInstallmentsByDebtCase";
import { GetDebitByIdCase } from "./GetDebitByIdCase";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";

export type UpdateDebtSimpleError =
    | { code: "no hay una ruta asignada" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "WITHOUT_ACTIVE_STATE" }
    | { code: "ERROR_INSTALLMENTS" };

export interface UpdateSimpleDebtInput {
    debt: Debt;
    companyId: string;
    isNewRoute: boolean;
}

export interface UpdateSimpleDebtOutput {
    state: Result<null, UpdateDebtSimpleError>;
}

export class UpdateSimpleDebtCase {
    private debtGateway: DebtGateway;
    private updateInstallmentByDebtCase: UpdateInstallmentByDebtCase;
    private getInstallmentsByDebtCase: GetInstallmentsByDebtCase;
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
        this.getDebitByIdCase = new GetDebitByIdCase(this.debtGateway);
    }

    /** su funcion es actualizar un debt, si el debt tiene un nuevo collector actualiza el collector de sus installments que no esten pagos o cancelados*/
    async execute(input: UpdateSimpleDebtInput): Promise<UpdateSimpleDebtOutput> {
        console.log("startDate:" + input.debt.startDate)
        if (input.debt.status === "activa") {
            if (!input.debt.routeId) {
                return { state: fail({ code: "no hay una ruta asignada" }) };
            }
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

        console.log("delivered", input.debt.delivered, "status", input.debt.status)
        if (input.debt.delivered === false && input.debt.status === "preparacion") {
            console.log("true_preparacion")
            input.debt.deliveredStatus = "true_preparacion"
        }

        //validar cambio de ruta y egercerla
        if (input.isNewRoute) {

            console.log("isNewCollector" + input.isNewRoute)

            // Solo cambio de cobrador
            const installments = await this.getInstallmentsByDebtCase.execute({
                companyId: input.companyId,
                debtId: input.debt.id,
                status: "pagada",
            });

            if (installments.state.ok) {
                for (let installment of installments.state.value) {
                    installment.routeId = input.debt.routeId;

                }
                const updateIOnstallment = await this.updateInstallments(
                    input,
                    installments.state.value,
                );
                if (!updateIOnstallment.ok) {
                    return { state: fail(updateIOnstallment.error) };
                }
            }
        }
        //input.debt.delivered = isDebtStatusDelivered(input.debt.status)

        console.log("input.debt", input.debt)


        const updateResult = await this.debtGateway.update(input);

        // 3. Actualizar contadores del cliente si la deuda fue liquidada
        const preliminaryStates = ["pagada"];
        const isNowActive = preliminaryStates.includes(input.debt.status);
        const wasPreliminary = !preliminaryStates.includes(currentDebt.status);

        if (updateResult.state.ok && wasPreliminary && isNowActive) {
            console.log("actualizar contador de cliente")
            const customerResult = await this.costumerGateway.getCostumerById(input.companyId, input.debt.clientId);
            if (customerResult.ok && customerResult.value) {
                const customer = customerResult.value;
                if (input.debt.originalDebt && !currentDebt.originalDebt) {
                    customer.renovationsCounter = (customer.renovationsCounter ?? 0) + 1;

                    // 🆕 Marcar cuotas de la deuda original como renovadas al aprobar
                    try {
                        const originalInstallmentsResult = await this.installmentGateway.getByDebt({
                            companyId: input.companyId,
                            debtId: input.debt.originalDebt,
                        });

                        if (originalInstallmentsResult.state.ok) {
                            const toUpdate = originalInstallmentsResult.state.value.filter(
                                (inst) => inst.status !== "pagada" && inst.status !== "liquidada" && inst.status !== "cancelada"
                            );

                            if (toUpdate.length > 0) {
                                const updatedInstallments = toUpdate.map((inst) => ({
                                    ...inst,
                                    status: "pagada" as const,
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


                            /**valor del credito que queda por pagarse */
                            const remainingValue = originalDebtEntity.totalAmount - originalDebtEntity.totalPaid;
                            let updateNeeded = false;

                            //marca como ganancias a la deuda original
                            if (originalDebtEntity.creditPaid > 100) {
                                originalDebtEntity.creditPaid = 100;
                                updateNeeded = true;
                            }

                            if (originalDebtEntity.renewedToDebtId !== input.debt.id) {
                                originalDebtEntity.renewedToDebtId = input.debt.id;
                                updateNeeded = true;
                            }

                            if (remainingValue > 0) {
                                originalDebtEntity.renewalPayment = remainingValue;
                                updateNeeded = true;
                                console.log("remainingValue", remainingValue)
                            }

                            if (originalDebtEntity.status !== "pagada") {
                                originalDebtEntity.status = "pagada";
                                updateNeeded = true;
                            }

                            if (updateNeeded) {
                                console.log("updateNeeded", originalDebtEntity.startDate)
                                await this.debtGateway.update({
                                    companyId: input.companyId,
                                    isNewRoute: false,
                                    debt: originalDebtEntity,
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


    // deuda tecnica, mejorar por lotes para actualizacion de varios isntallments
    /**actualiza los installments*/
    private async updateInstallments(
        input: UpdateSimpleDebtInput,
        installments: Installment[],
    ): Promise<Result<null, UpdateDebtSimpleError>> {
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
            return fail<UpdateDebtSimpleError>({ code: "ERROR_INSTALLMENTS" });
        }
    }
}
