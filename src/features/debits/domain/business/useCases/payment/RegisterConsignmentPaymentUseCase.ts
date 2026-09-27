import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt, DebtType } from "../../entities/Debt";
import type { BankAccount } from "../../../../../bankAccounts/domain/business/entities/BankAccount";
import type { LocationGPS } from "../../../../../costumers/domain/business/entities/Address";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";

export interface RegisterConsignmentPaymentInput {
    companyId: string;
    amount: number;
    installment: Installment
    debtType: DebtType
    arrears: number;
    location?: LocationGPS;
    file: File;
    bankAccount: BankAccount;
    installmentId: string;
    debtId: string;
    clientId: string;
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
    | { code: "EXCEEDS_TOTAL_DEBT"; maxAllowed: number }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export interface RegisterConsignmentPaymentRepositoryInput {
    companyId: string;
    amount: number;
    location?: LocationGPS;
    paymentId: string;
    proofUrl: string;
    bankAccount: BankAccount;
    installmentId: string;
    debtId: string;
    clientId: string;
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

        const generatedId = this.paymentGateway.generateId(input.companyId);

        const uploadResult = await this.paymentGateway.uploadProof(
            input.file,
            input.companyId,
            generatedId
        );

        if (!uploadResult.ok) {
            return fail({ code: "UPLOAD_FAILED" });
        }

        const proofUrl = uploadResult.value;

        return this.paymentGateway.registerConsignmentPayment({
            companyId: input.companyId,
            amount: input.amount,
            location: input.location,
            paymentId: generatedId,
            proofUrl,
            bankAccount: input.bankAccount,
            installmentId: input.installmentId,
            debtId: input.debtId,
            clientId: input.clientId,
        });
    }
}
