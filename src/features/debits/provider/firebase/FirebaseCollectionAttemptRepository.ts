import { collection, doc, setDoc, query, where, getDocs, getDoc, type DocumentData } from "firebase/firestore";
import { firestore } from "../../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../../domain/business/entities/CollectionAttempt";
import type {
    CollectionAttemptGateway,
    CreateCollectionAttemptInput
} from "../../domain/infraestructure/CollectionAttemptGateway";
import { FirebaseError } from "firebase/app";
import { encodeDate, decodeDate } from "../../../shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";

export class FirebaseCollectionAttemptRepository implements CollectionAttemptGateway {



    private toFirestore(attempt: Partial<CollectionAttempt>): DocumentData {
        const { id: _id, ...data } = attempt;
        const result: any = { ...data };

        if (data.date !== undefined) result.date = encodeDate(data.date);

        return removeUndefined(result);
    }

    private fromFirestore(id: string, data: DocumentData): CollectionAttempt {
        return {
            id,
            installmentId: data.installmentId ?? "",
            collectorId: data.collectorId ?? "",
            debtId: data.debtId ?? "",
            customerId: data.customerId ?? "",
            companyId: data.companyId ?? "",
            auditorDescription: data.auditorDescription,
            colletorDescription: data.colletorDescription ?? "",
            date: data.date ? decodeDate(data.date) : "",
            location: data.location,
            name: data.name ?? "",
        };
    }

    async create(input: CreateCollectionAttemptInput): Promise<Result<null, any>> {
        const { companyId, attempt } = input;

        try {
            const colRef = collection(
                firestore,
                "companies",
                companyId,
                "collectionAttempts"
            );

            const docRef = doc(colRef);

            await setDoc(docRef, this.toFirestore(attempt));

            return ok(null);
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.create]", error);
            if (error instanceof FirebaseError) {
                return fail({ code: "NETWORK_ERROR" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getAllByDate(companyId: string, date: string): Promise<Result<CollectionAttempt[], any>> {
        try {
            const colRef = collection(
                firestore,
                "companies",
                companyId,
                "collectionAttempts"
            );

            // Calculamos el límite del día siguiente para el rango
            const nextDayDate = new Date(date);
            nextDayDate.setDate(nextDayDate.getDate() + 1);
            const nextDay = nextDayDate.toISOString().split("T")[0];

            const q = query(
                colRef,
                where("date", ">=", date),
                where("date", "<", nextDay)
            );

            const snapshot = await getDocs(q);

            const attempts = snapshot.docs.map(doc => this.fromFirestore(doc.id, doc.data()));

            return ok(attempts);
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getAllByDate]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getById(companyId: string, id: string): Promise<Result<CollectionAttempt, any>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "collectionAttempts", id);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                return fail({ code: "ATTEMPT_NOT_FOUND" });
            }

            return ok(this.fromFirestore(snapshot.id, snapshot.data()));
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getById]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
