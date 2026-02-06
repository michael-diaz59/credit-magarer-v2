import {  z } from "zod"

export const addressSchema = z.object({
    address: z.string().min(1),
    neighborhood: z.string().min(1),
    stratum: z.coerce.number<number>().min(1),
    city: z.string().min(1),
});

export const housingSchema = z.object({
    type: z.enum(["FAMILIAR", "PROPIA", "ALQUILADA"]),
    landlordName: z.string().min(1),
    landlordPhone: z.string().min(1),
    rentValue: z.number().min(0),
});

export const workSchema = z.object({
    profession: z.string().min(1),
    economicSector: z.string().min(1),
    company: z.string().min(1),
    companyAddress: z.string().min(1),
});

export const personalInfoSchema = z.object({
    fullName: z.string().min(1),
    idNumber: z.string().min(1),
    birthCity: z.string().min(1),
    birthDate: z.string().min(1),
    issueCity: z.string().min(1),
    issueDate: z.string().min(1),
    maritalStatus: z.enum([
        "SOLTERO",
        "CASADO",
        "UNION_LIBRE",
        "DIVORCIADO",
        "VIUDO",
    ]),
    childrenCount: z.number().min(0),
    phone: z.string().min(1),
    address: addressSchema,
    housing: housingSchema,
    workInfo: workSchema,
});

export const vehicleSchema = z.object({
    vehicleClass: z.string().min(1),
    model: z.string().min(1),
    brand: z.string().min(1),
    commercialValue: z.number().min(1),
    pledged: z.boolean(),
    serviceType: z.enum(["PUBLICO", "PARTICULAR"]),
});

export const familyReferenceSchema = z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    relationship: z.string().min(1),
    address: addressSchema,
    housingType: z.enum(["FAMILIAR", "PROPIA", "ALQUILADA"]),
    workInfo: workSchema,
});

export const costumerSchema = z.object({
    id: z.string(),
    observations: z.string(),
    debtCounter: z.number(),
    applicant: personalInfoSchema,
    coSigner: z.array(personalInfoSchema).min(1).max(5),
    vehicle: z.array(vehicleSchema).min(1).max(5),
    familyReference: z.array(familyReferenceSchema).min(1).max(5),
    listId: z.string(),
});

export type CostumerFormValues = z.infer<typeof costumerSchema>;
