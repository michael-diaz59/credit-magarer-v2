import type { VisitFormConfig } from "../templates/visit/VisitForm";

export const visitConfig: VisitFormConfig = {
    visibleFields: undefined,   // mostrar todos
    editableFields: undefined,  // editar todos
    requiredFields: [
        "customerDocument",
        "userAssigned",
        "customerName",
        "custumerAddres",
        "amountSolicited"
        // NO incluimos "observations"
    ]
};