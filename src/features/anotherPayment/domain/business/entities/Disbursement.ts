import type { PaymentMethod } from "../../../../debits/domain/business/entities/Payment";

export type DisbursementStatus = "entregado" | "cancelado";

/**un desembolso es una forma de pago para dar el credito al cliente */
export interface Disbursement {
    /**id del desembolso */
    id: string;
    /**fecha del desembolso */
    createdAt: string;
    /**fecha de la ultima modificacion */
    updatedAt: string
    /**monto del desembolso */
    amount: number;
    /**monto pendiente por entregar del desembolso */
    pendingAmount: number;
    /**monto entregado del desembolso */
    deliveredAmount: number;
    /**metodo de pago */
    method: PaymentMethod;
    /**indica si el cobrador debe gestionar el desembolso */
    isValidCollector: boolean;
    /**indica si el contador debe gestionar el desembolso */
    isValidAccountant: boolean;
    /**indica si el desembolso esta activo */
    status: DisbursementStatus;
    /**id del cobrador */
    collectorId?: string;
    /**nombre del cobrador */
    collectorName?: string;
    /**id de la cuenta bancaria */
    bankAccountId?: string;
    /**id del comprobante de pago */
    idProofOfPayment?: string;
    /**notas del contador */
    accountantNotes: string;
    /**id del cliente */
    clientId: string;
    /**nombre del cliente */
    clientName: string;
    /**id del contador */
    accountantId: string;
    /**nombre del contador */
    accountantName: string;
    /**id de la ruta */
    routeId: string;
    /**nombre de la ruta */
    routeName: string;
    /**id de la deuda */
    debtId: string;
    /**nombre de la deuda */
    debtName: string;
}
