import { collection, doc, getDoc, getDocs, runTransaction, type DocumentData } from "firebase/firestore"
import { fail, ok, type Result } from "../../../core/helpers/ResultC"
import type { Costumer } from "../domain/business/entities/Costumer"
import type { GetCostumersErrors, GetCostumerByIdErrors, SaveCostumerError } from "../domain/business/entities/utilities"
import type CostumerGateway from "../domain/infraestructure/CostumerGateway"
import { firestore, storage } from "../../../store/firebase/firebase"
import { FirebaseError } from "firebase/app"
//import type { FamilyReference } from "../domain/business/entities/FamilyReference"
//import type { PersonalInfo } from "../domain/business/entities/PersonalInfo"
//import type { Vehicle } from "../domain/business/entities/Vehicle"
import type { DeleteCostumerInput } from "../domain/business/useCases/DeleteCostumerCase"
import type { GetCostumerByIdNumberInput, GetCostumerByIdNumberOutput } from "../domain/business/useCases/GetCostumerByIdNumber"
import { getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage"

export type DocumentTypeG = "cedula" | "carta_laboral" | "documento_x";

/**deuda tecnica */
function buildPath(
  companyId: string,
  costumerId: string,
  type: DocumentTypeG
) {
  return `companies/${companyId}/customers/${costumerId}/${type}.pdf`;
}

export async function getCustomerDocumentUrl(params: {
  companyId: string;
  costumerId: string;
  type: DocumentTypeG;
}) {
  const { companyId, costumerId, type } = params;

  const fileRef = ref(storage, buildPath(companyId, costumerId, type));

  const url = await getDownloadURL(fileRef); // ❌ lanza error si no existe

  return url;
}

export async function customerDocumentExists(params: {
  companyId: string;
  costumerId: string;
  type: DocumentTypeG;
}) {
  try {
    const { companyId, costumerId, type } = params;
    const fileRef = ref(storage, buildPath(companyId, costumerId, type));
    await getMetadata(fileRef);
    return true;
  } catch {
    return false;
  }
}

/** <-deuda tecnica */
export class FirebaseCostumerRepository implements CostumerGateway {


    async uploadCustomerDocument(params: {
        companyId: string;
        costumerId: string;
        file: File;
        type: DocumentTypeG;
    }) {
        const { companyId, costumerId, file, type } = params;

        const ext = file.name.split(".").pop(); // pdf, jpg, etc
        const path = `companies/${companyId}/customers/${costumerId}/${type}.${ext}`;

        const fileRef = ref(storage, path);

        await uploadBytes(fileRef, file);

        const url = await getDownloadURL(fileRef);

        return {
            path,
            url,
        };
    }
    async getCostumerByIdNumber(input: GetCostumerByIdNumberInput): Promise<GetCostumerByIdNumberOutput> {
        try {
            /* -------- 1. Buscar en índice -------- */
            const indexRef = doc(
                firestore,
                "companies",
                input.companyId,
                "costumer_id_numbers",
                input.documentId
            );

            const indexSnap = await getDoc(indexRef);

            // Si viene de cache, consideras error de red (coherente con tu repo)
            if (indexSnap.metadata.fromCache) {
                return { state: fail({ code: "NETWORK_ERROR" }) };
            }

            // No existe → no hay customer con esa cédula
            if (!indexSnap.exists()) {
                return { state: ok(null) };
            }

            const { costumerId } = indexSnap.data() as {
                costumerId: string;
            };

            /* -------- 2. Obtener customer -------- */
            const costumerRef = doc(
                firestore,
                "companies",
                input.companyId,
                "customers",
                costumerId
            );

            const costumerSnap = await getDoc(costumerRef);

            if (costumerSnap.metadata.fromCache) {
                return { state: fail({ code: "NETWORK_ERROR" }) };
            }

            if (!costumerSnap.exists()) {
                // índice corrupto (caso raro)
                return { state: ok(null) };
            }

            const data = costumerSnap.data();

            const costumer: Costumer = this.dataToCostumer(data, costumerSnap.id)

            return { state: ok(costumer) };
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unauthenticated":
                    case "unavailable":
                        return { state: fail({ code: "NETWORK_ERROR" }) };
                }
            }

            return { state: fail({ code: "UNKNOWN_ERROR" }) };
        }
    }
    async deleteCostumer(
        input: DeleteCostumerInput
    ): Promise<Result<null, SaveCostumerError>> {
        try {
            const { companyId, costumerId, documentId } = input;

            await runTransaction(firestore, async (tx) => {
                tx.delete(
                    doc(firestore, "companies", companyId, "customers", costumerId)
                );

                tx.delete(
                    doc(firestore, "companies", companyId, "costumer_id_numbers", documentId)
                );
            });

            return ok(null);
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unauthenticated":
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
    async getCostumers(companyId: string): Promise<Result<Costumer[], GetCostumersErrors>> {
        try {
            console.log("companies/" + companyId + "/customers")
            const ref = collection(firestore, "companies", companyId, "customers")
            const snapshot = await getDocs(ref)

            const costumers: Costumer[] = snapshot.docs.map((doc) => {
                const data = doc.data()
                return this.dataToCostumer(data, doc.id)

            })

            console.table(
                costumers.map(c => ({
                    id: c.id,
                    applicant: c.applicant?.fullName ?? "N/A"
                }))
            )

            return ok(costumers)
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                        return fail({ code: "UNKNOWN_ERROR" })
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" })
                }
            }
            console.log(error)

            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    async UpdateCostumer(
        costumer: Costumer,
        companyId: string
    ): Promise<Result<void, SaveCostumerError>> {
        try {
            await runTransaction(firestore, async (tx) => {
                const costumerRef = doc(
                    firestore,
                    "companies",
                    companyId,
                    "customers",
                    costumer.id
                );

                const snapshot = await tx.get(costumerRef);

                if (!snapshot.exists()) {
                    throw new Error("NOT_FOUND");
                }

                const oldData = snapshot.data();
                const oldIdNumber = oldData.applicant.idNumber;
                const newIdNumber = costumer.applicant.idNumber;

                // Si cambió la cédula
                if (oldIdNumber !== newIdNumber) {
                    const oldIndexRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "costumer_id_numbers",
                        oldIdNumber
                    );

                    const newIndexRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "costumer_id_numbers",
                        newIdNumber
                    );

                    const newIndexSnap = await tx.get(newIndexRef);

                    if (newIndexSnap.exists()) {
                        return fail("DOCUMENT_EXISTING")
                    }

                    tx.delete(oldIndexRef);
                    tx.set(newIndexRef, {
                        costumerId: costumer.id,
                        createdAt: new Date().toISOString(),
                    });
                }

                tx.set(costumerRef, costumer, { merge: true });
            });

            return ok(undefined);
        } catch (error) {
            if (error instanceof Error && error.message === "ID_NUMBER_ALREADY_EXISTS") {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
    async getCostumerById(companyId: string, costumerId: string): Promise<Result<Costumer | null, GetCostumerByIdErrors>> {
        try {
            const ref = doc(firestore, "companies", companyId, "customers", costumerId)
            console.log("companies/" + companyId + "/customers/" + costumerId)
            const snapshot = await getDoc(ref)

            if (snapshot.metadata.fromCache) {
                console.log("getCostumerById: NETWORK_ERROR")
                return fail({ code: "NETWORK_ERROR" })
            }

            if (!snapshot.exists()) {
                console.log("getCostumerById: costumer no encontrado")
                //costumer no encontrado
                return ok<Costumer | null>(null)

            }

            const data = snapshot.data()

            const costumer: Costumer = this.dataToCostumer(data, snapshot.id)

            console.log("costumer obtenido")

            return ok(costumer)
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                        return fail({ code: "UNKNOWN_ERROR" })
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" })
                }
            }
            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    dataToCostumer(data: DocumentData, id: string): Costumer {
        return {
            id: id,
            observations: data.observations ?? "",
            debtCounter: data.debtCounter ?? 0,
            applicant: data.applicant,
            coSigner: data.coSigner ?? [],
            vehicle: data.vehicle ?? [],
            familyReference: data.familyReference ?? [],
        }
    }

    async createCostumer(
        costumer: Costumer,
        companyId: string
    ): Promise<Result<void, SaveCostumerError>> {
        try {
            const documentId = costumer.applicant.idNumber;

            if (!documentId) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            await runTransaction(firestore, async (tx) => {
                const costumerRef = doc(
                    collection(firestore, "companies", companyId, "customers")
                );

                const uniqueRef = doc(
                    firestore,
                    "companies",
                    companyId,
                    "costumer_id_numbers",
                    documentId
                );

                const uniqueSnap = await tx.get(uniqueRef);

                if (uniqueSnap.exists()) {
                    console.log("DOCUMENT_ALREADY_EXISTS")
                    return fail("DOCUMENT_EXISTING")
                }

                tx.set(uniqueRef, {
                    companyId,
                    costumerId: costumerRef.id,
                    createdAt: new Date().toISOString(),
                });

                tx.set(costumerRef, {
                    debtCounter: costumer.debtCounter,
                    observations: costumer.observations,
                    applicant: costumer.applicant,
                    coSigner: costumer.coSigner,
                    vehicle: costumer.vehicle,
                    familyReference: costumer.familyReference,
                });
            });

            return ok(undefined);
        } catch (error) {
            if (error instanceof Error && error.message === "DOCUMENT_ALREADY_EXISTS") {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }



}

/* 

    private async mergeUpdate(
        costumerId: string,
        data: Record<string, unknown>
    ): Promise<Result<void, SaveCostumerError>> {
        try {
            const ref = doc(firestore, "costumers", costumerId)

            await setDoc(ref, data, { merge: true })

            return ok(undefined)
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" })
                }
            }
            return fail({ code: "UNKNOWN_ERROR" })
        }
    }
    async updateApplicant(
        costumerId: string,
        applicant: PersonalInfo
    ): Promise<Result<void, SaveCostumerError>> {
        return this.mergeUpdate(costumerId, {
            applicant,
        })
    }
    async updateCoSigners(
        costumerId: string,
        coSigner: PersonalInfo[]
    ): Promise<Result<void, SaveCostumerError>> {
        return this.mergeUpdate(costumerId, {
            coSigner,
        })
    }
    async updateVehicles(
        costumerId: string,
        vehicle: Vehicle[]
    ): Promise<Result<void, SaveCostumerError>> {
        return this.mergeUpdate(costumerId, {
            vehicle,
        })
    }
    async updateFamilyReferences(
        costumerId: string,
        familyReference: FamilyReference[]
    ): Promise<Result<void, SaveCostumerError>> {
        return this.mergeUpdate(costumerId, {
            familyReference,
        })
    }
*/