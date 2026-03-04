
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { BankAccountGateway } from "../../domain/infraestructure/BankAccountGateway";
import type { BankAccount } from "../../domain/business/entities/BankAccount";
import type { CreateBankAccountInput, CreateBankAccountOutput, CreateBankAccountError } from "../../domain/business/useCases/CreateBankAccountUseCase";
import type { GetBankAccountsInput, GetBankAccountsOutput, GetBankAccountsError } from "../../domain/business/useCases/GetBankAccountsUseCase";
import type { UpdateBankAccountInput, UpdateBankAccountOutput, UpdateBankAccountError } from "../../domain/business/useCases/UpdateBankAccountUseCase";
import type { DeleteBankAccountInput, DeleteBankAccountOutput, DeleteBankAccountError } from "../../domain/business/useCases/DeleteBankAccountUseCase";

export class FirebaseBankAccountRepository implements BankAccountGateway {

    async create(input: CreateBankAccountInput): Promise<Result<CreateBankAccountOutput, CreateBankAccountError>> {
        try {
            const bankAccountsCol = collection(
                firestore,
                "companies",
                input.companyId,
                "bankAccounts"
            );

            const newDocRef = doc(bankAccountsCol);
            const id = newDocRef.id;

            await setDoc(newDocRef, {
                ...input.bankAccount,
                id: id
            });

            return ok({ id });
        } catch (error) {
            console.error("[FirebaseBankAccountRepository.create]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getAll(input: GetBankAccountsInput): Promise<Result<GetBankAccountsOutput, GetBankAccountsError>> {
        try {
            const bankAccountsCol = collection(
                firestore,
                "companies",
                input.companyId,
                "bankAccounts"
            );

            const q = query(bankAccountsCol);
            const snapshot = await getDocs(q);

            const bankAccounts: BankAccount[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name ?? "",
                    bankName: data.bankName ?? "",
                    accountNumber: data.accountNumber ?? "",
                    accountType: data.accountType ?? "",
                    tope: data.tope ?? 0,
                    monto: data.monto ?? 0
                } as BankAccount;
            });

            return ok({ bankAccounts });
        } catch (error) {
            console.error("[FirebaseBankAccountRepository.getAll]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async update(input: UpdateBankAccountInput): Promise<Result<UpdateBankAccountOutput, UpdateBankAccountError>> {
        try {
            const bankAccountRef = doc(
                firestore,
                "companies",
                input.companyId,
                "bankAccounts",
                input.bankAccount.id
            );

            const { id, ...updateData } = input.bankAccount;

            await updateDoc(bankAccountRef, updateData);

            return ok({ success: true });
        } catch (error) {
            console.error("[FirebaseBankAccountRepository.update]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async delete(input: DeleteBankAccountInput): Promise<Result<DeleteBankAccountOutput, DeleteBankAccountError>> {
        try {
            const bankAccountRef = doc(
                firestore,
                "companies",
                input.companyId,
                "bankAccounts",
                input.bankAccountId
            );

            await deleteDoc(bankAccountRef);

            return ok({ success: true });
        } catch (error) {
            console.error("[FirebaseBankAccountRepository.delete]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
