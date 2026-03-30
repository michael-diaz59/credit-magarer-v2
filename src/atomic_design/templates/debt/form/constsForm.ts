import type { DebtFormValues } from "../debtForm2";

export const SIMULATION_FIELDS_INSTALLMENTS: (keyof DebtFormValues)[] = [
    "totalAmount",
    "interestRate",
    "debtTerms",
    "installmentCount",
    "diasMes",
];

export const SIMULATION_FIELDS_MONTHS: (keyof DebtFormValues)[] = [
    "totalAmount",
    "interestRate",
    "debtTerms",
    "months",
    "diasMes",
];

export const CREATE_DEBT_FIELDS_IN_VISIT: (keyof DebtFormValues)[] = [
    "totalAmount",
    "interestRate",
    "debtTerms",
    "months",
    "diasMes",
];

export type DebtSubmitType = "crear" | "simular" | "actualizar" | "preAprobar";

export type CalculationMode = "installments" | "months";