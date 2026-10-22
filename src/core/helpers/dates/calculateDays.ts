/** indica si una fecha es menor a la actual (en hora local a medianoche) */
export function IsPastDate(dateStr: string): boolean {
    const cleanDateStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const inputDate = new Date(`${cleanDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
}

/** indica si la fecha es igual o mayor a la actual (en hora local a medianoche) */
export function IsFutureOrToday(dateStr: string): boolean {
    const cleanDateStr = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const inputDate = new Date(`${cleanDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
}


/** obtiene la fecha de un date en base a la zona horaria local y la devuelve en un string yyyy-mm-dd*/
export function getLocalDate(date: Date): string {
    const year = date.getFullYear();
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;


    return `${year}-${month}-${day}`;
}