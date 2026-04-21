import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { RouteGateway } from "../../../../../routes/domain/infraestructure/RouteGateway";
import type { Payment } from "../../entities/Payment";
import type { CashBalances, DepositBalances } from "../../../../../routes/domain/business/entities/Route";

export type UpdateMultiplePaymentsIsTightError =
    | { code: "PAYMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface UpdateMultiplePaymentsIsTightInput {
    companyId: string;
    payments: Payment[];
}

export interface UpdateMultiplePaymentsIsTightOutput {
    updatedCount: number;
}

export class UpdateMultiplePaymentsIsTightUseCase {
    private readonly paymentGateway: PaymentGateway;
    private readonly routeGateway: RouteGateway;

    constructor(paymentGateway: PaymentGateway, routeGateway: RouteGateway) {
        this.paymentGateway = paymentGateway;
        this.routeGateway = routeGateway;
    }

    async execute(input: UpdateMultiplePaymentsIsTightInput): Promise<Result<UpdateMultiplePaymentsIsTightOutput, UpdateMultiplePaymentsIsTightError>> {
        try {
            if (input.payments.length === 0) {
                return ok({ updatedCount: 0 });
            }

            const paymentIds = input.payments.map(p => p.id);

            // 1. Actualizar los pagos a isTight: true
            const result = await this.paymentGateway.updateMultipleIsTight(
                input.companyId,
                paymentIds
            );

            if (!result.ok) {
                return fail(result.error);
            }

            // 2. Agrupar montos por ruta para actualizar balances
            const paymentsByRoute: Record<string, Payment[]> = {};
            for (const p of input.payments) {
                const rId = p.idRoute || "default";
                if (!paymentsByRoute[rId]) paymentsByRoute[rId] = [];
                paymentsByRoute[rId].push(p);
            }

            for (const [routeId, routePayments] of Object.entries(paymentsByRoute)) {
                const cashMap: Record<string, number> = {};
                const depositMap: Record<string, number> = {};

                for (const p of routePayments) {
                    if (p.method === "consignacion") {
                        const bankId = p.bankAccountId || "unknown_bank";
                        depositMap[bankId] = (depositMap[bankId] || 0) + p.amount;
                    } else {
                        // asumimos efectivo por defecto
                        const collId = p.collectorId || "unknown_collector";
                        cashMap[collId] = (cashMap[collId] || 0) + p.amount;
                    }
                }

                const cashEntries: CashBalances[] = Object.entries(cashMap).map(([collectorId, amount]) => ({
                    collectorId,
                    amount
                }));

                const depositEntries: DepositBalances[] = Object.entries(depositMap).map(([bankAccountId, amount]) => ({
                    bankAccountId,
                    amount
                }));

                // 3. Actualizar balances específicos en la ruta
                const routeResult = await this.routeGateway.updateSpecificBalances({
                    companyId: input.companyId,
                    routeId,
                    cashEntries,
                    depositEntries
                });

                if (!routeResult.ok) {
                    console.error(`Failed to update balances for route ${routeId}`, routeResult.error);
                    // Podríamos fallar todo el caso de uso o continuar. 
                    // Dado que los pagos ya se marcaron como isTight, intentamos seguir con las demás rutas.
                }
            }

            return ok({ updatedCount: input.payments.length });
        } catch (error) {
            console.error("[UpdateMultiplePaymentsIsTightUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
