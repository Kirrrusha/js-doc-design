/**
 * Существующая функция с JSDoc
 * @param x - число
 * @returns результат
 */
export function existingFunction(x: number): number {
    return x * 2;
}

// Новая функция без JSDoc для тестирования
export function newFunctionWithoutJSDoc(y: string): string {
    return y.toUpperCase();
}