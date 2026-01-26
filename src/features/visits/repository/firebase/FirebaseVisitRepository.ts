import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
} from "firebase/firestore";
import type VisitGateway from "../../domain/infraestructure/VisitGateway";
import { firestore } from "../../../../store/firebase/firebase";
import type { GetVisitByIdInput, GetVisitByIdOutput } from "../../domain/business/useCases/GetVisitByIdCase";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type Visit from "../../domain/business/entities/Visit";
import type { visitErros } from "../../domain/business/entities/types";
import type { GetVisitByCedulaInput, GetVisitByCedulaOutput } from "../../domain/business/useCases/getVisitByCedulaCase";
import { FirebaseError } from "firebase/app";
import type { CreateVisitInput, CreateVisitOutput } from "../../domain/business/useCases/CreateVisitUseCase";
import type { EditVisitInput, EditVisitOutput } from "../../domain/business/useCases/EditVisitCase";
import type { DeleteVisitInput, DeleteVisitOutput } from "../../domain/business/useCases/deleteVisitCase";
import type { GetVisitsInput, GetVisitsOutput } from "../../domain/business/useCases/getVisitsCase";
import type { GetVisitByStateInput, GetVisitByStateOutput } from "../../domain/business/useCases/GetVisitByStateCase";

export default class FirebaseVisitRepository implements VisitGateway {

    async getVisitByStateCase(input: GetVisitByStateInput): Promise<GetVisitByStateOutput> {
        try {
            const ref = collection(
                firestore,
                "companies",
                input.idCompany,
                "visits"
            );

            const q = query(
                ref,
                where("state","==" ,input.state), // más recientes primero
                limit(7)                       // solo 7
            );

            const snapshot = await getDocs(q);

            const visits = snapshot.docs.map((doc) => {
                const data = doc.data();

                const visit: Visit = {
                    id: doc.id,
                    customerName: data.customerName,
                    customerDocument: data.customerDocument,
                    userAssigned: data.userAssigned,
                    customerId: data.customerId,
                    observations: data.observations,
                    createdAt: data.createdAt,
                    custumerAddres: data.copstumerAddres,
                    state: {
                        code: data.state
                    },
                    debitId: "",
                    amountSolicited: 0
                };

                return visit;
            });

            return {
                state: ok(visits),
            };
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unavailable":
                        return {
                            state: fail({ code: "NETWORK_ERROR" }),
                        };
                }
            }
            return {
                state: fail({ code: "UNKNOWN_ERROR" }),
            };
        }
    }

    async getVisits(input: GetVisitsInput): Promise<GetVisitsOutput> {
        try {
            const ref = collection(
                firestore,
                "companies",
                input.idCompany,
                "visits"
            );

            const q = query(
                ref,
                orderBy("createdAt", "desc"), // más recientes primero
                limit(7)                       // solo 5
            );

            const snapshot = await getDocs(q);

            const visits = snapshot.docs.map((doc) => {
                const data = doc.data();

                const visit: Visit = {
                    id: doc.id,
                    customerName: data.customerName,
                    customerDocument: data.customerDocument,
                    userAssigned: data.userAssigned,
                    customerId: data.customerId,
                    observations: data.observations,
                    amountSolicited: data.amountSolicited,
                    createdAt: data.createdAt,
                    custumerAddres: data.copstumerAddres,
                    state: {
                        code: data.state
                    },
                    debitId: "",
                };

                return visit;
            });

            return {
                state: ok(visits),
            };
        } catch (error) {
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "unavailable":
                        return {
                            state: fail({ code: "NETWORK_ERROR" }),
                        };
                }
            }

            return {
                state: fail({ code: "UNKNOWN_ERROR" }),
            };
        }
    }

    private collectionRef(companyId: string) {
        return collection(firestore, "companies", companyId, "visits");
    }

    // --------------------------------
    // GET BY ID
    // --------------------------------
    async getVisitById(
        input: GetVisitByIdInput
    ): Promise<GetVisitByIdOutput> {
        try {
            const ref = doc(
                firestore,
                "companies",
                input.idCompany,
                "visits",
                input.idVisit
            );

            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                return { state: ok(null) };
            }

            return {
                state: ok({
                    id: snapshot.id,
                    ...(snapshot.data() as Omit<Visit, "id">),
                })
            };
        } catch (error) {
            return { state: this.mapError(error) };
        }
    }

    // --------------------------------
    // GET BY CEDULA
    // --------------------------------
    async getVisitByCedula(
        input: GetVisitByCedulaInput
    ): Promise<GetVisitByCedulaOutput> {
        try {
            const q = query(
                this.collectionRef(input.idCompanie),
                where("customerDocument", "==", input.cedula)
            );

            const snapshot = await getDocs(q);

            const visits: Visit[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Visit, "id">),
            }));

            return { state: ok(visits) };
        } catch (error) {
            return { state: this.mapError(error) };
        }
    }

    // --------------------------------
    // CREATE
    // --------------------------------
    async createVisit(
        input: CreateVisitInput
    ): Promise<CreateVisitOutput> {
        try {
            console.log("createVisit/idCompany"+input.idCompany)

            const ref = collection(firestore, "companies", input.idCompany, "visits")

            await addDoc(
                ref,
                input.visit
            );
            console.log("visita creada con exito")

            return { state: ok(null) };
        } catch (error) {
              console.log("visita creada sin exito")
            return { state: this.mapError(error) };
        }
    }

    // --------------------------------
    // EDIT
    // --------------------------------
    async editVisit(
        input: EditVisitInput
    ): Promise<EditVisitOutput> {
        try {
             console.log("editVisit")
              console.log("companies/"+input.idCompany+"/visits/"+input.visit.id)
            const ref = doc(
                firestore,
                "companies",
                input.idCompany,
                "visits",
                input.visit.id
            );
            const { ...data } = input.visit;

            await updateDoc(ref, data);
            console.log("visita actualizada")

            return { state: ok(null) };
        } catch (error) {
                console.log("error al actualizar visita")
                console.log(error)
            return { state: this.mapError(error) };
        }
    }

    // --------------------------------
    // DELETE
    // --------------------------------
    async deleteVisit(
        input: DeleteVisitInput
    ): Promise<DeleteVisitOutput> {
        try {
            const ref = doc(
                firestore,
                "companies",
                input.idCompany,
                "visits",
                input.idVisit
            );

            await deleteDoc(ref);

            return { state: ok(null) };
        } catch (error) {
            return { state: this.mapError(error) };
        }
    }

    // --------------------------------
    // ERROR MAPPER
    // --------------------------------
    private mapError(error: unknown): Result<never, visitErros> {
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
