import type { ButtonProps } from "@mui/material";
import type { DebtStatus } from "../../../../features/debits/domain/business/entities/Debt";

export interface DebtAction {
    nextStatus: DebtStatus;
    label: string;
    color: ButtonProps["color"];
}

export function selectActionAuditor(status: DebtStatus): DebtAction[] {

    switch (status) {
        case "tentativa":
            return [{
                nextStatus: "preparacion",
                label: "Preparación",
                color: "primary"
            }, {
                nextStatus: "anulado",
                label: "Anular",
                color: "error"
            }];
        case "preAprobada":
            return [{
                nextStatus: "preparacion",
                label: "Preparación",
                color: "primary"
            }, {
                nextStatus: "anulado",
                label: "Anular",
                color: "error"
            }];
        case "preparacion":
            return [{
                nextStatus: "anulado",
                label: "Anular",
                color: "error"
            }];
        case "activa":
            return [{
                nextStatus: "inactivo",
                label: "Inactivar",
                color: "error"
            }];
        case "pagada":
            return [];
        case "en_mora":
            return [{
                nextStatus: "inactivo",
                label: "Inactivar",
                color: "error"
            }];
        case "inactivo":
            return [{
                nextStatus: "activa",
                label: "Activar",
                color: "primary"
            }];
        case "anulado":
            return [{
                nextStatus: "preparacion",
                label: "Preparación",
                color: "primary"
            }];
        default:
            return [];
    }
}