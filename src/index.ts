/**
 * Основной модуль проекта js-doc-design
 * @description Демонстрирует использование JSDoc документации с TypeScript
 */

/**
 * Приветствует пользователя
 * @param name - Имя пользователя
 * @returns Приветственное сообщение
 * @example
 * ```typescript
 * const message = greetUser('Иван');
 * console.log(message); // "Привет, Иван!"
 * ```
 */
export function greetUser(name: string): string {
    return `Привет, ${name}!`;
}

/**
 * Вычисляет сумму двух чисел
 * @param a - Первое число
 * @param b - Второе число
 * @returns Сумма чисел
 * @example
 * ```typescript
 * const result = add(2, 3);
 * console.log(result); // 5
 * ```
 */
export function add(a: number, b: number): number {
    return a + b;
}

/**
 * Интерфейс для пользователя
 */
export interface User {
    /** Имя пользователя */
    name: string;
    /** Возраст пользователя */
    age: number;
    /** Email пользователя */
    email?: string;
}

/**
 * Создает объект пользователя
 * @param name - Имя пользователя
 * @param age - Возраст пользователя
 * @param email - Email пользователя (опционально)
 * @returns Объект пользователя
 * @example
 * ```typescript
 * const user = createUser('Иван', 25, 'ivan@example.com');
 * console.log(user.name); // "Иван"
 * ```
 */
export function createUser(name: string, age: number, email?: string): User {
    return {
        name,
        age,
        email
    };
}

/**
 * Тип для функции обработки данных
 */
export type DataProcessor<T, R> = (data: T) => R;

/**
 * Обрабатывает массив данных с помощью переданной функции
 * @param data - Массив данных для обработки
 * @param processor - Функция обработки
 * @returns Обработанный массив
 * @example
 * ```typescript
 * const numbers = [1, 2, 3, 4, 5];
 * const doubled = processArray(numbers, (x) => x * 2);
 * console.log(doubled); // [2, 4, 6, 8, 10]
 * ```
 */
export function processArray<T, R>(data: T[], processor: DataProcessor<T, R>): R[] {
    return data.map(processor);
}