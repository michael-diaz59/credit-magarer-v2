export function cleanFirestoreData<T extends Record<string, unknown>>(
    data: T
): Partial<T> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    return Object.fromEntries(entries) as Partial<T>;
}

export function removeUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
}