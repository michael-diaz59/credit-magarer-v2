import { getLocalDate } from "../../../../../../core/helpers/dates/calculateDays";
import {
    fail,
    ok,
    type Result,
} from "../../../../../../core/helpers/ResultC";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";

import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";
import { FirebaseCostumerRepository } from "../../../../../costumers/repository/FirebaseCostumerRepository";

import type { Debt } from "../../../../../debits/domain/business/entities/Debt";
import type { PaymentMethod } from "../../../../../debits/domain/business/entities/Payment";
import { generateInstallments2 } from "../../../../../debits/domain/business/useCases/helper";
import type { MarkDisbursementDeliveryItem, MarkDisbursementsAsDeliveredInput } from "../../../infraestructure/DisbursementGateway";
import type DisbursementGateway from "../../../infraestructure/DisbursementGateway";



import type { Disbursement } from "../../entities/Disbursement";

export interface DisbursementInput {
    debtName: string;
    amount: number;
    debtId: string;
    method: PaymentMethod;
    collectorId?: string;
    collectorName?: string;
    clientId: string;
    clientName: string;
    accountantId: string;
    accountantName: string;
    routeId: string;
    routeName: string;
}

export interface MarkDisbursementDeliveredAndActivateDebtInput {
    companyId: string;
    debt: Debt[];
    disbursements: DisbursementInput[];
}

export interface MarkDisbursementDeliveredAndActivateDebtOutput {
    state: boolean;
}

export type MarkDisbursementDeliveredAndActivateDebtErrors =
    | "TRANSACTION_ERROR"
    | "UNKNOWN_ERROR"
    | "CUSTOMER_NOT_FOUND"
    | "DEBT_NOT_FOUND";

export interface MarkDisbursementDeliveredAndActivateDebtError {
    code: MarkDisbursementDeliveredAndActivateDebtErrors;
}

export class MarkDisbursementDeliveredAndActivateDebtCase {
    private readonly disbursementGateway: DisbursementGateway;
    private readonly costumerGateway: CostumerGateway;

    constructor(disbursementGateway: DisbursementGateway) {
        this.disbursementGateway = disbursementGateway;
        this.costumerGateway = new FirebaseCostumerRepository();
    }

    async execute(
        input: MarkDisbursementDeliveredAndActivateDebtInput,
    ): Promise<
        Result<
            MarkDisbursementDeliveredAndActivateDebtOutput,
            MarkDisbursementDeliveredAndActivateDebtError
        >
    > {
        try {
            /**
             * Indexamos las deudas por ID para no hacer .find()
             * por cada desembolso.
             */
            const debtById = new Map(
                input.debt.map((debt) => [debt.id, debt]),
            );

            /**
             * Cacheamos clientes para evitar realizar varias
             * lecturas si varias deudas pertenecen al mismo cliente.
             */
            const customerByDocument = new Map<string, Customer>();

            const items: MarkDisbursementDeliveryItem[] = [];

            for (const disbursementInput of input.disbursements) {
                /**
                 * 1. Buscar la deuda correspondiente.
                 */
                const debt = debtById.get(disbursementInput.debtId);

                if (!debt) {
                    return fail({
                        code: "DEBT_NOT_FOUND",
                    });
                }

                /**
                 * 2. Obtener cliente.
                 *
                 * Si varias deudas pertenecen al mismo cliente,
                 * reutilizamos la lectura.
                 */
                let customer = customerByDocument.get(
                    debt.clientDocument,
                );

                if (!customer) {
                    const clientResult =
                        await this.costumerGateway.getCostumerByIdNumber({
                            companyId: input.companyId,
                            documentId: debt.clientDocument,
                        });

                    if (!clientResult.state.ok) {
                        return fail({
                            code: "CUSTOMER_NOT_FOUND",
                        });
                    }

                    if (!clientResult.state.value) {
                        return fail({
                            code: "CUSTOMER_NOT_FOUND",
                        });
                    }

                    customer = clientResult.state.value;

                    customerByDocument.set(
                        debt.clientDocument,
                        customer,
                    );
                }

                /**
                 * 3. Generar SOLO las cuotas de esta deuda.
                 */
                const { installments } = generateInstallments2(
                    debt,
                    customer.applicant.address,
                    customer.applicant.phone,
                    input.companyId,
                );

                console.log("installments", installments);



                /**
                 * 4. Crear el documento de desembolso.
                 */
                const now = getLocalDate(new Date());

                const disbursement: Disbursement = {
                    isValidAccountant: true,
                    isValidCollector: true,
                    idProofOfPayment: "",
                    bankAccountId: "",
                    method: disbursementInput.method,
                    createdAt: now,
                    updatedAt: now,
                    id: "",
                    debtName: disbursementInput.debtName,
                    amount: disbursementInput.amount,
                    accountantNotes: "",
                    clientId: disbursementInput.clientId,
                    clientName: disbursementInput.clientName,
                    accountantId: disbursementInput.accountantId,
                    accountantName: disbursementInput.accountantName,
                    routeId: disbursementInput.routeId,
                    routeName: disbursementInput.routeName,
                    collectorId: disbursementInput.collectorId,
                    collectorName: disbursementInput.collectorName,
                    debtId: disbursementInput.debtId,
                    pendingAmount: 0,
                    deliveredAmount: disbursementInput.amount,
                    status: "entregado",
                };

                /**
                 * 5. Construimos una unidad completa:
                 *
                 * desembolso + deuda + cuotas
                 */
                items.push({
                    disbursement,
                    debtId: debt.id,
                    installments,
                });
            }

            /**
             * 6. Persistir todas las operaciones.
             */
            const gatewayInput: MarkDisbursementsAsDeliveredInput = {
                companyId: input.companyId,
                items,
            };

            const result =
                await this.disbursementGateway
                    .markAsDeliveredAndActivateDebt(gatewayInput);

            if (!result.ok) {
                return fail({
                    code: "TRANSACTION_ERROR",
                });
            }

            return ok({
                state: true,
            });
        } catch (error) {
            console.error(
                "[MarkDisbursementDeliveredAndActivateDebtCase]",
                error,
            );

            return fail({
                code: "UNKNOWN_ERROR",
            });
        }
    }
}