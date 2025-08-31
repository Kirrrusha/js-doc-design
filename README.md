# js-doc-design

Автоматизация работы с JSDoc документацией и контроля её наличия. Включает ESLint плагин, скрипты проверки и генерации документации.

## Установка

```bash
# Используя npm
npm install js-doc-design

# Используя pnpm (рекомендуется)
pnpm add js-doc-design

# Используя yarn
yarn add js-doc-design
```

## Возможности

- 🔍 **Проверка JSDoc комментариев** - автоматическая проверка наличия документации
- 📝 **Генерация документации** - автоматическое создание README из JSDoc
- 🔧 **ESLint плагин** - кастомное правило для обязательного JSDoc
- 🚀 **TypeScript поддержка** - полная поддержка TypeScript проектов
- 📦 **ESM модули** - современный синтаксис ES модулей
- 🎯 **Гибкие режимы** - проверка всех, новых или staged файлов

## Использование

### CLI команды

После установки доступны следующие команды:

```bash
# Проверка JSDoc комментариев
jsdoc-check                    # Полная проверка всех функций
jsdoc-check --new             # Только новые функции (сравнение с HEAD)
jsdoc-check --staged          # Только staged файлы
jsdoc-check --help            # Справка

# Генерация документации
jsdoc-generate                # Полная генерация с парсингом JSDoc
jsdoc-simple                  # Упрощенная генерация
```

### Программное использование

```typescript
import { checkJSDocComments, generateDocs } from 'js-doc-design';

// Проверка JSDoc комментариев
const result = await checkJSDocComments({
  mode: 'full', // 'full' | 'new' | 'staged'
  directory: './src'
});

// Генерация документации
await generateDocs({
  sourceDir: './src',
  outputFile: './README.md'
});
```

### ESLint плагин

Добавьте в ваш `eslint.config.js`:

```javascript
import jsDocDesign from 'js-doc-design/eslint-plugin';

export default [
  {
    plugins: {
      'jsdoc-required': jsDocDesign
    },
    rules: {
      // Полная проверка всех функций
      'jsdoc-required/require-jsdoc': 'error'

      // Или с указанием режима:
      // 'jsdoc-required/require-jsdoc': ['error', { mode: 'full' }]   // все функции
      // 'jsdoc-required/require-jsdoc': ['error', { mode: 'new' }]    // только новые
      // 'jsdoc-required/require-jsdoc': ['error', { mode: 'staged' }] // только staged
    }
  }
];
```

#### Готовые конфигурации ESLint

Для удобства доступны готовые конфигурации:

```bash
# Проверка всех функций (по умолчанию)
pnpm run lint

# Проверка только новых функций (изменения с HEAD)
pnpm run lint:new

# Проверка только staged файлов
pnpm run lint:staged
```

## Конфигурация

### package.json скрипты

Добавьте в ваш `package.json`:

```json
{
  "scripts": {
    "docs:check": "jsdoc-check",
    "docs:check:new": "jsdoc-check --new",
    "docs:generate": "jsdoc-generate",
    "docs:simple": "jsdoc-simple"
  }
}
```

### Git hooks

Для автоматической проверки перед коммитом:

```bash
# Установка git hooks
git config core.hooksPath .githooks

# Создание pre-commit hook
echo '#!/bin/sh\njsdoc-check --staged' > .githooks/pre-commit
chmod +x .githooks/pre-commit
```

## Режимы проверки

### Полная проверка (`--full`)
Проверяет все функции в проекте:
```bash
jsdoc-check --full
```

### Проверка новых функций (`--new`)
Проверяет только функции, добавленные с последнего коммита:
```bash
jsdoc-check --new
```

### Проверка staged файлов (`--staged`)
Проверяет только файлы в staging area:
```bash
jsdoc-check --staged
```

## Поддерживаемые форматы

- ✅ JavaScript (ES5, ES6+)
- ✅ TypeScript
- ✅ JSX/TSX
- ✅ ESM и CommonJS модули
- ✅ React хуки (функции, начинающиеся с `use`)

## Примеры JSDoc

### Функция с параметрами

```typescript
/**
 * Вычисляет сумму двух чисел
 * @param {number} a - Первое число
 * @param {number} b - Второе число
 * @returns {number} Сумма чисел
 * @example
 * const result = add(2, 3);
 * console.log(result); // 5
 */
function add(a: number, b: number): number {
  return a + b;
}
```

### React хук

```typescript
/**
 * Хук для управления состоянием пользователя
 * @param {string} initialName - Начальное имя пользователя
 * @returns {Object} Объект с именем пользователя и функцией обновления
 * @example
 * const { name, setName } = useUser('John');
 */
function useUser(initialName: string) {
  const [name, setName] = useState(initialName);
  return { name, setName };
}
```

## API

### checkJSDocComments(options)

Проверяет наличие JSDoc комментариев в файлах.

**Параметры:**
- `options.mode` - Режим проверки: `'full'` | `'new'` | `'staged'`
- `options.directory` - Директория для проверки (по умолчанию: `'./src'`)

**Возвращает:** `Promise<CheckResult>`

### generateDocs(options)

Генерирует документацию из JSDoc комментариев.

**Параметры:**
- `options.sourceDir` - Исходная директория (по умолчанию: `'./src'`)
- `options.outputFile` - Файл для записи (по умолчанию: `'./README.md'`)

**Возвращает:** `Promise<void>`

## Требования

- Node.js >= 16.0.0
- TypeScript >= 4.0.0 (для TypeScript проектов)
- ESLint >= 8.0.0 (для ESLint плагина)

## Лицензия

MIT

## Автор

Kirill Lebedenko

## Ссылки

- [GitHub](https://github.com/kirilllebedenko/js-doc-design)
- [npm](https://www.npmjs.com/package/js-doc-design)
- [Issues](https://github.com/kirilllebedenko/js-doc-design/issues)

## API Документация

### functionWithJSDoc

Тестовый файл с функциями без JSDoc документации
Используется для тестирования ESLint правил
/

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
Функция с корректной JSDoc документацией

**Параметры:**

- `input` (any): Входная строка

**Возвращает:** any - Обработанная строка

*Файл: src/test-without-jsdoc.ts*

---

### greetUser

Основной модуль проекта js-doc-design

**Параметры:**

- `name` (any): Имя пользователя

**Возвращает:** any - Приветственное сообщение

**Примеры:**

```typescript
```typescript
const message = greetUser('Иван');
console.log(message); // "Привет, Иван!"
```
```

*Файл: src/index.ts*

---

### add

Вычисляет сумму двух чисел

**Параметры:**

- `a` (any): Первое число
- `b` (any): Второе число

**Возвращает:** any - Сумма чисел

**Примеры:**

```typescript
```typescript
const result = add(2, 3);
console.log(result); // 5
```
```

*Файл: src/index.ts*

---

### createUser

Интерфейс для пользователя
/
export interface User {
/** Имя пользователя */
name: string;
/** Возраст пользователя */
age: number;
/** Email пользователя */
email?: string;
}

/**
Создает объект пользователя

**Параметры:**

- `name` (any): Имя пользователя
- `age` (any): Возраст пользователя
- `email` (any): Email пользователя (опционально)

**Возвращает:** any - Объект пользователя

**Примеры:**

```typescript
```typescript
const user = createUser('Иван', 25, 'ivan@example.com');
console.log(user.name); // "Иван"
```
```

*Файл: src/index.ts*

---

### processArray

Тип для функции обработки данных
/
export type DataProcessor<T, R> = (data: T) => R;

/**
Обрабатывает массив данных с помощью переданной функции

**Параметры:**

- `data` (any): Массив данных для обработки
- `processor` (any): Функция обработки

**Возвращает:** any - Обработанный массив

**Примеры:**

```typescript
```typescript
const numbers = [1, 2, 3, 4, 5];
const doubled = processArray(numbers, (x) => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```
```

*Файл: src/index.ts*

---

### greetUser

Основной модуль проекта js-doc-design

**Параметры:**

- `name` (string): Имя пользователя

**Возвращает:** string - Приветственное сообщение

**Примеры:**

```typescript
const message = greetUser('Иван');
console.log(message); // "Привет, Иван!"
```

*Файл: src/index.js*

---

### add

Вычисляет сумму двух чисел

**Параметры:**

- `a` (number): Первое число
- `b` (number): Второе число

**Возвращает:** number - Сумма чисел

**Примеры:**

```typescript
const result = add(2, 3);
console.log(result); // 5
```

*Файл: src/index.js*

---

## Разработка

### Установка зависимостей

```bash
# Клонирование репозитория
git clone https://github.com/kirilllebedenko/js-doc-design.git
cd js-doc-design

# Установка зависимостей (рекомендуется pnpm)
pnpm install

# Или с npm
npm install
```

### Доступные скрипты

```bash
# Сборка проекта
pnpm run build

# Разработка
pnpm run dev

# Тестирование
pnpm run test
pnpm run test:watch
pnpm run test:coverage

# Линтинг
pnpm run lint
pnpm run lint:fix

# Проверка JSDoc
pnpm run check:jsdoc
pnpm run check:jsdoc:full
pnpm run check:jsdoc:new
pnpm run check:jsdoc:staged

# Генерация документации
pnpm run docs:generate
pnpm run docs:simple
```

### Публикация

```bash
# Сборка и публикация
pnpm run prepublishOnly
pnpm publish
```

