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


/** obtiene la fecha de un date en base a la zona horaria local y la devuelve en un string yyyy/mm/dd*/
export function getLocalDate(date: Date): string {
    const year = date.getFullYear();
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;


    return `${year}-${month}-${day}`;
}