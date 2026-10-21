import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt } from "../../entities/Debt";
import type { LocationGPS } from "../../../../../costumers/domain/business/entities/Address";
import type {
    PaymentGateway,
    RegisterCashPaymentRepositoryInput,
} from "../../../infraestructure/PaymentGateway";
import {
    calculatePaymentBreakdown,
    calculateOutstandingReceivables,
    type OutstandingReceivables,
    type PaymentBreakdownResult
} from "./RegisterConsignmentPaymentUseCase";

export interface RegisterCashPaymentInput {
    companyId: string;
    amount: number;
    arrears: number;
    collectorId: string;
    collectorName: string;
    installment: Installment;
    debt: Debt;
    location?: LocationGPS;
}

export interface RegisterCashPaymentOutput {
    payment: Payment;
    installment: Installment;
    debt: Debt;
    newCollectorAmount?: number;
}

export type RegisterCashPaymentError =
    | { code: "USER_NOT_FOUND" }
    | { code: "DEBT_NOT_FOUND" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "INSTALLMENT_STATE_MISMATCH" }
    | { code: "DEBT_STATE_MISMATCH" }
    | { code: "EXCEEDS_TOTAL_DEBT"; maxAllowed: number }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export function buildCashPaymentEntity(
    input: RegisterCashPaymentInput,
    paymentId: string,
    breakdown: PaymentBreakdownResult,
    paidAt: string
): Payment {
    return {
        id: paymentId,
        clientId: input.installment.clientId || input.debt.clientId || "",
        clientName: input.installment.clientName || input.debt.clientName || "",
        collectorId: input.collectorId || "",
        collectorName: input.collectorName || "",
        debtId: input.debt.id || input.installment.debtId,
        installmentId: input.installment.id,
        idRoute: input.debt.routeId || input.installment.routeId || "",
        amount: input.amount + input.arrears,
        capitalPaid: breakdown.capitalPaid,
        interestPaid: breakdown.interestPaid,
        arrearsPaid: breakdown.arrearsPaid,
        defermentPaid: breakdown.defermentPaid,
        method: "efectivo",
        status: "registrado",
        paidAt,
        location: input.location,
        isTight: false,
        collectorObservation: "",
        accountantObservation: "",
    };
}

export function toRegisterCashPaymentRepositoryInput(
    input: RegisterCashPaymentInput,
    payment: Payment,
    installmentOutstandingReceivables: OutstandingReceivables,
    debtOutstandingReceivables: OutstandingReceivables
): RegisterCashPaymentRepositoryInput {
    return {
        companyId: input.companyId,
        payment,
        collectorId: input.collectorId,
        expectedInstallmentState: {
            capitalPaid: input.installment.capitalPaid ?? 0,
            interestPaid: input.installment.interestPaid ?? 0,
            arrearsPaid: input.installment.arrearsPaid ?? 0,
            defermentPaid: input.installment.defermentPaid ?? 0,
        },
        expectedDebtState: {
            capitalPaid: input.debt.capitalPaid ?? 0,
            interestPaid: input.debt.interestPaid ?? 0,
            arrearsPaid: input.debt.arrearsPaid ?? 0,
            defermentPaid: input.debt.defermentPaid ?? 0,
        },
        installmentOutstandingReceivables,
        debtOutstandingReceivables,
    };
}

export class RegisterCashPaymentUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(
        input: RegisterCashPaymentInput
    ): Promise<Result<RegisterCashPaymentOutput, RegisterCashPaymentError>> {
        try {
            const paymentId = await this.paymentGateway.getNewId(input.companyId);

            const breakdown = calculatePaymentBreakdown({
                amount: input.amount,
                arrears: input.arrears,
                installment: input.installment,
                debtType: input.debt.type,
            });

            const installmentOutstandingReceivables = calculateOutstandingReceivables(breakdown, input.installment);
            const debtOutstandingReceivables = calculateOutstandingReceivables(breakdown, input.debt);

            const paidAtStr = new Date().toISOString();
            const payment = buildCashPaymentEntity(input, paymentId, breakdown, paidAtStr);

            const repoInput = toRegisterCashPaymentRepositoryInput(
                input,
                payment,
                installmentOutstandingReceivables,
                debtOutstandingReceivables
            );

            const result = await this.paymentGateway.registerCashPayment(repoInput);

            if (!result.ok) {
                return fail(result.error);
            }

            return ok({
                payment: result.value.payment,
                installment: result.value.installment,
                debt: result.value.debt,
                newCollectorAmount: result.value.newCollectorAmount,
            });
        } catch (error) {
            console.error("[RegisterCashPaymentUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
