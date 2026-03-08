import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway, InstallmentGateway } from "../../../infraestructure/DebtGatweay";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt } from "../../entities/Debt";

export type RegisterPaymentError =
    | { code: "DEBT_NOT_FOUND" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "EXCEEDS_TOTAL_DEBT", maxAllowed: number };

export interface RegisterPaymentInput {
    payment: Payment;
    companyId: string;
}

export interface RegisterPaymentOutput {
    payment: Payment;
    installment: Installment;
    debt: Debt;
}

export class RegisterPaymentUseCase {
    private readonly paymentGateway: PaymentGateway;
    private readonly installmentGateway: InstallmentGateway;
    private readonly debtGateway: DebtGateway;

    constructor(
        paymentGateway: PaymentGateway,
        installmentGateway: InstallmentGateway,
        debtGateway: DebtGateway
    ) {
        this.paymentGateway = paymentGateway;
        this.installmentGateway = installmentGateway;
        this.debtGateway = debtGateway;
    }

    async execute(input: RegisterPaymentInput): Promise<Result<RegisterPaymentOutput, RegisterPaymentError>> {
        const { payment, companyId } = input;

        try {
            // 1. Obtener todas las cuotas de la deuda para manejar el excedente
            const initialInstallmentResult = await this.installmentGateway.getById({
                companyId,
                installmentId: payment.installmentId
            });

            if (!initialInstallmentResult.ok || !initialInstallmentResult.value.state) {
                return fail({ code: "INSTALLMENT_NOT_FOUND" });
            }

            const currentInstallment = initialInstallmentResult.value.state;
            const debtId = currentInstallment.debtId;

            const allInstallmentsResult = await this.installmentGateway.getByDebt({
                companyId,
                debtId
            });

            if (!allInstallmentsResult.state.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const allInstallments = allInstallmentsResult.state.value.sort((a, b) => a.installmentNumber - b.installmentNumber);

            // 2. Obtener la deuda
            const debtResult = await this.debtGateway.getById({
                companyId,
                idDebt: debtId
            });

            if (!debtResult.state.ok || !debtResult.state.value) {
                return fail({ code: "DEBT_NOT_FOUND" });
            }

            const debt = debtResult.state.value;

            // 3. Identificar cuotas futuras y calcular el máximo permitido
            // Máximo permitido = Deuda pendiente de la cuota actual (base + mora) + Suma de valores base de cuotas futuras
            const currentIndex = allInstallments.findIndex(i => i.id === payment.installmentId);
            const futureInstallments = allInstallments.slice(currentIndex + 1).filter(i => i.status !== 'pagada' && i.status !== 'liquidada' && i.status !== 'cancelada');

            const currentPendingLate = currentInstallment.latepayment - (currentInstallment.paidLatePayment ?? 0);
            const currentPendingBase = currentInstallment.amount - currentInstallment.paidAmount;

            let maxAllowed = currentPendingLate + currentPendingBase;
            futureInstallments.forEach(i => {
                maxAllowed += (i.amount - i.paidAmount);
            });

            if (payment.amount > maxAllowed) {
                return fail({ code: "EXCEEDS_TOTAL_DEBT", maxAllowed });
            }

            // 4. Distribuir el pago
            let remainingAmount = payment.amount;
            let totalPaidToBase = 0;
            let totalPaidToLate = 0;
            const updatedInstallments: Installment[] = [];

            // A. Primero la cuota actual (Mora -> Base)
            let paidToLateThis = 0;
            let paidToBaseThis = 0;

            if (currentPendingLate > 0) {
                paidToLateThis = Math.min(remainingAmount, currentPendingLate);
                remainingAmount -= paidToLateThis;
                totalPaidToLate += paidToLateThis;
            }

            paidToBaseThis = Math.min(remainingAmount, currentPendingBase);
            remainingAmount -= paidToBaseThis;
            totalPaidToBase += paidToBaseThis;

            const updatedCurrent: Installment = {
                ...currentInstallment,
                paidAmount: currentInstallment.paidAmount + paidToBaseThis,
                paidLatePayment: (currentInstallment.paidLatePayment ?? 0) + paidToLateThis,
                payments: [...(currentInstallment.payments ?? []), payment.id]
            };
            this.updateInstallmentStatus(updatedCurrent);
            updatedInstallments.push(updatedCurrent);

            // B. Luego las cuotas futuras (Solo Base)
            for (const inst of futureInstallments) {
                if (remainingAmount <= 0) break;

                const pendingBase = inst.amount - inst.paidAmount;
                const paidToBase = Math.min(remainingAmount, pendingBase);

                remainingAmount -= paidToBase;
                totalPaidToBase += paidToBase;

                const updatedInst: Installment = {
                    ...inst,
                    paidAmount: inst.paidAmount + paidToBase,
                    payments: [...(inst.payments ?? []), payment.id]
                };
                this.updateInstallmentStatus(updatedInst);
                updatedInstallments.push(updatedInst);
            }

            // 5. Actualizar Debt
            const allUpdatedInstallments = allInstallments.map(inst => {
                const updated = updatedInstallments.find(u => u.id === inst.id);
                return updated || inst;
            });

            const installmentsPaidCount = allUpdatedInstallments.filter(inst => inst.paidAmount >= inst.amount).length;

            const updatedDebt: Debt = {
                ...debt,
                totalPaid: (debt.totalPaid ?? 0) + totalPaidToBase,
                totalPaymentForLate: (debt.totalPaymentForLate ?? 0) + totalPaidToLate,
                dateLastPayment: payment.paidAt,
                installmentsPaid: installmentsPaidCount,
            };

            // 6. Persistir cambios
            await this.paymentGateway.create({ payment, companyId });

            // Actualización de cuotas afectadas
            await this.installmentGateway.updateByDebt({
                companyId,
                debtId,
                installments: updatedInstallments
            });

            // Actualizar Deuda
            await this.debtGateway.update({
                companyId,
                debt: updatedDebt,
                isNewCollector: false
            });

            return ok({
                payment,
                installment: updatedInstallments[0], // Retornamos la cuota desde la que se inició el pago
                debt: updatedDebt
            });

        } catch (error) {
            console.error("[RegisterPaymentUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }

    private updateInstallmentStatus(installment: Installment) {
        const totalDue = installment.amount + installment.latepayment;
        const totalPaid = installment.paidAmount + (installment.paidLatePayment ?? 0);

        if (totalPaid >= totalDue) {
            installment.status = "pagada";
            installment.paidAt = new Date().toISOString().split("T")[0];
        } else if (totalPaid > 0) {
            installment.status = "incompleto";
        }
    }
}
