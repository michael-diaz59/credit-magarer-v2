import type { Result } from "../../../../core/helpers/ResultC";
import type { CreateBankAccountInput, CreateBankAccountOutput, CreateBankAccountError } from "../business/useCases/CreateBankAccountUseCase";
import type { DeleteBankAccountError, DeleteBankAccountInput, DeleteBankAccountOutput } from "../business/useCases/DeleteBankAccountUseCase";
import type { GetBankAccountsError, GetBankAccountsInput, GetBankAccountsOutput } from "../business/useCases/GetBankAccountsUseCase";
import type { UpdateBankAccountError, UpdateBankAccountInput, UpdateBankAccountOutput } from "../business/useCases/UpdateBankAccountUseCase";

export interface BankAccountGateway {
    create(input: CreateBankAccountInput): Promise<Result<CreateBankAccountOutput, CreateBankAccountError>>;
    getAll(input: GetBankAccountsInput): Promise<Result<GetBankAccountsOutput, GetBankAccountsError>>;
    update(input: UpdateBankAccountInput): Promise<Result<UpdateBankAccountOutput, UpdateBankAccountError>>;
    delete(input: DeleteBankAccountInput): Promise<Result<DeleteBankAccountOutput, DeleteBankAccountError>>;
}
