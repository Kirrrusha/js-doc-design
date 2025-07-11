/**
 * Скрипт для проверки наличия JSDoc комментариев
 * @description Проверяет все функции и хуки на наличие JSDoc документации
 * Поддерживает режимы: полная проверка и проверка только новых функций
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Интерфейс для ошибки JSDoc
 */
interface JSDocError {
    /** Путь к файлу */
    file: string;
    /** Номер строки */
    line: number;
    /** Имя функции */
    function: string;
    /** Сообщение об ошибке */
    message: string;
}

/**
 * Интерфейс для опций командной строки
 */
interface ParsedOptions {
    /** Режим проверки */
    mode: 'full' | 'new' | 'staged';
    /** Показать справку */
    help: boolean;
}

/**
 * Рекурсивно получает все TS/JS файлы в директории
 * @param dir - Директория для поиска
 * @param fileList - Массив для накопления файлов
 * @returns Массив путей к TS/JS файлам
 */
function getTSFiles(dir: string, fileList: string[] = []): string[] {
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
}

/**
 * Проверяет файл на наличие функций без JSDoc
 * @param filePath - Путь к файлу
 * @returns Массив ошибок
 */
function checkFileForJSDoc(filePath: string): JSDocError[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors: JSDocError[] = [];
    const lines = content.split('\n');

    // Поиск функций без JSDoc (поддержка TypeScript и JavaScript)
    const functionRegex = /(?:^|\n)\s*(?:export\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match: RegExpExecArray | null;
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
 * @param mode - Режим: 'staged' для staged файлов, 'diff' для измененных
 * @returns Массив путей к измененным TS/JS файлам
 */
function getChangedFiles(mode: 'staged' | 'diff' = 'staged'): string[] {
    try {
        let command: string;
        if (mode === 'staged') {
            command = 'git diff --cached --name-only --diff-filter=AM';
        } else {
            command = 'git diff --name-only --diff-filter=AM HEAD~1';
        }

        const output = execSync(command, { encoding: 'utf8' });
        return output.split('\n')
            .filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file.startsWith('src/'))
            .map(file => file.trim())
            .filter(file => file.length > 0);
    } catch (error) {
        console.warn('⚠️  Не удалось получить список измененных файлов из Git');
        return [];
    }
}

/**
 * Получает новые функции в измененных файлах
 * @param filePath - Путь к файлу
 * @returns Массив новых функций
 */
function getNewFunctionsInFile(filePath: string): JSDocError[] {
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
        console.warn(`⚠️  Ошибка при анализе изменений в файле ${filePath}:`, (error as Error).message);
        return checkFileForJSDoc(filePath);
    }
}

/**
 * Извлекает имена функций из содержимого файла
 * @param content - Содержимое файла
 * @returns Массив имен функций
 */
function extractFunctionNames(content: string): string[] {
    const functionNames: string[] = [];
    const functionRegex = /(?:^|\n)\s*(?:export\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g;

    let match: RegExpExecArray | null;
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
 * @returns Объект с параметрами
 */
function parseArgs(): ParsedOptions {
    const args = process.argv.slice(2);
    const options: ParsedOptions = {
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
function showHelp(): void {
    console.log('🔍 Скрипт проверки JSDoc комментариев\n');
    console.log('Использование:');
    console.log('  npm run check:jsdoc [опции]\n');
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
function main(): void {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

    let modeDescription: string;
    let filesToCheck: string[] = [];

    switch (options.mode) {
        case 'new':
            modeDescription = 'новых функций (сравнение с HEAD)';
            const changedFiles = getChangedFiles('diff');
            if (changedFiles.length === 0) {
                console.log('✅ Нет измененных TS/JS файлов для проверки');
                return;
            }
            filesToCheck = changedFiles;
            break;

        case 'staged':
            modeDescription = 'staged файлов';
            const stagedFiles = getChangedFiles('staged');
            if (stagedFiles.length === 0) {
                console.log('✅ Нет staged TS/JS файлов для проверки');
                return;
            }
            filesToCheck = stagedFiles;
            break;

        case 'full':
        default:
            modeDescription = 'всех функций';
            filesToCheck = getTSFiles('src');
            break;
    }

    console.log(`🔍 Проверка JSDoc комментариев: ${modeDescription}\n`);

    let totalErrors = 0;

    filesToCheck.forEach(file => {
        let errors: JSDocError[];

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
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    getTSFiles,
    checkFileForJSDoc,
    JSDocError,
    ParsedOptions
};