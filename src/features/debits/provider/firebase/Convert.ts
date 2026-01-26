import type { FirestoreDataConverter, QueryDocumentSnapshot } from "firebase/firestore";
import type { Installment } from "../../domain/business/entities/Installment";

export const installmentConverter: FirestoreDataConverter<Installment> = {
  toFirestore(installment: Installment) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id,...data } = installment;
    return data;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
    } as Installment;
  }
};