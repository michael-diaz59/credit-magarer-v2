import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Payment, PaymentMethod } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt } from "../../entities/Debt";
import type { BankAccount } from "../../../../../bankAccounts/domain/business/entities/BankAccount";
import type { LocationGPS } from "../../../../../costumers/domain/business/entities/Address";
import type {
  PaymentGateway,
  RegisterCascadingPaymentRepositoryInput,
  CascadingPaymentItemInput,
} from "../../../infraestructure/PaymentGateway";
import {
  calculateCascadingPaymentDistribution,
} from "../../services/calculateCascadingPaymentDistribution";
import { calculateDebtPaymentCapacity } from "../../services/calculateDebtPaymentCapacity";

export interface RegisterCascadingPaymentInput {
  companyId: string;
  collectorId: string;
  collectorName: string;
  debt: Debt;
  allInstallments: Installment[];
  amount: number;
  arrears: number;
  method: PaymentMethod;
  location?: LocationGPS;
  bankAccount?: BankAccount;
  file?: File | null;
  todayDateStr: string;
}

export interface RegisterCascadingPaymentOutput {
  payments: Payment[];
  installments: Installment[];
  debt: Debt;
  newCollectorAmount?: number;
  bankAccount?: BankAccount;
}

export type RegisterCascadingPaymentError =
  | { code: "UPLOAD_FAILED" }
  | { code: "BANK_ACCOUNT_NOT_FOUND" }
  | { code: "DEBT_NOT_FOUND" }
  | { code: "INSTALLMENT_NOT_FOUND" }
  | { code: "NO_ITEMS_TO_PAY" }
  | { code: "EXCEEDS_TOTAL_DEBT"; maxAllowed: number }
  | { code: "EXCEEDS_ARREARS_LIMIT"; maxAllowed: number }
  | { code: "USER_NOT_FOUND" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export class RegisterCascadingPaymentUseCase {
  private readonly paymentGateway: PaymentGateway;

  constructor(paymentGateway: PaymentGateway) {
    this.paymentGateway = paymentGateway;
  }

  async execute(
    input: RegisterCascadingPaymentInput
  ): Promise<Result<RegisterCascadingPaymentOutput, RegisterCascadingPaymentError>> {
    try {
      const {
        companyId,
        collectorId,
        collectorName,
        debt,
        allInstallments,
        amount,
        arrears,
        method,
        location,
        bankAccount,
        file,
        todayDateStr,
      } = input;

      if (amount <= 0 && arrears <= 0) {
        return fail({ code: "NO_ITEMS_TO_PAY" });
      }

      if (method === "consignacion") {
        if (!file) {
          return fail({ code: "UPLOAD_FAILED" });
        }
        if (!bankAccount) {
          return fail({ code: "BANK_ACCOUNT_NOT_FOUND" });
        }
      }

      // 1. Validar contra la capacidad financiera de la deuda
      const capacity = calculateDebtPaymentCapacity(debt, allInstallments, todayDateStr);

      const maxAllowedArrears = capacity.dueTodayArrears + capacity.dueTodayDeferment;
      if (arrears > maxAllowedArrears) {
        return fail({
          code: "EXCEEDS_ARREARS_LIMIT",
          maxAllowed: maxAllowedArrears,
        });
      }

      const maxAllowedBase = capacity.maxPayableDebtTotal - maxAllowedArrears;
      if (amount > maxAllowedBase) {
        return fail({
          code: "EXCEEDS_TOTAL_DEBT",
          maxAllowed: maxAllowedBase,
        });
      }

      // 2. Realizar distribución matemática pura en cascada
      const distribution = calculateCascadingPaymentDistribution({
        debt,
        allInstallments,
        amountToPay: amount,
        arrearsToPay: arrears,
        todayDateStr,
      });

      if (distribution.items.length === 0) {
        return fail({ code: "NO_ITEMS_TO_PAY" });
      }

      // 3. Manejo de comprobante en caso de consignación
      let proofId: string | undefined = undefined;
      const basePaymentId = await this.paymentGateway.getNewId(companyId);

      if (method === "consignacion" && file) {
        const uploadResult = await this.paymentGateway.uploadProof(
          file,
          companyId,
          basePaymentId
        );

        if (!uploadResult.ok) {
          console.error("Falló al subir comprobante de pago en consignación");
          return fail({ code: "UPLOAD_FAILED" });
        }
        proofId = basePaymentId;
      }

      // 4. Crear las entidades Payment para cada cuota que recibió dinero
      const paymentItems: CascadingPaymentItemInput[] = [];
      const paidAtDate = new Date();
      const paidAtStr = paidAtDate.toISOString();
      const timestampMs = paidAtDate.getTime();
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      const transactionGroupId = `${timestampMs}_${collectorId || "unknown"}_${randomNumber}`;

      let capitalCollected = 0;
      let interestCollected = 0;
      let arrearsCollected = 0;
      let defermentCollected = 0;

      for (let i = 0; i < distribution.items.length; i++) {
        const distItem = distribution.items[i];
        const paymentId = i === 0 ? basePaymentId : await this.paymentGateway.getNewId(companyId);

        const paymentEntity: Payment = {
          id: paymentId,
          clientId: debt.clientId,
          clientName: debt.clientName,
          collectorId: collectorId || "",
          collectorName: collectorName || "",
          debtId: debt.id,
          installmentId: distItem.installment.id,
          idRoute: debt.routeId || distItem.installment.routeId || "",
          amount: distItem.totalAllocated,
          capitalPaid: distItem.allocatedCapital,
          interestPaid: distItem.allocatedInterest,
          arrearsPaid: distItem.allocatedArrears,
          defermentPaid: distItem.allocatedDeferment,
          method,
          status: "registrado",
          paidAt: paidAtStr,
          location,
          bankAccountId: bankAccount?.id,
          idProofOfPayment: proofId,
          transactionGroupId,
          isTight: false,
        };

        capitalCollected += distItem.allocatedCapital;
        interestCollected += distItem.allocatedInterest;
        arrearsCollected += distItem.allocatedArrears;
        defermentCollected += distItem.allocatedDeferment;

        paymentItems.push({
          installment: distItem.installment,
          payment: paymentEntity,
        });
      }

      const totalCollected = capitalCollected + interestCollected + arrearsCollected + defermentCollected;

      const repoInput: RegisterCascadingPaymentRepositoryInput = {
        companyId,
        debt: distribution.debt,
        items: paymentItems,
        collectorId,
        totalCollected,
        capitalCollected,
        interestCollected,
        arrearsCollected,
        defermentCollected,
        method,
        bankAccount,
      };

      const result = await this.paymentGateway.registerCascadingPayment(repoInput);

      if (!result.ok) {
        if (method === "consignacion" && file) {
          await this.paymentGateway.deleteProof(companyId, basePaymentId, file.name);
        }
        return fail(result.error);
      }

      return ok({
        payments: result.value.payments,
        installments: result.value.installments,
        debt: result.value.debt,
        newCollectorAmount: result.value.newCollectorAmount,
        bankAccount: result.value.bankAccount,
      });
    } catch (error) {
      console.error("[RegisterCascadingPaymentUseCase] Error:", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}
