import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt, DebtType } from "../../entities/Debt";
import type { BankAccount } from "../../../../../bankAccounts/domain/business/entities/BankAccount";
import type { LocationGPS } from "../../../../../costumers/domain/business/entities/Address";
import type {
    PaymentGateway,
    RegisterPaymentRepositoryInput,
    RegisterPaymentRepositoryOutput,
    RegisterPaymentRepositoryError
} from "../../../infraestructure/PaymentGateway";

export interface RegisterConsignmentPaymentInput {
    amount: number;
    arrears: number;
    collectorId: string;
    collectorName: string;
    installment: Installment;
    debt: Debt;
    location?: LocationGPS;
    file: File;
    bankAccount: BankAccount;
}

export interface RegisterConsignmentPaymentOutput {
    payment: Payment;
    installment: Installment;
    debt: Debt;
    bankAccount: BankAccount;
}

export type RegisterConsignmentPaymentError =
    | { code: "UPLOAD_FAILED" }
    | { code: "BANK_ACCOUNT_NOT_FOUND" }
    | { code: "DEBT_NOT_FOUND" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "INSTALLMENT_STATE_MISMATCH" }
    | { code: "DEBT_STATE_MISMATCH" }
    | { code: "EXCEEDS_TOTAL_DEBT"; maxAllowed: number }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface OutstandingReceivables {
    outstandingReceivablesAmount: number;
    outstandingReceivablesDeferment: number;
    outstandingReceivablesArrears: number;
    outstandingReceivables: number;
}

export interface PaymentBreakdownParams {
    amount: number;
    arrears: number;
    installment: Installment;
    debtType: DebtType;
}

export interface PaymentBreakdownResult {
    capitalPaid: number;
    interestPaid: number;
    defermentPaid: number;
    arrearsPaid: number;
}

export function buildConsignmentPaymentEntity(
    input: RegisterConsignmentPaymentInput,
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
        method: "consignacion",
        status: "registrado",
        paidAt,
        location: input.location,
        bankAccountId: input.bankAccount.id,
        isTight: false,
        collectorObservation: "",
        accountantObservation: "",
    };
}

export function toRegisterPaymentRepositoryInput(
    input: RegisterConsignmentPaymentInput,
    payment: Payment,
    installmentOutstandingReceivables: OutstandingReceivables,
    debtOutstandingReceivables: OutstandingReceivables
): RegisterPaymentRepositoryInput {
    return {
        companyId: input.installment.companyId,
        payment,
        bankAccount: input.bankAccount,
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

export function toRegisterConsignmentPaymentOutput(
    repoOutput: RegisterPaymentRepositoryOutput
): RegisterConsignmentPaymentOutput {
    if (!repoOutput.bankAccount) {
        throw new Error("Bank account is required in consignment payment output");
    }
    return {
        payment: repoOutput.payment,
        installment: repoOutput.installment,
        debt: repoOutput.debt,
        bankAccount: repoOutput.bankAccount,
    };
}

export function toRegisterConsignmentPaymentError(
    repoError: RegisterPaymentRepositoryError
): RegisterConsignmentPaymentError {
    return repoError;
}

export class RegisterConsignmentPaymentUseCase {
    private readonly paymentGateway: PaymentGateway;

    constructor(paymentGateway: PaymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    async execute(
        input: RegisterConsignmentPaymentInput
    ): Promise<Result<RegisterConsignmentPaymentOutput, RegisterConsignmentPaymentError>> {
        if (!input.file) {
            return fail({ code: "UPLOAD_FAILED" });
        }

        const paymentId = await this.paymentGateway.getNewId(input.installment.companyId);

        const breakdown = calculatePaymentBreakdown({
            amount: input.amount,
            arrears: input.arrears,
            installment: input.installment,
            debtType: input.debt.type,
        });

        const installmentOutstandingReceivables = calculateOutstandingReceivables(breakdown, input.installment);
        const debtOutstandingReceivables = calculateOutstandingReceivables(breakdown, input.debt);

        const paidAtStr = new Date().toISOString();
        const payment = buildConsignmentPaymentEntity(input, paymentId, breakdown, paidAtStr);

        const uploadResult = await this.paymentGateway.uploadProof(
            input.file,
            input.installment.companyId,
            payment.id
        );

        if (!uploadResult.ok) {
            console.error("fallo al subir comprobante de pago");
            return fail({
                code: "UNKNOWN_ERROR",
            });
        }

        const repoInput = toRegisterPaymentRepositoryInput(
            input,
            payment,
            installmentOutstandingReceivables,
            debtOutstandingReceivables
        );

        const result = await this.paymentGateway.registerPayment(repoInput);

        if (!result.ok) {
            await this.paymentGateway.deleteProof(
                input.installment.companyId,
                payment.id,
                input.file.name
            );

            console.error("fallo al registrar pago de consignacion");
            return fail(toRegisterConsignmentPaymentError(result.error));
        }

        return ok(toRegisterConsignmentPaymentOutput(result.value));
    }
}

export function calculatePaymentBreakdown(
    params: PaymentBreakdownParams
): PaymentBreakdownResult {
    const { amount, arrears, installment, debtType } = params;

    const pendingCapital = Math.max(0, (installment.capital ?? 0) - (installment.capitalPaid ?? 0));
    const pendingInterest = Math.max(0, (installment.interest ?? 0) - (installment.interestPaid ?? 0));
    const pendingDeferment = Math.max(0, (installment.deferment ?? 0) - (installment.defermentPaid ?? 0));
    const pendingArrears = Math.max(0, (installment.arrears ?? 0) - (installment.arrearsPaid ?? 0));

    let availableAmount = amount;
    let capitalPaid = 0;
    let interestPaid = 0;
    let defermentPaid = 0;
    let arrearsPaid = 0;

    if (debtType === "fijo") {
        capitalPaid = Math.min(availableAmount, pendingCapital);
        availableAmount -= capitalPaid;

        if (availableAmount > 0) {
            interestPaid = Math.min(availableAmount, pendingInterest);
            availableAmount -= interestPaid;
        }
    } else {
        interestPaid = Math.min(availableAmount, pendingInterest);
        availableAmount -= interestPaid;

        if (availableAmount > 0) {
            capitalPaid = Math.min(availableAmount, pendingCapital);
            availableAmount -= capitalPaid;
        }
    }

    let availableArrears = arrears;

    defermentPaid = Math.min(availableArrears, pendingDeferment);
    availableArrears -= defermentPaid;

    if (availableArrears > 0) {
        arrearsPaid = Math.min(availableArrears, pendingArrears);
        availableArrears -= arrearsPaid;
    }
    return {
        capitalPaid,
        interestPaid,
        defermentPaid,
        arrearsPaid,
    };
}

export function calculateOutstandingReceivables(valores: PaymentBreakdownResult, valoresAnteriores: OutstandingReceivables): OutstandingReceivables {
    const outstandingReceivablesAmount = valoresAnteriores.outstandingReceivablesAmount - (valores.capitalPaid + valores.interestPaid);
    const outstandingReceivablesDeferment = valoresAnteriores.outstandingReceivablesDeferment - valores.defermentPaid;
    const outstandingReceivablesArrears = valoresAnteriores.outstandingReceivablesArrears - valores.arrearsPaid;
    const outstandingReceivables = outstandingReceivablesAmount + outstandingReceivablesDeferment + outstandingReceivablesArrears;

    return {
        outstandingReceivablesAmount,
        outstandingReceivablesDeferment,
        outstandingReceivablesArrears,
        outstandingReceivables
    };
}
