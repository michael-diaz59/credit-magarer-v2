import { Timestamp } from "firebase/firestore";

export function decodeDate(val: any): string {
    if (!val) return "";
    if (val instanceof Timestamp) {
        return val.toDate().toISOString();
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

/**funcion para codificar fechas a timestamp */
export function encodeDate(date: string | null | undefined, isNew: boolean = false): Timestamp {
    if (isNew || !date) {
        if (!date) {
            console.log("no hay fecha");
        }
        return Timestamp.now();
    }

    try {
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
            return Timestamp.fromDate(parsedDate);
        }
    } catch (e) {
        console.error("Error parsing date for encoding:", date);
    }

    return Timestamp.now(); // Default to server timestamp if invalid or not provided
}