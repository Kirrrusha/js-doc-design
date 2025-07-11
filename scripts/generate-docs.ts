/**
 * Скрипт для генерации документации из JSDoc комментариев
 * @description Извлекает JSDoc комментарии из файлов и обновляет README.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as doctrine from 'doctrine';

/**
 * Интерфейс для информации о параметре функции
 */
interface ParamInfo {
    /** Имя параметра */
    name: string;
    /** Тип параметра */
    type: string;
    /** Описание параметра */
    description: string;
}

/**
 * Интерфейс для информации о возвращаемом значении
 */
interface ReturnInfo {
    /** Тип возвращаемого значения */
    type?: doctrine.Type | null;
    /** Описание возвращаемого значения */
    description?: string | null;
}

/**
 * Интерфейс для информации о функции
 */
interface FunctionInfo {
    /** Имя функции */
    name: string;
    /** Описание функции */
    description: string;
    /** Параметры функции */
    params: ParamInfo[];
    /** Информация о возвращаемом значении */
    returns: ReturnInfo | null;
    /** Примеры использования */
    examples: string[];
    /** Путь к файлу */
    file: string;
}

/**
 * Извлекает JSDoc комментарии из файла
 * @param filePath - Путь к файлу
 * @returns Массив объектов с информацией о функциях
 */
function extractJSDocFromFile(filePath: string): FunctionInfo[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const functions: FunctionInfo[] = [];

    // Регулярное выражение для поиска JSDoc комментариев с последующими функциями (поддержка TypeScript)
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match: RegExpExecArray | null;
    while ((match = jsdocRegex.exec(content)) !== null) {
        const [, jsdocContent, functionName1, functionName2] = match;
        const functionName = functionName1 || functionName2;

        if (functionName && jsdocContent) {
            try {
                const parsed = doctrine.parse(jsdocContent, { unwrap: true });

                const functionInfo: FunctionInfo = {
                    name: functionName,
                    description: parsed.description || '',
                    params: parsed.tags.filter(tag => tag.title === 'param').map(tag => ({
                        name: tag.name || '',
                        type: tag.type ? doctrine.type.stringify(tag.type) : 'any',
                        description: tag.description || ''
                    })),
                    returns: (() => {
                        const returnTag = parsed.tags.find(tag => tag.title === 'returns');
                        return returnTag ? {
                            type: returnTag.type,
                            description: returnTag.description
                        } : null;
                    })(),
                    examples: parsed.tags.filter(tag => tag.title === 'example').map(tag => tag.description || ''),
                    file: path.relative(process.cwd(), filePath)
                };

                functions.push(functionInfo);
            } catch (error) {
                console.warn(`Ошибка парсинга JSDoc в файле ${filePath} для функции ${functionName}:`, (error as Error).message);
            }
        }
    }

    return functions;
}

/**
 * Сканирует директорию и извлекает все JSDoc комментарии
 * @param directory - Директория для сканирования
 * @returns Массив всех найденных функций с JSDoc
 */
async function extractAllJSDoc(directory: string = 'src'): Promise<FunctionInfo[]> {
    const pattern = path.join(directory, '**/*.{ts,js}');
    const files = await glob(pattern);

    const allFunctions: FunctionInfo[] = [];

    for (const file of files) {
        const functions = extractJSDocFromFile(file);
        allFunctions.push(...functions);
    }

    return allFunctions;
}

/**
 * Генерирует markdown документацию из JSDoc данных
 * @param functions - Массив функций с JSDoc информацией
 * @returns Markdown строка с документацией
 */
function generateMarkdown(functions: FunctionInfo[]): string {
    let markdown = '## API Документация\n\n';

    if (functions.length === 0) {
        markdown += 'Функции с JSDoc документацией не найдены.\n\n';
        return markdown;
    }

    functions.forEach(func => {
        markdown += `### ${func.name}\n\n`;

        if (func.description) {
            markdown += `${func.description}\n\n`;
        }

        if (func.params.length > 0) {
            markdown += '**Параметры:**\n\n';
            func.params.forEach(param => {
                markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
            });
            markdown += '\n';
        }

        if (func.returns) {
            const returnType = func.returns.type ? doctrine.type.stringify(func.returns.type) : 'any';
            markdown += `**Возвращает:** ${returnType}`;
            if (func.returns.description) {
                markdown += ` - ${func.returns.description}`;
            }
            markdown += '\n\n';
        }

        if (func.examples.length > 0) {
            markdown += '**Примеры:**\n\n';
            func.examples.forEach(example => {
                markdown += '```typescript\n';
                markdown += example + '\n';
                markdown += '```\n\n';
            });
        }

        markdown += `*Файл: ${func.file}*\n\n`;
        markdown += '---\n\n';
    });

    return markdown;
}

/**
 * Обновляет README.md файл с новой документацией
 * @param documentation - Markdown документация
 */
function updateReadme(documentation: string): void {
    const readmePath = 'README.md';
    let readmeContent = '';

    // Читаем существующий README или создаем базовый
    if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf8');
    } else {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        readmeContent = `# ${packageJson.name}\n\n${packageJson.description}\n\n`;
    }

    // Удаляем старую документацию API если она есть
    const apiSectionRegex = /## API Документация[\s\S]*?(?=##|$)/;
    readmeContent = readmeContent.replace(apiSectionRegex, '');

    // Добавляем новую документацию
    readmeContent = readmeContent.trim() + '\n\n' + documentation;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('README.md обновлен с новой документацией API');
}

/**
 * Основная функция скрипта
 */
async function main(): Promise<void> {
    try {
        console.log('Извлечение JSDoc комментариев...');
        const functions = await extractAllJSDoc();

        console.log(`Найдено ${functions.length} функций с JSDoc документацией`);

        const documentation = generateMarkdown(functions);
        updateReadme(documentation);

        console.log('Документация успешно сгенерирована!');
    } catch (error) {
        console.error('Ошибка при генерации документации:', error);
        process.exit(1);
    }
}

// Запускаем скрипт если он вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    extractJSDocFromFile,
    extractAllJSDoc,
    generateMarkdown,
    updateReadme,
    FunctionInfo,
    ParamInfo,
    ReturnInfo
};