/**
 * Основной модуль проекта js-doc-design
 * @description Демонстрирует использование JSDoc документации
 */

/**
 * Приветствует пользователя
 * @param {string} name - Имя пользователя
 * @returns {string} Приветственное сообщение
 * @example
 * const message = greetUser('Иван');
 * console.log(message); // "Привет, Иван!"
 */
function greetUser(name) {
    return `Привет, ${name}!`;
}

/**
 * Вычисляет сумму двух чисел
 * @param {number} a - Первое число
 * @param {number} b - Второе число
 * @returns {number} Сумма чисел
 * @example
 * const result = add(2, 3);
 * console.log(result); // 5
 */
function add(a, b) {
    return a + b;
}

module.exports = {
    greetUser,
    add
};