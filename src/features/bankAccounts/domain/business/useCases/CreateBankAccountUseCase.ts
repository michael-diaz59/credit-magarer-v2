
import { type Result } from "../../../../../core/helpers/ResultC";
import type { BankAccountGateway } from "../../infraestructure/BankAccountGateway";
import type { BankAccount } from "../entities/BankAccount";

export type CreateBankAccountError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "EXCEEDS_LIMIT"; limit: number };

export interface CreateBankAccountInput {
    companyId: string;
    bankAccount: Omit<BankAccount, "id">;
}

export interface CreateBankAccountOutput {
    id: string;
}

export class CreateBankAccountUseCase {
    private gateway: BankAccountGateway;
    constructor(gateway: BankAccountGateway) {
        this.gateway = gateway;
    }

    async execute(input: CreateBankAccountInput): Promise<Result<CreateBankAccountOutput, CreateBankAccountError>> {
        if (input.bankAccount.monto > input.bankAccount.tope) {
            return { ok: false, error: { code: "EXCEEDS_LIMIT", limit: input.bankAccount.tope } };
        }
        return await this.gateway.create(input);
    }
}
