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
        } else {

            console.log("es fecha nueva");
        }
        return Timestamp.now();
    }

    try {
        const [year, month, day] = date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        console.log(date);
        console.log(parsedDate);
        if (!isNaN(parsedDate.getTime())) {
            let time = Timestamp.fromDate(parsedDate);
            console.log(time);
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