import type { DebtFormValues } from "../debtForm";


export const CREATE_DEBT_FIELDS_MONTHS: (keyof DebtFormValues)[] = [
    "startDate",
    "months",
    "clientDocument",
    "routeId",
    "capital",
    "interestRate",
];

export const CREATE_DEBT_FIELDS_INSTALLMENTS: (keyof DebtFormValues)[] = [
    "startDate",
    "installmentCount",
    "clientDocument",
    "routeId",
    "capital",
    "interestRate",
];

export const CREATE_DEBT_FIELDS_IN_VISIT: (keyof DebtFormValues)[] = [
    "capital",
    "interestRate",
    "debtTerms",
    "months",
    "daysPerMonth",
];

export const SIMULATION_FIELDS_MONTHS: (keyof DebtFormValues)[] = [
    "capital",
    "startDate",
    "interestRate",
    "debtTerms",
    "months",
    "daysPerMonth",
];
export const SIMULATION_FIELDS_INSTALLMENTS: (keyof DebtFormValues)[] = [
    "capital",
    "startDate",
    "interestRate",
    "debtTerms",
    "installmentCount",
    "daysPerMonth",
];



/**
 * Indica el tipo de accion que se va a realizar
 * 
 */
export type DebtSubmitType = "crear" | "simular" | "actualizar" | "preAprobar";

/**
 * indica si el prestamo se va a calcular en base a meses o a cuotas
 */
export type CalculationMode = "installments" | "months";