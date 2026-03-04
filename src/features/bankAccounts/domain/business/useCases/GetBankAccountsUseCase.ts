
import { type Result } from "../../../../../core/helpers/ResultC";
import type { BankAccountGateway } from "../../infraestructure/BankAccountGateway";
import type { BankAccount } from "../entities/BankAccount";

export type GetBankAccountsError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export interface GetBankAccountsInput {
    companyId: string;
}

export interface GetBankAccountsOutput {
    bankAccounts: BankAccount[];
}

export class GetBankAccountsUseCase {
    private gateway: BankAccountGateway;
    constructor(gateway: BankAccountGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetBankAccountsInput): Promise<Result<GetBankAccountsOutput, GetBankAccountsError>> {
        return await this.gateway.getAll(input);
    }
}
