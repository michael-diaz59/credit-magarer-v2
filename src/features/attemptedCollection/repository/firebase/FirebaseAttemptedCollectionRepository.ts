import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, limit, type DocumentData } from "firebase/firestore";
import { firestore } from "../../../../store/firebase/firebase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";

import type { AttemptedCollectionErrors } from "../../domain/business/entities/types";


import { FirebaseError } from "firebase/app";

import type AttemptedCollectionGateway from "../../domain/infraestructure/AttemptedCollectionGateway";
import type AttemptedCollection from "../../domain/business/entities/AttemptedCollection";

import type { CreateAttemptedCollectionUseCaseInput } from "../../domain/business/useCases/CreateAttemptedCollectionUseCase";
import type { GetAttemptedCollectionByIdUseCaseInput, GetAttemptedCollectionByIdUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionByIdUseCase";
import type { GetAttemptedCollectionsByRouteUseCaseInput, GetAttemptedCollectionsByRouteUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByRouteUseCase";
import type { GetAttemptedCollectionsByInstallmentUseCaseInput, GetAttemptedCollectionsByInstallmentUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByInstallmentUseCase";
import type { GetAttemptedCollectionsByDebtUseCaseInput, GetAttemptedCollectionsByDebtUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByDebtUseCase";
import type { GetAttemptedCollectionsByClientUseCaseInput, GetAttemptedCollectionsByClientUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByClientUseCase";
import type { GetAttemptedCollectionsByCollectorUseCaseInput, GetAttemptedCollectionsByCollectorUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByCollectorUseCase";
import type { GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput, GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput } from "../../domain/business/useCases/GetAttemptedCollectionsByDateRangeAndDebtUseCase";

export const documentToAttemptedCollection = (doc: DocumentData, id?: string): AttemptedCollection => {
  const data = "data" in doc ? doc.data() : doc;
  const documentId = "id" in doc ? doc.id : (id ?? "");

  return {
    id: documentId,
    idClient: data.idClient ?? "",
    idCollector: data.idCollector ?? "",
    idDebt: data.idDebt ?? "",
    idInstallment: data.idInstallment ?? "",
    idRoute: data.idRoute ?? "",
    description: data.description ?? "",
    createAt: data.createAt ?? "",
    locationAttemptedPayment: data.locationAttemptedPayment,
    outstandingAmount: data.outstandingAmount ?? 0,
    outstandingCapital: data.outstandingCapital ?? 0,
    outstandingInterest: data.outstandingInterest ?? 0,
    outstandingArrears: data.outstandingArrears ?? 0,
    outstandingTotal: data.outstandingTotal ?? 0,
  };
};

export const attemptedCollectionToDocumentData = (attempt: Omit<AttemptedCollection, "id">): DocumentData => {
  return {
    idClient: attempt.idClient,
    idCollector: attempt.idCollector,
    idDebt: attempt.idDebt,
    idInstallment: attempt.idInstallment,
    idRoute: attempt.idRoute,
    description: attempt.description,
    createAt: attempt.createAt,
    locationAttemptedPayment: attempt.locationAttemptedPayment ?? null,
    outstandingAmount: attempt.outstandingAmount,
    outstandingCapital: attempt.outstandingCapital,
    outstandingInterest: attempt.outstandingInterest,
    outstandingArrears: attempt.outstandingArrears,
    outstandingTotal: attempt.outstandingTotal,
  };
};

export default class FirebaseAttemptedCollectionRepository implements AttemptedCollectionGateway {

  private mapError(error: unknown): Result<never, AttemptedCollectionErrors> {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "permission-denied":
        case "unavailable":
          return fail({ code: "NETWORK_ERROR" });
      }
    }
    return fail({ code: "UNKNOWN_ERROR" });
  }

  private collectionRef(companyId: string) {
    return collection(firestore, "companies", companyId, "attemptedCollections");
  }

  async createAttemptedCollection(input: CreateAttemptedCollectionUseCaseInput): Promise<Result<string, AttemptedCollectionErrors>> {
    try {
      const attemptId = input.attempt.id || crypto.randomUUID();
      input.attempt.id = attemptId;

      const ref = doc(this.collectionRef(input.companyId), attemptId);
      await setDoc(ref, attemptedCollectionToDocumentData(input.attempt));

      return ok(attemptId);
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionById(input: GetAttemptedCollectionByIdUseCaseInput): Promise<Result<GetAttemptedCollectionByIdUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const ref = doc(this.collectionRef(input.companyId), input.attemptId);
      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        return ok({ attempt: null });
      }

      return ok({ attempt: documentToAttemptedCollection(snapshot) });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByRoute(input: GetAttemptedCollectionsByRouteUseCaseInput): Promise<Result<GetAttemptedCollectionsByRouteUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idRoute", "==", input.idRoute),
        orderBy("createAt", "desc"),
        limit(100) // Optimize for many attempts
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByInstallment(input: GetAttemptedCollectionsByInstallmentUseCaseInput): Promise<Result<GetAttemptedCollectionsByInstallmentUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idInstallment", "==", input.idInstallment),
        orderBy("createAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByDebt(input: GetAttemptedCollectionsByDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDebtUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idDebt", "==", input.idDebt),
        orderBy("createAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByClient(input: GetAttemptedCollectionsByClientUseCaseInput): Promise<Result<GetAttemptedCollectionsByClientUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idClient", "==", input.idClient),
        orderBy("createAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByCollector(input: GetAttemptedCollectionsByCollectorUseCaseInput): Promise<Result<GetAttemptedCollectionsByCollectorUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idCollector", "==", input.idCollector),
        orderBy("createAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }

  async getAttemptedCollectionsByDateRangeAndDebt(input: GetAttemptedCollectionsByDateRangeAndDebtUseCaseInput): Promise<Result<GetAttemptedCollectionsByDateRangeAndDebtUseCaseOutput, AttemptedCollectionErrors>> {
    try {
      const q = query(
        this.collectionRef(input.companyId),
        where("idDebt", "==", input.idDebt),
        where("createAt", ">=", input.startDate),
        where("createAt", "<=", input.endDate),
        orderBy("createAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const attempts: AttemptedCollection[] = snapshot.docs.map(doc => documentToAttemptedCollection(doc));

      return ok({ attempts });
    } catch (error) {
      return this.mapError(error);
    }
  }
}
