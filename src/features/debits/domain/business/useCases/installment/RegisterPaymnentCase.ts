import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Installment } from "../../entities/Installment";
import type { Payment } from "../../entities/Payment";
import type { CreatePaymentCase } from "../payment/CreatePayment";
import type { UpdateByIdCase } from "./UpdateByIdCase";

export type RegisterPaymentError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" }
  | { code: "INSTALLMENT_NOT_FOUND" }
  | { code: "PAYMENT_CREATION_FAILED" }
  | { code: "FORBIDDEN" };
  
  export interface RegisterPaymentInput {
  installment: Installment;
  payment: Payment;
  companyId: string;
}

export interface RegisterPaymentOutput {
  state: null;
}

/** 
 * Caso de uso encargado de:
 * 1. Registrar un pago
 * 2. Actualizar el monto pagado del installment
 */
export class RegisterPaymentCase {
  private createPaymentCase: CreatePaymentCase;
  private updateInstallmentCase: UpdateByIdCase;

  constructor(
    createPaymentCase: CreatePaymentCase,
    updateInstallmentCase: UpdateByIdCase
  ) {
    this.createPaymentCase = createPaymentCase;
    this.updateInstallmentCase = updateInstallmentCase;
  }

  async execute(
    input: RegisterPaymentInput
  ): Promise<Result<RegisterPaymentOutput, RegisterPaymentError>> {
    try {
      const { installment, payment, companyId } = input;

      // 1️⃣ Crear el pago
      const paymentResult = await this.createPaymentCase.execute({
             payment:payment,
             companyId:companyId,
      });

      if (!paymentResult.ok) {
        return fail({code:"PAYMENT_CREATION_FAILED"})
      }

      // 2️⃣ Calcular nuevo monto pagado
      const currentPaidAmount = installment.paidAmount ?? 0;
      const newPaidAmount = currentPaidAmount + payment.amount;

      const updatedInstallment: Installment = {
        ...installment,
        paidAmount: newPaidAmount,
        payments: [
          ...(installment.payments ?? []),
          payment.id,
        ],
      };

      // 3️⃣ Actualizar installment
      const updateResult = await this.updateInstallmentCase.execute({
        installment: updatedInstallment,
        companyId,
      });

      if (!updateResult.ok) {
        console.log(updateResult.error)
          return fail({code:"UNKNOWN_ERROR"})
      }

      return ok({state:null})
    } catch (error) {
      console.error("RegisterPaymentCase error:", error);
      return fail({code:"UNKNOWN_ERROR"})
    }
  }
}
