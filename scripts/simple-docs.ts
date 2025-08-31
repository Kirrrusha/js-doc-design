/**
 * Упрощенный скрипт для генерации документации из JSDoc комментариев
 * @description Использует только встроенные модули Node.js
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Интерфейс для информации о параметре функции
 */
interface SimpleParamInfo {
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
interface SimpleReturnInfo {
    /** Тип возвращаемого значения */
    type: string;
    /** Описание возвращаемого значения */
    description: string;
}

/**
 * Интерфейс для информации о функции
 */
interface SimpleFunctionInfo {
    /** Имя функции */
    name: string;
    /** Описание функции */
    description: string;
    /** Параметры функции */
    params: SimpleParamInfo[];
    /** Информация о возвращаемом значении */
    returns: SimpleReturnInfo | null;
    /** Примеры использования */
    examples: string[];
    /** Путь к файлу */
    file: string;
}

/**
 * Рекурсивно получает все TS/JS файлы в директории
 * @param dir - Директория для поиска
 * @param fileList - Массив для накопления файлов
 * @returns Массив путей к TS/JS файлам
 */
function getTSFiles(dir: string, fileList: string[] = []): string[] {
    try {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                getTSFiles(filePath, fileList);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                fileList.push(filePath);
            }
        });

        return fileList;
    } catch (error) {
        console.warn(`Не удалось прочитать директорию ${dir}:`, (error as Error).message);
        return fileList;
    }
}

/**
 * Извлекает JSDoc комментарии из содержимого файла
 * @param content - Содержимое файла
 * @param filePath - Путь к файлу
 * @returns Массив объектов с информацией о функциях
 */
function extractJSDocFromContent(content: string, filePath: string): SimpleFunctionInfo[] {
    const functions: SimpleFunctionInfo[] = [];

    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g;

    let match: RegExpExecArray | null;
    while ((match = jsdocRegex.exec(content)) !== null) {
        const [, jsdocContent, functionName1, functionName2] = match;
        const functionName = functionName1 || functionName2;

        if (functionName && jsdocContent) {
            const description = jsdocContent.match(/@description\s+(.*?)(?=@|\*\/|$)/s);
            const params = [...jsdocContent.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*?)(?=@|\*\/|$)/gs)];
            const returns = jsdocContent.match(/@returns?\s+\{([^}]+)\}\s*(.*?)(?=@|\*\/|$)/s);
            const examples = [...jsdocContent.matchAll(/@example\s+([\s\S]*?)(?=@|\*\/|$)/g)];

            const functionInfo: SimpleFunctionInfo = {
                name: functionName,
                description: description ? description[1].trim() : jsdocContent.split('\n')[0].replace(/^\s*\*?\s*/, '').trim(),
                params: params.map(param => ({
                    name: param[2],
                    type: param[1],
                    description: param[3].trim()
                })),
                returns: returns ? {
                    type: returns[1],
                    description: returns[2].trim()
                } : null,
                examples: examples.map(ex => ex[1].trim()),
                file: path.relative(process.cwd(), filePath)
            };

            functions.push(functionInfo);
        }
    }

    return functions;
}

/**
 * Генерирует markdown документацию
 * @param functions - Массив функций с JSDoc информацией
 * @returns Markdown строка с документацией
 */
function generateMarkdown(functions: SimpleFunctionInfo[]): string {
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
            markdown += `**Возвращает:** ${func.returns.type}`;
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
 * Основная функция скрипта
 */
function main(): void {
    try {
        console.log('Поиск TS/JS файлов...');

        if (!fs.existsSync('src')) {
            console.log('Папка src не найдена. Создаем пустую документацию.');
            const documentation = generateMarkdown([]);

            let readmeContent = '';
            const readmePath = 'README.md';

            if (fs.existsSync(readmePath)) {
                readmeContent = fs.readFileSync(readmePath, 'utf8');
            }

            const apiSectionRegex = /## API Документация[\s\S]*?(?=##|$)/;
            readmeContent = readmeContent.replace(apiSectionRegex, '');

            readmeContent = readmeContent.trim() + '\n\n' + documentation;

            fs.writeFileSync(readmePath, readmeContent);
            console.log('README.md обновлен с пустой документацией API');
            return;
        }

        const tsFiles = getTSFiles('src');
        console.log(`Найдено ${tsFiles.length} TS/JS файлов`);

        const allFunctions: SimpleFunctionInfo[] = [];

        tsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const functions = extractJSDocFromContent(content, file);
            allFunctions.push(...functions);
        });

        console.log(`Найдено ${allFunctions.length} функций с JSDoc документацией`);

        const documentation = generateMarkdown(allFunctions);

        let readmeContent = '';
        const readmePath = 'README.md';

        if (fs.existsSync(readmePath)) {
            readmeContent = fs.readFileSync(readmePath, 'utf8');
        }

        const apiSectionRegex = /## API Документация[\s\S]*?(?=##|$)/;
        readmeContent = readmeContent.replace(apiSectionRegex, '');

        readmeContent = readmeContent.trim() + '\n\n' + documentation;

        fs.writeFileSync(readmePath, readmeContent);
        console.log('README.md обновлен с новой документацией API');

    } catch (error) {
        console.error('Ошибка при генерации документации:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    getTSFiles,
    extractJSDocFromContent,
    generateMarkdown,
    SimpleFunctionInfo,
    SimpleParamInfo,
    SimpleReturnInfo
};