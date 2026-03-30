import type { DebtFormConfig, DebtFormValues } from "../templates/debt/debtForm2";


const allDebtFormFields: (keyof DebtFormValues)[] = [
    "routeId",
    "collectorId",
    "costumerDocument",
    "type",
    "totalAmount",
    "debtTerms",
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

export const debtComparisonConfig: DebtFormConfig = {
    visibleFields: [
        "collectorId",
        "costumerDocument",
        "type",
        "totalAmount",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
    editableFields: [
        "collectorId",
        "type",
        "totalAmount",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
    requiredFields: [
        "collectorId",
        "type",
        "totalAmount",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
    ],
};

export const debtInCreateVisit: DebtFormConfig = {
    visibleFields: [
        "routeId",
        "collectorId",
        "type",
        "totalAmount",
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
        "collectorId",
        "type",
        "totalAmount",
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
        "collectorId",
        "type",
        "totalAmount",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "diasMes",
        "calculationMode",
        "months",
    ],
};
