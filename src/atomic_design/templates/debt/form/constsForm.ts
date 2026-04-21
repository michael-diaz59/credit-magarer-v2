import type { DebtFormValues } from "../debtForm2";


export const CREATE_DEBT_FIELDS_MONTHS: (keyof DebtFormValues)[] = [
    "startDate",
    "months",
    "costumerDocument",
    "routeId",
    "capital",
    "interestRate",
];

export const CREATE_DEBT_FIELDS_INSTALLMENTS: (keyof DebtFormValues)[] = [
    "startDate",
    "installmentCount",
    "costumerDocument",
    "routeId",
    "capital",
    "interestRate",
];

export const CREATE_DEBT_FIELDS_IN_VISIT: (keyof DebtFormValues)[] = [
    "capital",
    "interestRate",
    "debtTerms",
    "months",
    "diasMes",
];

export const SIMULATION_FIELDS_MONTHS: (keyof DebtFormValues)[] = [
    "capital",
    "interestRate",
    "debtTerms",
    "months",
    "diasMes",
];
export const SIMULATION_FIELDS_INSTALLMENTS: (keyof DebtFormValues)[] = [
    "capital",
    "interestRate",
    "debtTerms",
    "installmentCount",
    "diasMes",
];




export type DebtSubmitType = "crear" | "simular" | "actualizar" | "preAprobar";

export type CalculationMode = "installments" | "months";