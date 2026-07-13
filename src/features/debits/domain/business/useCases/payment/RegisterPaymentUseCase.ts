import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway, InstallmentGateway } from "../../../infraestructure/DebtGatweay";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";
import type { Payment } from "../../entities/Payment";
import type { Installment } from "../../entities/Installment";
import type { Debt } from "../../entities/Debt";
import { calculateAmountToPay, paidPorcential } from "../../../../../shared/helpers/calculate";

export type RegisterPaymentError =
    | { code: "DEBT_NOT_FOUND" }
    | { code: "INSTALLMENT_NOT_FOUND" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
    | { code: "EXCEEDS_TOTAL_DEBT", maxAllowed: number };


/**
 * @param payment datos del pago
 * @param companyId id de la empresa
 * @param payLatePayment si es false no se tiene en cuenta el pago por atraso
 */
export interface RegisterPaymentInput {
    payment: Payment;
    companyId: string;
    payLatePayment: boolean;
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
        const { payment, companyId, payLatePayment } = input;

        try {
            // 1. obtiene la cuota inicial vinculada al pago
            const initialInstallmentResult = await this.installmentGateway.getById({
                companyId,
                installmentId: payment.installmentId
            });

            if (!initialInstallmentResult.ok || !initialInstallmentResult.value.state) {
                return fail({ code: "INSTALLMENT_NOT_FOUND" });
            }

            const currentInstallment = initialInstallmentResult.value.state;
            const debtId = currentInstallment.debtId;

            // 2. obtiene todas las cuotas de la deuda
            const allInstallmentsResult = await this.installmentGateway.getByDebt({
                companyId,
                debtId
            });

            if (!allInstallmentsResult.state.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            //organizar en una lista de menor a mayor las cuotas por su numero de cuota
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

            // 3. Identificar cuotas futuras

            //obtiene el inidce de la lista que apunta a la cuota actual 
            const currentIndex = allInstallments.findIndex(i => i.id === payment.installmentId);

            //obtiene todas las cuotas desde la actual hasta que se acaben y que no esten pagadas, liquidadas o canceladas
            const installmentsToPay: Installment[] = allInstallments.slice(currentIndex).filter(i => i.status !== 'pagada' && i.status !== 'liquidada' && i.status !== 'cancelada');

            /**
             * valor a pagar por retraso
             */
            const currentPendingLate = currentInstallment.latepayment - (currentInstallment.paidLatePayment ?? 0);
            /**
             * valor a pagar por base de la cuota
             */
            const currentPendingBase = currentInstallment.amount - currentInstallment.paidAmount;

            console.log("currentPendingLate", currentPendingLate)
            console.log("currentPendingBase", currentPendingBase)



            // 4. Distribuir el pago

            /**
             * valor restante del pago por distribuir
             */
            let remainingAmount = payment.amount;
            let totalPaidToBase = 0;
            let totalPaidToLate = 0;
            const updatedInstallments: Installment[] = [];


            // B. Luego las cuotas futuras (Solo Base)
            for (const installment of installmentsToPay) {
                if (remainingAmount <= 0) break;

                const pendingBase = (installment.amount ?? 0) - (installment.paidAmount ?? 0);
                const pendingLate = (installment.latepayment ?? 0) - (installment.paidLatePayment ?? 0);

                const paidToBase = calculateAmountToPay(remainingAmount, pendingBase);
                totalPaidToBase += paidToBase;

                remainingAmount = remainingAmount - paidToBase;

                let paidToLate = 0;
                if (payLatePayment) {
                    paidToLate = calculateAmountToPay(remainingAmount, pendingLate);
                    remainingAmount -= paidToLate;
                    totalPaidToLate += paidToLate;
                }
                const updatedInst: Installment = {
                    ...installment,
                    paidAmount: (installment.paidAmount ?? 0) + paidToBase,
                    paidLatePayment: (installment.paidLatePayment ?? 0) + paidToLate,
                    payments: [...(installment.payments ?? []), payment.id],
                    basePaidRatio: paidPorcential((installment.paidAmount ?? 0), installment.amount),
                    latePaidRatio: paidPorcential((installment.paidLatePayment ?? 0), installment.latepayment)
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
                capitalPaid: paidPorcential(((debt.totalPaid ?? 0) + (debt.totalPaymentForLate ?? 0) + (debt.renewalPayment ?? 0)), debt.capital),
                interestPaid: paidPorcential(((debt.totalPaid ?? 0) + (debt.totalPaymentForLate ?? 0) + (debt.renewalPayment ?? 0)), debt.totalInterest),
                creditPaid: paidPorcential(((debt.totalPaid ?? 0) + (debt.totalPaymentForLate ?? 0) + (debt.renewalPayment ?? 0)), debt.totalAmount),
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
                isNewRoute: false
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
        const totalDue = installment.amount + (installment.latepayment ?? 0);
        const totalPaid = installment.paidAmount + (installment.paidLatePayment ?? 0);

        if (totalPaid >= totalDue) {
            installment.status = "pagada";
            installment.paidAt = new Date().toISOString().split("T")[0];
        } else if (totalPaid > 0) {
            installment.status = "incompleto";
        }
    }
}
