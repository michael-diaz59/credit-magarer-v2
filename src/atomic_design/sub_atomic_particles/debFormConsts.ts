import type { DebtFormConfig, DebtFormValues } from "../templates/debt/debtForm";
import { CREATE_DEBT_FIELDS_INSTALLMENTS, CREATE_DEBT_FIELDS_MONTHS, SIMULATION_FIELDS_INSTALLMENTS, SIMULATION_FIELDS_MONTHS } from "../templates/debt/form/constsForm";

const allDebtFormFields: (keyof DebtFormValues)[] = [
    "routeId",
    "clientDocument",
    "status",
    "type",
    "pledge",
    "pledgeDescription",
    "pledgeValue",
    "prepayment",
    "capital",
    "debtTerms",
    "interestRate",
    "installmentCount",
    "startDate",
    "daysPerMonth",
    "calculationMode",
    "months",
];
export const allDebtFormFieldssegurosparaeditar: (keyof DebtFormValues)[] = [
    "routeId",
    "clientDocument",
    "status",
    "type",
    "startDate",
];


export const allDebtFormFieldsWithoutType: (keyof DebtFormValues)[] = [
    "routeId",
    "clientDocument",
    "prepayment",
    "status",
    "capital",
    "pledge",
    "debtTerms",
    "pledgeDescription",
    "pledgeValue",
    "interestRate",
    "installmentCount",
    "startDate",
    "daysPerMonth",
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
            editableFields: ["status", "routeId"],
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
        "pledge",
        "pledgeDescription",
        "pledgeValue",
        "type",
        "capital",
        "prepayment",
        "debtTerms",
        "interestRate",
        "installmentCount",
        "startDate",
        "daysPerMonth",
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
        "clientDocument",
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
        "daysPerMonth",
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
        "daysPerMonth",
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
        "daysPerMonth",
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


