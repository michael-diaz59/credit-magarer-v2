import { getLocalDate } from "./calculateDays";


export function formatISOToInputDate(dateString: string): string {
    if (!dateString) return "";
    // Creamos el objeto Date y usamos split para quedarnos solo con la parte YYYY-MM-DD
    return getLocalDate(new Date(dateString))
};