/**
 * Упрощенный скрипт для генерации документации из JSDoc комментариев
 * @description Использует только встроенные модули Node.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Рекурсивно получает все JS файлы в директории
 * @param {string} dir - Директория для поиска
 * @param {Array} fileList - Массив для накопления файлов
 * @returns {Array} Массив путей к JS файлам
 */
function getJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getJSFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Извлекает JSDoc комментарии из содержимого файла
 * @param {string} content - Содержимое файла
 * @param {string} filePath - Путь к файлу
 * @returns {Array} Массив объектов с информацией о функциях
 */
function extractJSDocFromContent(content, filePath) {
    const functions = [];

    // Простое регулярное выражение для поиска JSDoc комментариев
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g;

    let match;
    while ((match = jsdocRegex.exec(content)) !== null) {
        const [, jsdocContent, functionName1, functionName2] = match;
        const functionName = functionName1 || functionName2;

        if (functionName && jsdocContent) {
            // Простой парсинг JSDoc
            const description = jsdocContent.match(/@description\s+(.*?)(?=@|\*\/|$)/s);
            const params = [...jsdocContent.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*?)(?=@|\*\/|$)/gs)];
            const returns = jsdocContent.match(/@returns?\s+\{([^}]+)\}\s*(.*?)(?=@|\*\/|$)/s);
            const examples = [...jsdocContent.matchAll(/@example\s+([\s\S]*?)(?=@|\*\/|$)/g)];

            const functionInfo = {
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
 * @param {Array} functions - Массив функций с JSDoc информацией
 * @returns {string} Markdown строка с документацией
 */
function generateMarkdown(functions) {
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
                markdown += '```javascript\n';
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
function main() {
    try {
        console.log('Поиск JS файлов...');
        const jsFiles = getJSFiles('src');
        console.log(`Найдено ${jsFiles.length} JS файлов`);

        const allFunctions = [];

        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const functions = extractJSDocFromContent(content, file);
            allFunctions.push(...functions);
        });

        console.log(`Найдено ${allFunctions.length} функций с JSDoc документацией`);

        const documentation = generateMarkdown(allFunctions);

        // Обновляем README
        let readmeContent = '';
        const readmePath = 'README.md';

        if (fs.existsSync(readmePath)) {
            readmeContent = fs.readFileSync(readmePath, 'utf8');
        }

        // Удаляем старую документацию API
        const apiSectionRegex = /## API Документация[\s\S]*?(?=##|$)/;
        readmeContent = readmeContent.replace(apiSectionRegex, '');

        // Добавляем новую документацию
        readmeContent = readmeContent.trim() + '\n\n' + documentation;

        fs.writeFileSync(readmePath, readmeContent);
        console.log('README.md обновлен с новой документацией API');

    } catch (error) {
        console.error('Ошибка при генерации документации:', error);
        process.exit(1);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = {
    getJSFiles,
    extractJSDocFromContent,
    generateMarkdown
};