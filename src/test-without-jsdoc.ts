/**
 * Тестовый файл с функциями без JSDoc документации
 * Используется для тестирования ESLint правил
 */

// Функция без JSDoc - должна вызывать ошибку ESLint
export function functionWithoutJSDoc(param: string): string {
    return param.toUpperCase();
}

// Еще одна функция без JSDoc
export function anotherFunction(a: number, b: number): number {
    return a * b;
}

// Интерфейс без JSDoc
export interface TestInterface {
    id: number;
    name: string;
}

// Класс без JSDoc
export class TestClass {
    private value: number;

    constructor(value: number) {
        this.value = value;
    }

    // Метод без JSDoc
    public getValue(): number {
        return this.value;
    }

    // Еще один метод без JSDoc
    public setValue(newValue: number): void {
        this.value = newValue;
    }
}

// Функция с правильным JSDoc для сравнения
/**
 * Функция с корректной JSDoc документацией
 * @param input - Входная строка
 * @returns Обработанная строка
 */
export function functionWithJSDoc(input: string): string {
    return input.toLowerCase();
}

// Тип без JSDoc
export type ProcessorFunction = (data: any) => any;

// Константа без JSDoc
export const CONSTANT_VALUE = 42;

// Функция-стрелка без JSDoc
export const arrowFunction = (x: number, y: number): number => x + y;