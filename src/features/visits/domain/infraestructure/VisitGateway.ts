import type { Result } from "../../../../core/helpers/ResultC";
import type { visitErros } from "../business/entities/types";
import type { CreateVisitInput, CreateVisitOutput } from "../business/useCases/CreateVisitUseCase";
import type { DeleteVisitInput, DeleteVisitOutput } from "../business/useCases/deleteVisitCase";
import type { EditVisitInput, EditVisitOutput } from "../business/useCases/EditVisitCase";
import type { GetVisitByCedulaInput, GetVisitByCedulaOutput } from "../business/useCases/getVisitByCedulaCase";
import type { GetVisitByIdInput, GetVisitByIdOutput } from "../business/useCases/GetVisitByIdCase";
import type { GetVisitByStateInput, GetVisitByStateOutput } from "../business/useCases/GetVisitByStateCase";
import type { GetVisitsByCustomerDocumentInput, GetVisitsByCustomerDocumentOutput } from "../business/useCases/GetVisitsByCustomerDocumentCase";
import type { GetVisitsInput, GetVisitsOutput } from "../business/useCases/getVisitsCase";

export default interface VisitGateway {

    getVisits(input: GetVisitsInput): Promise<GetVisitsOutput>
    getVisitByStateCase(input: GetVisitByStateInput): Promise<GetVisitByStateOutput>
    getVisitById(input: GetVisitByIdInput): Promise<GetVisitByIdOutput>;
    getVisitByCedula(input: GetVisitByCedulaInput): Promise<GetVisitByCedulaOutput>;
    getVisitsByCustomerDocument(input: GetVisitsByCustomerDocumentInput): Promise<Result<GetVisitsByCustomerDocumentOutput,visitErros>>;
    editVisit(input: EditVisitInput): Promise<EditVisitOutput>;
    createVisit(user: CreateVisitInput): Promise<CreateVisitOutput>;
    deleteVisit(input: DeleteVisitInput): Promise<DeleteVisitOutput>;
}
