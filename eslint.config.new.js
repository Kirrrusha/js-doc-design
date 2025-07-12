import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jsdocPlugin from "./eslint-plugins/jsdoc-required.js";

export default [
    js.configs.recommended,
    {
        ignores: ['dist/**', 'node_modules/**', '**/*.d.ts']
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json'
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'jsdoc-required': jsdocPlugin
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'no-unused-vars': 'off',
            'no-case-declarations': 'off',
            'jsdoc-required/require-jsdoc': ['error', { mode: 'new' }]
        }
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                global: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                require: 'readonly'
            }
        },
        plugins: {
            'jsdoc-required': jsdocPlugin
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-case-declarations': 'off',
            'jsdoc-required/require-jsdoc': ['error', { mode: 'new' }]
        }
    }
];