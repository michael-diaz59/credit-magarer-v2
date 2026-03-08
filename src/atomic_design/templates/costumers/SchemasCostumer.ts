import { z } from "zod";
import { calificationValues } from "../../../features/costumers/domain/business/entities/Customer";

export const baseAddressSchema = z.object({
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  stratum: z.coerce.number<number>().optional(),
  city: z.string().optional(),
  location: z
    .object({
      latitud: z.number().optional(),
      longitud: z.number().optional(),
    })
    .optional(),
});

export const addressSchema = baseAddressSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional(); // 👈 hace opcional el objeto completo

export const baseHousingSchema = z.object({
  type: z.enum(["FAMILIAR", "PROPIA", "ALQUILADA"]).optional(),
  landlordName: z.string().optional(),
  landlordPhone: z.string().optional(),
  rentValue: z.number().optional(),
});

export const housingSchema = baseHousingSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional();

export const baseWorkSchema = z.object({
  profession: z.string().optional(),
  economicSector: z.string().optional(),
  company: z.string().optional(),
  companyAddress: z.string().optional(),
});

export const workSchema = baseWorkSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional();

export const basePersonalInfoSchema = z.object({
  fullName: z.string().optional(),
  idNumber: z.string().optional(),
  birthCity: z.string().optional(),
  birthDate: z.string().optional(),
  issueCity: z.string().optional(),
  issueDate: z.string().optional(),
  maritalStatus: z.enum([
    "SOLTERO",
    "CASADO",
    "UNION_LIBRE",
    "DIVORCIADO",
    "VIUDO",
  ]),
  childrenCount: z.number().min(0),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  housing: housingSchema.optional(),
  workInfo: workSchema.optional(),
});

export const personalInfoSchema = basePersonalInfoSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional();

export const baseVehicleSchema = z.object({
  vehicleClass: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  commercialValue: z.number().optional(),
  pledged: z.boolean().optional(),
  serviceType: z.enum(["PUBLICO", "PARTICULAR"]).optional(),
});

export const vehicleSchema = baseVehicleSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional();

export const baseFamilyReferenceSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  address: addressSchema,
  housingType: z.enum(["FAMILIAR", "PROPIA", "ALQUILADA"]).optional(),
  workInfo: workSchema,
});

export const familyReferenceSchema = baseFamilyReferenceSchema
  .partial() // 👈 hace opcionales las propiedades
  .optional();

const applicantschema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio"),
  idNumber: z.string().min(1, "La cédula es obligatoria"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  childrenCount: z.number().min(0),

  birthCity: z.string().optional(),
  birthDate: z.string().optional(),
  issueCity: z.string().optional(),
  issueDate: z.string().optional(),
  maritalStatus: z
    .enum(["SOLTERO", "CASADO", "UNION_LIBRE", "DIVORCIADO", "VIUDO"])
    .optional(),

  address: addressSchema.optional(),
  housing: housingSchema.optional(),
  workInfo: workSchema.optional(),
});

export const baseCostumerSchema = z.object({
  id: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
  calification: z.enum(calificationValues),
  photoHouseUrl: z.string().optional(),
  identificacionUrl: z.string().optional(),
  laboralUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  debtCounter: z.number().optional(),
  renovationsCounter: z.number().optional(),
  applicant: applicantschema.partial(),
  coSigner: z.array(personalInfoSchema),
  vehicle: z.array(vehicleSchema),
  familyReference: z.array(familyReferenceSchema),

  listId: z.string().nullable().optional(),
});

export const costumerSchema = baseCostumerSchema;

export type CostumerFormValues = z.infer<typeof costumerSchema>;
