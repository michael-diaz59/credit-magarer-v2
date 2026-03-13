import type { Installment } from "../../../features/debits/domain/business/entities/Installment";

export function getFirstPayableInstallment(installments: Installment[]) {
    const sorted = [...installments].sort(
        (a, b) => a.installmentNumber - b.installmentNumber,
    );

    return sorted.find(
        (i) => i.status === "pendiente" || i.status === "incompleto"
    );
}

export type ProcessedInstallment = Installment & {
    isPaid: boolean;
    isActive: boolean;
    isFuture: boolean;
    isSelectable: boolean;
};

export function processInstallments(installments: Installment[]): ProcessedInstallment[] {
    const sorted = [...installments].sort(
        (a, b) => a.installmentNumber - b.installmentNumber
    );

    const firstPendingIndex = sorted.findIndex(
        (i) => i.status === "pendiente" || i.status === "incompleto"
    );

    return sorted.map((i, index) => {
        const isPaid = i.status === "pagada";
        const isActive = index === firstPendingIndex;
        const isFuture = firstPendingIndex !== -1 && index > firstPendingIndex;

        return {
            ...i,
            isPaid,
            isActive,
            isFuture,
            isSelectable: isActive
        };
    });
}