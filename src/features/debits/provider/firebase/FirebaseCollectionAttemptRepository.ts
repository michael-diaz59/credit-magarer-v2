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



    private toDocumentData(attempt: Omit<CollectionAttempt, "id">): DocumentData {
        const result: DocumentData = {
            installmentId: attempt.installmentId,
            collectorId: attempt.collectorId,
            routeId: attempt.routeId,
            debtId: attempt.debtId,
            customerId: attempt.customerId,
            companyId: attempt.companyId,
            auditorDescription: attempt.auditorDescription,
            colletorDescription: attempt.colletorDescription,
            date: attempt.date ? encodeDate(attempt.date) : undefined,
            location: attempt.location,
            name: attempt.name,
        };

        return removeUndefined(result);
    }

    private toCollectionAttempt(id: string, data: DocumentData): CollectionAttempt {
        return {
            id,
            routeId: data.routeId ?? "",
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

            await setDoc(docRef, this.toDocumentData(attempt));

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

            const attempts = snapshot.docs.map(doc => this.toCollectionAttempt(doc.id, doc.data()));

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

            return ok(this.toCollectionAttempt(snapshot.id, snapshot.data()));
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getById]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
