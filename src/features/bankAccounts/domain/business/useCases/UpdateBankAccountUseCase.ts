
import type { Result } from "../../../../../core/helpers/ResultC";
import type { BankAccountGateway } from "../../infraestructure/BankAccountGateway";
import type { BankAccount } from "../entities/BankAccount";

export type UpdateBankAccountError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "EXCEEDS_LIMIT"; limit: number };

export interface UpdateBankAccountInput {
    companyId: string;
    bankAccount: BankAccount;
}

export interface UpdateBankAccountOutput {
    success: boolean;
}

export class UpdateBankAccountUseCase {
    private gateway: BankAccountGateway;
    constructor(gateway: BankAccountGateway) {
        this.gateway = gateway;
    }

    async execute(input: UpdateBankAccountInput): Promise<Result<UpdateBankAccountOutput, UpdateBankAccountError>> {
        if (input.bankAccount.monto > input.bankAccount.tope) {
            return { ok: false, error: { code: "EXCEEDS_LIMIT", limit: input.bankAccount.tope } };
        }
        return await this.gateway.update(input);
    }
}
