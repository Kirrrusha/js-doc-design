/**
 * Существующая функция с JSDoc
 * @param x - число
 * @returns результат
 */
export function existingFunction(x: number): number {
    return x * 2;
}

/**
 * Новая функция с JSDoc для тестирования
 * @param y - строка для обработки
 * @returns строка в верхнем регистре
 */
export function newFunctionWithoutJSDoc(y: string): string {
    return y.toUpperCase();
}

// Еще одна новая функция без JSDoc для тестирования режима 'new'
export function anotherNewFunction(z: number): number {
    return z * 3;
}