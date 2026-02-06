import { collection, doc, getDoc, getDocs, increment, runTransaction, serverTimestamp, type DocumentData } from "firebase/firestore"
import { fail, ok, type Result } from "../../../core/helpers/ResultC"
import type { Customer } from "../domain/business/entities/Customer"
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
import type { SaveCostumerInput } from "../domain/business/useCases/CreateCostumerCase"
import type { PendingDocuments } from "../../../atomic_design/molecules/CustomerDocumentActions"
import type { UpdateCostumerInput } from "../domain/business/useCases/UpdateCostumerCase"
import type { GetCustomersListInput, GetCustomersListOutput } from "../domain/business/useCases/GetCustomersListCase"

export const custumerLists = "customersLists"

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


    async getCustomersListCase(
        input: GetCustomersListInput
    ): Promise<Result<GetCustomersListOutput, GetCostumersErrors>> {
        try {
            /** 🔒 Validaciones tempranas */
            if (!input.idCompany || !input.idUser) {
                return fail({ code: "INVALID_INPUT" });
            }

            /** 📍 Ruta correcta */
            const customersRef = collection(
                firestore,
                "companies",
                input.idCompany,
                "customers"
            );

            /** 🔥 Query */
            const snapshot = await getDocs(customersRef);

            /** 🧠 Parseo */
            const customers: Customer[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Customer, "id">),
            }));

            return ok({
                state: customers,
            });
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                        return fail({ code: "PERMISSION_DENIED" });

                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }


    //logica para cambiar nombre en la lista de nombres
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
            console.log(input)
            /* -------- 1. Buscar en índice -------- */
            const indexRef = doc(
                firestore,
                "companies",
                input.companyId,
                "costumer_id_numbers",
                input.documentId
            );

            const indexSnap = await getDoc(indexRef);


            // No existe → no hay customer con esa cédula
            if (!indexSnap.exists()) {
                console.log("user con cedula " + input.documentId + "no encontrado")
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

            if (!costumerSnap.exists()) {
                console.log("user con cedula " + input.documentId + "no encontrado 2")
                // índice corrupto (caso raro)
                return { state: ok(null) };
            }

            const data = costumerSnap.data();

            const costumer: Customer = this.dataToCostumer(data, costumerSnap.id)

            console.log(costumer)

            return { state: ok(costumer) };
        } catch (error) {
            
            if (error instanceof FirebaseError) {
                console.log(error)
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
    async getCostumers(companyId: string): Promise<Result<Customer[], GetCostumersErrors>> {
        try {
            console.log("companies/" + companyId + "/customers")
            const ref = collection(firestore, "companies", companyId, "customers")
            const snapshot = await getDocs(ref)

            const costumers: Customer[] = snapshot.docs.map((doc) => {
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


    async getCostumerById(companyId: string, costumerId: string): Promise<Result<Customer | null, GetCostumerByIdErrors>> {
        try {
            const ref = doc(firestore, "companies", companyId, "customers", costumerId)
            console.log("companies/" + companyId + "/customers/" + costumerId)
            const snapshot = await getDoc(ref)

            if (!snapshot.exists()) {
                console.log("getCostumerById: costumer no encontrado")
                //costumer no encontrado
                return ok<Customer | null>(null)

            }

            const data = snapshot.data()

            const costumer: Customer = this.dataToCostumer(data, snapshot.id)

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

    dataToCostumer(data: DocumentData, id: string): Customer {
        return {
            id: id,
            observations: data.observations ?? "",
            debtCounter: data.debtCounter ?? 0,
            applicant: data.applicant,
            listId: data.listId,
            coSigner: data.coSigner ?? [],
            vehicle: data.vehicle ?? [],
            familyReference: data.familyReference ?? [],
        }
    }

    private async uploadPendingDocuments(params: {
        companyId: string;
        costumerId: string;
        pendingDocuments: PendingDocuments;
    }) {
        console.log("se inicio la carga de archivos")
        const { companyId, costumerId, pendingDocuments } = params;

        const uploads = Object.entries(pendingDocuments).map(
            async ([type, file]) => {
                if (!file) return;

                await this.uploadCustomerDocument({
                    companyId,
                    costumerId,
                    file,
                    type: type as DocumentTypeG,
                });
            }
        );

        await Promise.all(uploads);
    }
    async UpdateCostumer(
        input: UpdateCostumerInput
    ): Promise<Result<void, SaveCostumerError>> {
        const {
            costumer,
            companyId,
            updateFiles,
            pendingDocs,
            isNameChange, // 🆕
        } = input;

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

                /* =========================
                   🔁 CAMBIO DE CÉDULA
                ========================= */
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
                        throw new Error("DOCUMENT_EXISTING");
                    }

                    tx.delete(oldIndexRef);
                    tx.set(newIndexRef, {
                        costumerId: costumer.id,
                        createdAt: new Date().toISOString(),
                    });
                }

                /* =========================
                   🆕 CAMBIO DE NOMBRE
                ========================= */
                if (isNameChange) {
                    const listId = oldData.listId;

                    if (!listId) {
                        throw new Error("LIST_ID_NOT_FOUND");
                    }

                    const listRef = doc(
                        firestore,
                        "companies",
                        companyId,
                        "customersLists",
                        listId
                    );

                    // reemplaza SOLO el nombre
                    tx.update(listRef, {
                        [`items.${costumer.id}`]: costumer.applicant.fullName,
                    });
                }

                /* =========================
                   ✏️ UPDATE CUSTOMER
                ========================= */
                tx.set(costumerRef, costumer, { merge: true });
            });

            /* =========================
               ☁️ STORAGE (POST TX)
            ========================= */
            const shouldUploadFiles =
                updateFiles &&
                pendingDocs &&
                Object.keys(pendingDocs).length > 0;

            if (shouldUploadFiles) {
                await this.uploadPendingDocuments({
                    companyId,
                    costumerId: costumer.id,
                    pendingDocuments: pendingDocs,
                });
            }

            return ok(undefined);
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "unavailable":
                        return fail({ code: "NETWORK_ERROR" });
                    case "permission-denied":
                        return fail({ code: "UNKNOWN_ERROR" });
                }
            }

            if (error instanceof Error) {
                if (error.message === "DOCUMENT_EXISTING") {
                    return fail({ code: "DOCUMENT_EXISTING" });
                }
            }

            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    async createCostumer(
        input: SaveCostumerInput
    ): Promise<Result<void, SaveCostumerError>> {
        const { costumer, companyId, updateFiles, pendingDocs } = input;

        const documentId = costumer.applicant.idNumber;
        if (!documentId) {
            return fail({ code: "UNKNOWN_ERROR" });
        }

        let createdCustomerId = "";

        try {
            /* ==========================
               🔒 1️⃣ Transacción Firestore
            ========================== */
            await runTransaction(firestore, async (tx) => {
                // 1. ref de todas las cedulas
                const uniqueRef = doc(
                    firestore,
                    "companies",
                    companyId,
                    "costumer_id_numbers",
                    documentId
                );

                const uniqueSnap = await tx.get(uniqueRef);
                //validar que la cedula no exista
                if (uniqueSnap.exists()) {
                    throw new Error("DOCUMENT_ALREADY_EXISTS");
                }

                // 2. obtener puntero
                const pointerRef = doc(
                    firestore,
                    "companies",
                    companyId,
                    "metadata",
                    "customersListPointer"
                );

                const pointerSnap = await tx.get(pointerRef);

                let currentIndex = pointerSnap.exists()
                    ? pointerSnap.data().currentIndex ?? 0
                    : 0;

                let currentListId = pointerSnap.exists()
                    ? pointerSnap.data().currentListId ?? "list-0"
                    : "list-0";

                const listsRef = collection(
                    firestore,
                    "companies",
                    companyId,
                    "customersLists"
                );

                let targetListRef = doc(listsRef, currentListId);
                const targetListSnap = await tx.get(targetListRef);

                if (
                    !targetListSnap.exists() ||
                    (targetListSnap.data()?.size ?? 0) >= 50
                ) {
                    currentIndex += 1;
                    currentListId = `list-${currentIndex}`;
                    targetListRef = doc(listsRef, currentListId);

                    tx.set(targetListRef, {
                        size: 0,
                        items: {},
                        index: currentIndex,
                        createdAt: serverTimestamp(),
                    });

                    tx.set(
                        pointerRef,
                        {
                            currentListId,
                            currentIndex,
                            updatedAt: serverTimestamp(),
                        },
                        { merge: true }
                    );
                }

                // 3. crear customer
                const customersRef = collection(
                    firestore,
                    "companies",
                    companyId,
                    "customers"
                );

                const costumerRef = doc(customersRef);
                createdCustomerId = costumerRef.id;

                tx.set(costumerRef, {
                    ...costumer,
                    listId: currentListId,
                    createdAt: serverTimestamp(),
                });

                // 4. insertar en lista
                tx.update(targetListRef, {
                    [`items.${createdCustomerId}`]: costumer.applicant.fullName,
                    size: increment(1),
                });

                // 5. guardar cédula única
                tx.set(uniqueRef, {
                    companyId,
                    costumerId: createdCustomerId,
                    createdAt: serverTimestamp(),
                });
            });

            /* ==========================
               ☁️ 2️⃣ Subida de archivos
            ========================== */
            if (updateFiles && pendingDocs && createdCustomerId) {
                await this.uploadPendingDocuments({
                    companyId,
                    costumerId: createdCustomerId,
                    pendingDocuments: pendingDocs,
                });
            }

            return ok(undefined);
        } catch (error) {
            if (error instanceof Error && error.message === "DOCUMENT_ALREADY_EXISTS") {
                return fail({ code: "DOCUMENT_EXISTING" });
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