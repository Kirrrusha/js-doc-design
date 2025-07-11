/**
 * Скрипт для генерации документации из JSDoc комментариев
 * @description Извлекает JSDoc комментарии из файлов и обновляет README.md
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const doctrine = require('doctrine');

/**
 * Извлекает JSDoc комментарии из файла
 * @param {string} filePath - Путь к файлу
 * @returns {Array} Массив объектов с информацией о функциях
 */
function extractJSDocFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const functions = [];

    // Регулярное выражение для поиска JSDoc комментариев с последующими функциями
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match;
    while ((match = jsdocRegex.exec(content)) !== null) {
        const [, jsdocContent, functionName1, functionName2] = match;
        const functionName = functionName1 || functionName2;

        if (functionName && jsdocContent) {
            try {
                const parsed = doctrine.parse(jsdocContent, { unwrap: true });

                const functionInfo = {
                    name: functionName,
                    description: parsed.description || '',
                    params: parsed.tags.filter(tag => tag.title === 'param').map(tag => ({
                        name: tag.name,
                        type: tag.type ? doctrine.type.stringify(tag.type) : 'any',
                        description: tag.description || ''
                    })),
                    returns: parsed.tags.find(tag => tag.title === 'returns') || null,
                    examples: parsed.tags.filter(tag => tag.title === 'example').map(tag => tag.description),
                    file: path.relative(process.cwd(), filePath)
                };

                functions.push(functionInfo);
            } catch (error) {
                console.warn(`Ошибка парсинга JSDoc в файле ${filePath} для функции ${functionName}:`, error.message);
            }
        }
    }

    return functions;
}

/**
 * Сканирует директорию и извлекает все JSDoc комментарии
 * @param {string} directory - Директория для сканирования
 * @returns {Promise<Array>} Массив всех найденных функций с JSDoc
 */
async function extractAllJSDoc(directory = 'src') {
    const pattern = path.join(directory, '**/*.js');
    const files = await glob(pattern);

    const allFunctions = [];

    for (const file of files) {
        const functions = extractJSDocFromFile(file);
        allFunctions.push(...functions);
    }

    return allFunctions;
}

/**
 * Генерирует markdown документацию из JSDoc данных
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
 * Обновляет README.md файл с новой документацией
 * @param {string} documentation - Markdown документация
 */
function updateReadme(documentation) {
    const readmePath = 'README.md';
    let readmeContent = '';

    // Читаем существующий README или создаем базовый
    if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf8');
    } else {
        readmeContent = `# ${require('../package.json').name}\n\n${require('../package.json').description}\n\n`;
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
async function main() {
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
if (require.main === module) {
    main();
}

module.exports = {
    extractJSDocFromFile,
    extractAllJSDoc,
    generateMarkdown,
    updateReadme
};