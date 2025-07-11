/**
 * Скрипт для проверки наличия JSDoc комментариев
 * @description Проверяет все функции и хуки на наличие JSDoc документации
 * Поддерживает режимы: полная проверка и проверка только новых функций
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * Проверяет файл на наличие функций без JSDoc
 * @param {string} filePath - Путь к файлу
 * @returns {Array} Массив ошибок
 */
function checkFileForJSDoc(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    const lines = content.split('\n');

    // Поиск функций без JSDoc
    const functionRegex = /(?:^|\n)\s*(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1] || match[2];
        const matchIndex = match.index;

        // Находим номер строки
        const beforeMatch = content.substring(0, matchIndex);
        const lineNumber = beforeMatch.split('\n').length;

        // Проверяем, есть ли JSDoc комментарий перед функцией
        const linesBefore = lines.slice(Math.max(0, lineNumber - 10), lineNumber - 1);
        const hasJSDoc = linesBefore.some(line => line.trim().includes('/**'));

        if (!hasJSDoc) {
            // Проверяем, не является ли это анонимной функцией в колбэке
            const isCallback = content.substring(Math.max(0, matchIndex - 50), matchIndex)
                .includes('(') && !match[0].includes('function ' + functionName);

            if (!isCallback) {
                errors.push({
                    file: filePath,
                    line: lineNumber,
                    function: functionName,
                    message: `Функция "${functionName}" не имеет JSDoc комментария`
                });
            }
        }
    }

    return errors;
}

/**
 * Получает список измененных файлов из Git
 * @param {string} mode - Режим: 'staged' для staged файлов, 'diff' для измененных
 * @returns {Array} Массив путей к измененным JS файлам
 */
function getChangedFiles(mode = 'staged') {
    try {
        let command;
        if (mode === 'staged') {
            command = 'git diff --cached --name-only --diff-filter=AM';
        } else {
            command = 'git diff --name-only --diff-filter=AM HEAD~1';
        }

        const output = execSync(command, { encoding: 'utf8' });
        return output.split('\n')
            .filter(file => file.endsWith('.js') && file.startsWith('src/'))
            .map(file => file.trim())
            .filter(file => file.length > 0);
    } catch (error) {
        console.warn('⚠️  Не удалось получить список измененных файлов из Git');
        return [];
    }
}

/**
 * Получает новые функции в измененных файлах
 * @param {string} filePath - Путь к файлу
 * @returns {Array} Массив новых функций
 */
function getNewFunctionsInFile(filePath) {
    try {
        // Получаем текущую версию файла
        const currentContent = fs.readFileSync(filePath, 'utf8');

        // Получаем предыдущую версию из Git
        let previousContent = '';
        try {
            previousContent = execSync(`git show HEAD:${filePath}`, { encoding: 'utf8' });
        } catch (error) {
            // Файл новый, все функции считаются новыми
            return checkFileForJSDoc(filePath);
        }

        // Находим функции в обеих версиях
        const currentFunctions = extractFunctionNames(currentContent);
        const previousFunctions = extractFunctionNames(previousContent);

        // Определяем новые функции
        const newFunctionNames = currentFunctions.filter(func =>
            !previousFunctions.includes(func)
        );

        // Проверяем только новые функции
        const allErrors = checkFileForJSDoc(filePath);
        return allErrors.filter(error =>
            newFunctionNames.includes(error.function)
        );

    } catch (error) {
        console.warn(`⚠️  Ошибка при анализе изменений в файле ${filePath}:`, error.message);
        return checkFileForJSDoc(filePath);
    }
}

/**
 * Извлекает имена функций из содержимого файла
 * @param {string} content - Содержимое файла
 * @returns {Array} Массив имен функций
 */
function extractFunctionNames(content) {
    const functionNames = [];
    const functionRegex = /(?:^|\n)\s*(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1] || match[2];
        if (functionName) {
            functionNames.push(functionName);
        }
    }

    return functionNames;
}

/**
 * Парсит аргументы командной строки
 * @returns {Object} Объект с параметрами
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        mode: 'full', // 'full', 'new', 'staged'
        help: false
    };

    args.forEach(arg => {
        switch (arg) {
            case '--new':
            case '-n':
                options.mode = 'new';
                break;
            case '--staged':
            case '-s':
                options.mode = 'staged';
                break;
            case '--full':
            case '-f':
                options.mode = 'full';
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    });

    return options;
}

/**
 * Показывает справку по использованию
 */
function showHelp() {
    console.log('🔍 Скрипт проверки JSDoc комментариев\n');
    console.log('Использование:');
    console.log('  node scripts/check-jsdoc.js [опции]\n');
    console.log('Опции:');
    console.log('  -f, --full     Полная проверка всех функций (по умолчанию)');
    console.log('  -n, --new      Проверка только новых функций (сравнение с HEAD)');
    console.log('  -s, --staged   Проверка только staged файлов');
    console.log('  -h, --help     Показать эту справку\n');
    console.log('Примеры:');
    console.log('  npm run check:jsdoc           # Полная проверка');
    console.log('  npm run check:jsdoc -- --new # Только новые функции');
    console.log('  npm run check:jsdoc -- -s    # Только staged файлы');
}

/**
 * Основная функция проверки
 */
function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

    let modeDescription;
    let filesToCheck = [];

    switch (options.mode) {
        case 'new':
            modeDescription = 'новых функций (сравнение с HEAD)';
            const changedFiles = getChangedFiles('diff');
            if (changedFiles.length === 0) {
                console.log('✅ Нет измененных JS файлов для проверки');
                return;
            }
            filesToCheck = changedFiles;
            break;

        case 'staged':
            modeDescription = 'staged файлов';
            const stagedFiles = getChangedFiles('staged');
            if (stagedFiles.length === 0) {
                console.log('✅ Нет staged JS файлов для проверки');
                return;
            }
            filesToCheck = stagedFiles;
            break;

        case 'full':
        default:
            modeDescription = 'всех функций';
            filesToCheck = getJSFiles('src');
            break;
    }

    console.log(`🔍 Проверка JSDoc комментариев: ${modeDescription}\n`);

    let totalErrors = 0;

    filesToCheck.forEach(file => {
        let errors;

        if (options.mode === 'new') {
            errors = getNewFunctionsInFile(file);
        } else {
            errors = checkFileForJSDoc(file);
        }

        if (errors.length > 0) {
            console.log(`❌ ${path.relative(process.cwd(), file)}:`);
            errors.forEach(error => {
                const prefix = options.mode === 'new' ? '   [НОВАЯ] ' : '   ';
                console.log(`${prefix}Строка ${error.line}: ${error.message}`);
                totalErrors++;
            });
            console.log('');
        }
    });

    if (totalErrors === 0) {
        console.log('✅ Все проверенные функции имеют JSDoc комментарии!');
    } else {
        console.log(`❌ Найдено ${totalErrors} функций без JSDoc комментариев`);
        console.log('\n💡 Добавьте JSDoc комментарии для всех функций:');
        console.log('/**');
        console.log(' * Описание функции');
        console.log(' * @param {type} paramName - Описание параметра');
        console.log(' * @returns {type} Описание возвращаемого значения');
        console.log(' */');
        process.exit(1);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = {
    getJSFiles,
    checkFileForJSDoc
};