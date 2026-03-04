import type { Installment, InstallmentAddress } from "../business/entities/Installment";

const defaultInstallmentAddress: InstallmentAddress = {
  address: "",
  neighborhood: "",
  stratum: 0,
  city: "",
};

export const defaultInstallment: Omit<Installment, "id"> = {
  debtId: "",
  companyId:"",
  interestRate: 0,
  lateInterestRate: 0,
  collectorId: "",
  costumerId: "",
  costumerDocument: "",
  costumerName: "",
  costumerNumber: "",
  costumerAddres: defaultInstallmentAddress,
  installmentTotalNumber: 0,
  installmentNumber: 0,
  amount: 0,
  paidAmount: 0,
  latepayment: 0,
  dueDate: "",
  lateDueDate: "",
  status: "pendiente",
  createdAt: "",
  payments: [],
  aplazado: false,
};

export function mapToInstallment(
  id: string,
  raw: Partial<Installment> | undefined
): Installment {
  const data = raw ?? {};

  return {
    id,
    companyId:data.companyId??"",
    debtId: data.debtId ?? "",
    interestRate: data.interestRate ?? 0,
    lateInterestRate: data.lateInterestRate ?? 0,
    collectorId: data.collectorId ?? "",
    costumerId: data.costumerId ?? "",
    costumerDocument: data.costumerDocument ?? "",
    costumerName: data.costumerName ?? "",
    costumerNumber: data.costumerNumber ?? "",

    costumerAddres: {
      address: data.costumerAddres?.address ?? "",
      neighborhood: data.costumerAddres?.neighborhood ?? "",
      stratum: data.costumerAddres?.stratum ?? 0,
      city: data.costumerAddres?.city ?? "",
    },

    installmentTotalNumber: data.installmentTotalNumber ?? 0,
    installmentNumber: data.installmentNumber ?? 0,
    amount: data.amount ?? 0,
    paidAmount: data.paidAmount ?? 0,
    latepayment: data.latepayment ?? 0,
    dueDate: data.dueDate ?? "",
    lateDueDate: data.lateDueDate ?? "",
    status: data.status ?? "pendiente",
    paidAt: data.paidAt ?? "",
    createdAt: data.createdAt ?? "",
    payments: data.payments ?? [],
    aplazado: data.aplazado ?? false,
  };
}