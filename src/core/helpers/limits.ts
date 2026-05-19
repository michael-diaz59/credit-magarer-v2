export function minZero(value: number): number {
    if (!value || value === null || value === undefined) return 0;
    return value < 0 ? 0 : value;
}

export function maxHundreadPercent(value: number): number {
    if (!value || value === null || value === undefined) return 0;
    return value > 100 ? 100 : value;
}
