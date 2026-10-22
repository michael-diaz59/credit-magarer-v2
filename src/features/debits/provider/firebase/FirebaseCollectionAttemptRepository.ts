import { collection, doc, setDoc, query, where, getDocs, getDoc, type DocumentData, Timestamp } from "firebase/firestore";
import { firestore } from "../../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../../core/helpers/ResultC";
import type {
    CollectionAttemptGateway,
    CollectionAttemptError,
    CreateCollectionAttemptInput
} from "../../domain/infraestructure/CollectionAttemptGateway";
import { FirebaseError } from "firebase/app";
import { encodeDate, decodeDate } from "../../../../core/shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../../core/helpers/cleanFirestoreData";
import type { CollectionAttempt } from "../../domain/business/entities/CollectionAttempt";

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

    async create(input: CreateCollectionAttemptInput): Promise<Result<null, CollectionAttemptError>> {
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

    async getAllByDate(companyId: string, date: string): Promise<Result<CollectionAttempt[], CollectionAttemptError>> {
        try {
            const colRef = collection(
                firestore,
                "companies",
                companyId,
                "collectionAttempts"
            );

            // Rango de medianoche local a medianoche del siguiente día
            const [year, month, day] = date.split("-").map(Number);
            const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
            const endLocal = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
            const startTimestamp = Timestamp.fromDate(startLocal);
            const endTimestamp = Timestamp.fromDate(endLocal);

            const q = query(
                colRef,
                where("date", ">=", startTimestamp),
                where("date", "<", endTimestamp)
            );

            let snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Fallback para documentos que hayan guardado date como string
                const nextDayDate = new Date(date);
                nextDayDate.setDate(nextDayDate.getDate() + 1);
                const nextDay = nextDayDate.toISOString().split("T")[0];

                const qString = query(
                    colRef,
                    where("date", ">=", date),
                    where("date", "<", nextDay)
                );
                const stringSnapshot = await getDocs(qString);
                if (!stringSnapshot.empty) {
                    snapshot = stringSnapshot;
                }
            }

            const attempts = snapshot.docs.map(doc => this.toCollectionAttempt(doc.id, doc.data()));

            return ok(attempts);
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getAllByDate]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async getById(companyId: string, id: string): Promise<Result<CollectionAttempt, CollectionAttemptError>> {
        try {
            const docRef = doc(firestore, "companies", companyId, "collectionAttempts", id);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                return fail({ code: "NOT_FOUND" });
            }

            return ok(this.toCollectionAttempt(snapshot.id, snapshot.data()));
        } catch (error) {
            console.error("[FirebaseCollectionAttemptRepository.getById]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
