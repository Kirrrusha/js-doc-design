/**
 * ESLint плагин для обязательного JSDoc
 * @description Проверяет наличие JSDoc комментариев для функций и хуков
 */

import { Rule } from 'eslint';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Интерфейс для комментария
 */
interface Comment {
    type: 'Block' | 'Line';
    value: string;
}

/**
 * Интерфейс для опций правила
 */
interface RuleOptions {
    mode?: 'full' | 'new' | 'staged';
}

const plugin = {
    rules: {
        'require-jsdoc': {
            meta: {
                type: 'suggestion' as const,
                docs: {
                    description: 'Требует JSDoc комментарии для функций и хуков',
                    category: 'Stylistic Issues',
                    recommended: false
                },
                fixable: null,
                schema: [
                    {
                        type: 'object',
                        properties: {
                            mode: {
                                type: 'string',
                                enum: ['full', 'new', 'staged']
                            }
                        },
                        additionalProperties: false
                    }
                ]
            },
            create(context: Rule.RuleContext): Rule.RuleListener {
                const options: RuleOptions = context.options[0] || {};
                const mode = options.mode || 'full';

                /**
                 * Получает список измененных файлов из Git
                 * @param staged - проверять staged файлы или все измененные
                 * @returns массив путей к файлам
                 */
                function getChangedFiles(staged: boolean = false): string[] {
                    try {
                        const command = staged ? 'git diff --cached --name-only' : 'git diff HEAD --name-only';
                        const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
                        return output.trim().split('\n').filter(file => file.length > 0);
                    } catch {
                        return [];
                    }
                }

                /**
                 * Получает новые функции из Git diff
                 * @param filePath - путь к файлу
                 * @param staged - проверять staged изменения
                 * @returns массив номеров строк с новыми функциями
                 */
                function getNewFunctionLines(filePath: string, staged: boolean = false): number[] {
                    try {
                        const command = staged ?
                            `git diff --cached -U0 "${filePath}"` :
                            `git diff HEAD -U0 "${filePath}"`;
                        const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });

                        const newLines: number[] = [];
                        const lines = output.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('@@')) {
                                const match = line.match(/\+(\d+),?(\d+)?/);
                                if (match) {
                                    const startLine = parseInt(match[1]);
                                    const count = match[2] ? parseInt(match[2]) : 1;
                                    for (let i = 0; i < count; i++) {
                                        newLines.push(startLine + i);
                                    }
                                }
                            }
                        }

                        return newLines;
                    } catch {
                        return [];
                    }
                }

                /**
                 * Проверяет, нужно ли проверять данный файл и функцию
                 * @param node - AST узел
                 * @returns true если нужно проверять
                 */
                function shouldCheckFunction(node: any): boolean {
                    if (mode === 'full') {
                        return true;
                    }

                    const filename = context.getFilename();
                    const relativePath = path.relative(process.cwd(), filename);

                    if (mode === 'staged') {
                        const stagedFiles = getChangedFiles(true);
                        if (!stagedFiles.includes(relativePath)) {
                            return false;
                        }

                        const newLines = getNewFunctionLines(relativePath, true);
                        const nodeLocation = node.loc?.start?.line || 0;
                        return newLines.includes(nodeLocation);
                    }

                    if (mode === 'new') {
                        const changedFiles = getChangedFiles(false);
                        if (!changedFiles.includes(relativePath)) {
                            return false;
                        }

                        const newLines = getNewFunctionLines(relativePath, false);
                        const nodeLocation = node.loc?.start?.line || 0;
                        return newLines.includes(nodeLocation);
                    }

                    return true;
                }

                /**
                 * Проверяет, есть ли JSDoc комментарий перед узлом
                 * @param node - AST узел
                 * @returns true если JSDoc найден
                 */
                function hasJSDocComment(node: any): boolean {
                    const sourceCode = context.getSourceCode();
                    const comments = sourceCode.getCommentsBefore(node) as Comment[];

                    return comments.some(comment =>
                        comment.type === 'Block' && comment.value.startsWith('*')
                    );
                }
                /**
                 * Проверяет, является ли функция React хуком
                 * @param node - AST узел функции
                 * @returns true если это хук
                 */
                function isReactHook(node: any): boolean {
                    if (node.type === 'FunctionDeclaration' && node.id) {
                        return node.id.name.startsWith('use');
                    }
                    if (node.type === 'VariableDeclarator' && node.id && node.id.name) {
                        return node.id.name.startsWith('use');
                    }
                    return false;
                }

                /**
                 * Проверяет узел функции на наличие JSDoc
                 * @param node - AST узел функции
                 */
                function checkFunction(node: any): void {
                    if (node.type === 'ArrowFunctionExpression' &&
                        node.parent?.type !== 'VariableDeclarator') {
                        return;
                    }

                    if (!shouldCheckFunction(node)) {
                        return;
                    }

                    const isHook = isReactHook(node.parent || node);
                    const isNamedFunction = node.type === 'FunctionDeclaration' ||
                                          (node.type === 'ArrowFunctionExpression' &&
                                           node.parent?.type === 'VariableDeclarator');

                    if (isNamedFunction || isHook) {
                        if (!hasJSDocComment(node.parent || node)) {
                            const functionName = node.id?.name ||
                                                node.parent?.id?.name ||
                                                'функция';
                            const modeText = mode === 'new' ? ' (новая функция)' :
                                           mode === 'staged' ? ' (staged изменение)' : '';
                            context.report({
                                node: node,
                                message: `Функция "${functionName}" должна иметь JSDoc комментарий${modeText}`
                            });
                        }
                    }
                }

                return {
                    FunctionDeclaration: checkFunction,
                    ArrowFunctionExpression: checkFunction,
                    FunctionExpression: checkFunction
                };
            }
        }
    }
};

export default plugin;