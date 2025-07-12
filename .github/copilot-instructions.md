# JSDoc Design Project - AI Coding Agent Instructions

## Project Overview
Система автоматизации JSDoc документации с принудительным контролем через ESLint. Проект демонстрирует полный цикл: от создания кастомных правил линтинга до автоматической генерации документации.

## Core Architecture

### 1. Custom ESLint Plugin System
- **Location**: `eslint-plugins/jsdoc-required.js`
- **Pattern**: Standalone plugin that exports rules object with AST node visitors
- **Key Logic**: Distinguishes between named functions, React hooks (functions starting with `use`), and anonymous callbacks
- **Integration**: Loaded as local plugin in `.eslintrc.js` using `require()` instead of npm package

```javascript
// Local plugin registration pattern:
plugins: [
    {
        'jsdoc-required': require('./eslint-plugins/jsdoc-required')
    }
]
```

### 2. Documentation Generation Pipeline
- **Entry Point**: `scripts/generate-docs.js`
- **Parser**: Uses `doctrine` library for JSDoc AST parsing
- **Target Pattern**: Finds JSDoc comments followed by function declarations using regex
- **Output**: Updates README.md sections automatically
- **File Discovery**: Uses `glob` package to scan `src/**/*.js` files

### 3. JSDoc Standards
**Required Format** for all named functions and React hooks:
```javascript
/**
 * Brief description
 * @param {type} paramName - Description
 * @returns {type} Description
 * @example
 * const result = functionName(arg);
 */
```

## Development Workflow

### Linting Commands
```bash
npm run lint          # Check JSDoc compliance
npm run lint:fix      # Auto-fix ESLint issues (won't add missing JSDoc)
```

### Documentation Commands
```bash
npm run docs:generate # Parse JSDoc → update README.md
```

### Testing ESLint Rules
Use `src/test-without-jsdoc.js` as test file - intentionally missing JSDoc to trigger errors.

## Project-Specific Patterns

### Function Detection Rules
1. **Named Functions**: `function functionName()` - JSDoc required
2. **React Hooks**: `const useSomething = ()` - JSDoc required
3. **Anonymous Functions**: `setTimeout(function() {})` - JSDoc ignored
4. **Variable Functions**: `const func = () => {}` - JSDoc required

### AST Navigation Pattern
ESLint rule uses `node.parent` to access variable declarator when checking arrow functions:
```javascript
// For: const myFunc = () => {}
// node = ArrowFunctionExpression
// node.parent = VariableDeclarator (contains function name)
```

### Documentation Extraction Regex
Key pattern in `generate-docs.js`:
```javascript
/\/\*\*([\s\S]*?)\*\/\s*(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>))/g
```

## Dependencies & Tools
- **doctrine**: JSDoc parsing library
- **glob**: File pattern matching
- **eslint**: Linting framework with custom plugin support
- No test framework (uses manual testing via lint errors)

## File Structure Logic
- `src/`: Source code requiring JSDoc
- `scripts/`: Automation tools for documentation generation
- `eslint-plugins/`: Custom linting rules
- `.eslintrc.js`: ESLint configuration with local plugin loading

## Common Pitfalls
1. ESLint plugin must be loaded locally, not via npm
2. JSDoc regex parsing is fragile - maintain exact spacing patterns
3. Arrow functions need parent node inspection for name detection
4. Anonymous functions in callbacks should be properly ignored by rules
