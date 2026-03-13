import { collection, doc, setDoc, query, where, getDocs, getDoc } from "firebase/firestore";
import { firestore } from "../../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../../core/helpers/ResultC";
import type { CollectionAttempt } from "../../domain/business/entities/CollectionAttempt";
import type {
    CollectionAttemptGateway,
    CreateCollectionAttemptInput
} from "../../domain/infraestructure/CollectionAttemptGateway";
import { FirebaseError } from "firebase/app";

export class FirebaseCollectionAttemptRepository implements CollectionAttemptGateway {
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

            const { id, ...data } = attempt;

            await setDoc(docRef, {
                ...data,
                id: docRef.id
            });

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

            const attempts = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            } as CollectionAttempt));

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

            return ok({
                ...snapshot.data(),
                id: snapshot.id
            } as CollectionAttempt);
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getById]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
