import { Timestamp } from "firebase/firestore";
import { getLocalDate } from "../../helpers/dates/calculateDays";

/**
 * decodifica fecha de firebase
 * @param val fecha en formato any
 * @returns string en formato yyyy-MM-dd
 */
export function decodeDate(val: any): string {
    if (!val) return "";
    if (val instanceof Timestamp) {
        return getLocalDate(val.toDate())
    }
    if (typeof val === "string") {
        // If already ISO or has a date, return it
        return val;
    }
    if (val.toDate && typeof val.toDate === "function") {
        return val.toDate().toISOString();
    }
    return String(val);
}

/**
 * funcion para codificar fechas a timestamp
 * si ubo un problema en la funcion retorna por defecto la fecha actual\n
 * @param date fecha en formato string\n
 * @param isNew si es fecha nueva devuelve la fecha actual\n
 * @returns Timestamp
 */
export function encodeDate(date: string | null | undefined, isNew: boolean = false): Timestamp {
    if (isNew || !date) {
        if (!date) {
        } else {
        }
        return Timestamp.now();
    }

    try {
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
            let time = Timestamp.fromDate(parsedDate); 46
            return time;
        } else {
            const parsedDate = new Date(date);

            if (!isNaN(parsedDate.getTime())) {
                console.log(parsedDate);
                return Timestamp.fromDate(parsedDate);
            }
            console.log("fecha invalida")

        }
        console.log("fecha invalida")
    } catch (e) {
        console.error("Error parsing date for encoding:", date);
    }

    return Timestamp.now(); // Default to server timestamp if invalid or not provided
}