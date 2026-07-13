import type { DebtFormConfig, DebtFormValues } from "../templates/debt/debtForm";
import { CREATE_DEBT_FIELDS_INSTALLMENTS, CREATE_DEBT_FIELDS_MONTHS, SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS } from "../templates/debt/form/constsForm";

const allDebtFormFields: (keyof DebtFormValues)[] = [
    "routeId",
    "costumerDocument",
    "status",
    "type",
    "prenda",
    "prendaDescription",
    "prendaValue",
    "adelanto",
    "capital",
    "debtTerms",
    "interestRate",
    "installmentCount",
    "startDate",
    "diasMes",
    "calculationMode",
    "months",
];
const allDebtFormFieldssegurosparaeditar: (keyof DebtFormValues)[] = [
    "routeId",
    "costumerDocument",
    "status",
    "type",
    "startDate",
];


export const allDebtFormFieldsWithoutType: (keyof DebtFormValues)[] = [
    "routeId",
    "costumerDocument",
    "adelanto",
    "status",
    "capital",
    "prenda",
    "debtTerms",
    "prendaDescription",
    "prendaValue",
    "interestRate",
    "installmentCount",
    "startDate",
    "diasMes",
    "calculationMode",
    "months",
];

export const debtFormReadOnlyConfig: DebtFormConfig = {
    visibleFields: allDebtFormFields,
    editableFields: [],
    requiredFields: [],
};

export function auditDebtConfig(isAdmin: boolean = false): DebtFormConfig {
    if (isAdmin) {
        return {
            visibleFields: allDebtFormFields,
            editableFields: [...allDebtFormFieldssegurosparaeditar],
            requiredFields: ["routeId"],
        };
    }
    return {
        visibleFields: allDebtFormFields,
        editableFields: ["status", "routeId"],
        requiredFields: ["routeId"],
    };
};

export const renewalComparisonConfig: DebtFormConfig = {
    visibleFields: allDebtFormFields,
    editableFields: [
        "routeId",
        "status",
        "prenda",
        "prendaDescription",
        "prendaValue",
        "type",
        "capital",
        "adelanto",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "diasMes",
        "calculationMode",
        "months",
    ],
    requiredFields: Array.from(new Set([
        ...CREATE_DEBT_FIELDS_MONTHS,
        ...CREATE_DEBT_FIELDS_INSTALLMENTS,
        ...SIMULATION_FIELDS_INSTALLMENTS,
        ...SIMULATION_FIELDS_MONTHS
    ]))
};

export const debtComparisonConfig: DebtFormConfig = {
    visibleFields: [
        "costumerDocument",
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
    editableFields: [
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
    requiredFields: [
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
};

export const debtInCreateVisit: DebtFormConfig = {
    visibleFields: [
        "routeId",
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "diasMes",
        "calculationMode",
        "months",
    ],
    editableFields: [
        "routeId",
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "diasMes",
        "calculationMode",
        "months",
    ],
    requiredFields: [
        "routeId",
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "diasMes",
        "calculationMode",
        "months",
    ],
};

export const confirmPaymentConfig: DebtFormConfig = {
    visibleFields: allDebtFormFields,
    editableFields: [
    ],
    requiredFields: [
        "routeId",
        "type",
        "capital",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "calculationMode",
    ],
};

export const CREATE_DEBT_CONFIG: DebtFormConfig = {
    visibleFields: allDebtFormFields,
    editableFields: allDebtFormFields,
    requiredFields: Array.from(new Set([
        ...CREATE_DEBT_FIELDS_MONTHS,
        ...CREATE_DEBT_FIELDS_INSTALLMENTS,
        ...SIMULATION_FIELDS_INSTALLMENTS,
        ...SIMULATION_FIELDS_MONTHS
    ]))
};


