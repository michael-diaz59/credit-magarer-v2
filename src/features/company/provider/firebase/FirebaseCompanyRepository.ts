import { collection, doc, increment, runTransaction, serverTimestamp, setDoc, getAggregateFromServer, sum, updateDoc, getDocs, type DocumentData } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import { firestore, storage } from "../../../../store/firebase/firebase";
import type { CompanyGateway } from "../../domain/infraestructure/CompanyGateway";
import type { CreateCompanyIncomeInput } from "../../domain/business/useCases/RegisterCompanyIncomeUseCase";
import type { GetIncomesInput, GetIncomesOutput, GetIncomesError } from "../../domain/business/useCases/GetIncomesCase";
import type { Income } from "../../domain/business/entities/Income";

export class FirebaseCompanyRepository implements CompanyGateway {
    async getIncomes(input: GetIncomesInput): Promise<Result<GetIncomesOutput, GetIncomesError>> {
        try {
            const { companyId } = input;

            const incomesCol = collection(
                firestore,
                "companies",
                companyId,
                "incomes",
            );

            const snapshot = await getDocs(incomesCol);

            const incomes: Income[] = snapshot.docs.map(doc => toIncome(doc));

            return ok({
                incomes,
            });
        } catch (error) {
            console.error("[FirebaseCompanyRepository.getIncomes]", error);
            console.log(error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
    async createIncome(input: CreateCompanyIncomeInput): Promise<Result<null, any>> {
        try {
            const { companyId, income } = input;

            const incomesCol = collection(
                firestore,
                "companies",
                companyId,
                "incomes",
            );

            const recordRef = doc(incomesCol);

            await setDoc(recordRef, {
                ...income,
                id: recordRef.id,
                createdAt: serverTimestamp(),
            });

            return ok(null);
        } catch (error) {
            console.error("[FirebaseCompanyRepository.createIncome]", error);
            return fail(error);
        }
    }

    async createIncomeAndUpdateAccount(
        input: CreateCompanyIncomeInput
    ): Promise<Result<string, any>> {
        try {
            const { companyId, income } = input;
            let incomeId = "";

            await runTransaction(firestore, async (tx) => {
                // 1. Referencia a incomes
                const incomesCol = collection(
                    firestore,
                    "companies",
                    companyId,
                    "incomes"
                );

                const incomeRef = doc(incomesCol);
                incomeId = incomeRef.id;

                // 2. Referencia a la cuenta bancaria
                let bankAccountRef = null;
                if (income.bankAccountId) {
                    bankAccountRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "bankAccounts",
                        income.bankAccountId
                    );
                }

                // 3. Crear ingreso
                tx.set(incomeRef, {
                    ...income,
                    id: incomeId,
                    createdAt: serverTimestamp(),
                });

                // 4. Actualizar monto de la cuenta
                if (bankAccountRef) {
                    tx.update(bankAccountRef, {
                        monto: increment(income.amount),
                    });
                }
            });

            return ok(incomeId);
        } catch (error) {
            console.error("[createIncomeAndUpdateAccount]", error);
            return fail(error);
        }
    }

    async uploadIncomeProof(
        companyId: string,
        incomeId: string,
        file: File
    ): Promise<Result<string, any>> {
        try {
            const ext = file.name.split(".").pop();
            const fileName = `proof.${ext}`;
            const path = `companies/${companyId}/incomes/${incomeId}/${fileName}`;
            const fileRef = ref(storage, path);
            await uploadBytes(fileRef, file);
            return ok(fileName);
        } catch (error) {
            console.error("[uploadIncomeProof]", error);
            return fail(error);
        }
    }

    async updateIncomeProof(
        companyId: string,
        incomeId: string,
        fileName: string
    ): Promise<Result<null, any>> {
        try {
            const incomeRef = doc(firestore, "companies", companyId, "incomes", incomeId);
            await updateDoc(incomeRef, { idProof: fileName });
            return ok(null);
        } catch (error) {
            console.error("[updateIncomeProof]", error);
            return fail(error);
        }
    }

    async getSumIncomes(companyId: string): Promise<Result<number, any>> {
        try {
            const ref = collection(firestore, "companies", companyId, "incomes");
            const snapshot = await getAggregateFromServer(ref, {
                total: sum("amount")
            });
            return ok(snapshot.data().total || 0);
        } catch (error) {
            console.error("[getSumIncomes]", error);
            return fail(error);
        }
    }
}

export const toIncome = (doc: DocumentData): Income => {
    const data = doc.data();

    return {
        id: doc.id,
        name: data.name ?? "",
        idProof: data.idProof ?? "",
        investorName: data.investorName ?? "",
        date: data.date ?? "",
        description: data.description ?? "",
        amount: typeof data.amount === "number" ? data.amount : 0,
        entryType: isValidEntryType(data.entryType ?? ""),
        bankAccountId: data.bankAccountId ?? undefined,
        createdAt: data.createdAt ?? "",
    };
};
const isValidEntryType = (
    value: any
): "efectivo" | "consignacion" | "otro" => {
    if (value === "efectivo" || value === "consignacion" || value === "otro") {
        return value;
    }
    return "otro"; // fallback seguro
};
