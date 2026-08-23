

/**
 * capea el porcentaje devuelto a max 100
 * @param amountPaid monto pagado
 * @param amountToPay monto a pagar
 * @returns porcentaje pagado
 */
export function paidPorcential(amountPaid: number, amountToPay: number): number {
    let porcentaje = (amountPaid / amountToPay) * 100;
    if (amountToPay <= 0) {
        return 100;
    }
    if (porcentaje > 100) {
        porcentaje = 100
    }
    return Math.ceil(porcentaje);
}

/**
 * calcula el monto a pagar por monto de fondo
 * @param amountToPay monto a pagar
 * @param funds funds disponibles
 * @returns monto a pagar
 */
export function calculateAmountToPay(amountToPay: number, funds: number): number {
    return Math.min(amountToPay, funds);
}

/**
 * devuelve 0 si el monto es negativo, o el valor dado si es mayor o igual a cero
 * @param amount valor a validar
 * @returns valor mayor o igual a cero
 */
export function minZero(amount: number): number {
    if (amount < 0) return 0;
    return amount;
}

