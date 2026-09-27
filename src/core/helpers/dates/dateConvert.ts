


export function formatISOToInputDate(dateString: string): string {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-");

    if (!year || !month || !day) {
        return "";
    }

    return `${year}-${month}-${day}`;
}