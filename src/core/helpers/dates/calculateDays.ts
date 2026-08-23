/** indica si una fecha es menor a la actual */
export function IsPastDate(dateStr: string): boolean {
    const inputDate = new Date(`${dateStr}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
}

/** indica si la fecha es igual o mayor a la actual */
export function IsFutureOrToday(dateStr: string): boolean {
    const inputDate = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
}