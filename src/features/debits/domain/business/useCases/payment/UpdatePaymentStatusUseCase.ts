import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { RouteGateway } from "../../../../../routes/domain/infraestructure/RouteGateway";
import type { Payment } from "../../entities/Payment";

export type UpdatePaymentError =
    | { code: "PAYMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface UpdatePaymentInput {
    companyId: string;
    payment: Payment;
}

export interface UpdatePaymentOutput {
    payment: Payment;
}

export class UpdatePaymentStatusUseCase {
    private readonly paymentGateway: PaymentGateway;
    private readonly routeGateway: RouteGateway;

    constructor(paymentGateway: PaymentGateway, routeGateway: RouteGateway) {
        this.paymentGateway = paymentGateway;
        this.routeGateway = routeGateway;
    }

    async execute(input: { companyId: string, payments: Payment[], newStatus: Payment["status"] }): Promise<Result<{ updatedCount: number }, UpdatePaymentError>> {
        let count = 0;
        try {
            for (const payment of input.payments) {
                const updatedPayment = { ...payment, status: input.newStatus };
                const result = await this.paymentGateway.update({
                    companyId: input.companyId,
                    payment: updatedPayment
                });
                
                if (result.ok) {
                    count++;
                } else {
                    console.error("Failed to update payment", payment.id, result.error);
                }
            }

            // Update balances if confirming
            if (input.newStatus === "confirmado") {
                const routeAmounts: Record<string, number> = {};
                for (const p of input.payments) {
                    const rId = p.idRoute || "default";
                    routeAmounts[rId] = (routeAmounts[rId] || 0) + p.amount;
                }

                for (const [rId, amount] of Object.entries(routeAmounts)) {
                    await this.routeGateway.updateBalance({
                        companyId: input.companyId,
                        routeId: rId,
                        amount: amount
                    });
                }
            }

            return ok({ updatedCount: count });
        } catch (error) {
            console.error("[UpdatePaymentStatusUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
