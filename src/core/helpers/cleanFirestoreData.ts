export function cleanFirestoreData<T extends Record<string, unknown>>(
    data: T
): Partial<T> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    return Object.fromEntries(entries) as Partial<T>;
}
