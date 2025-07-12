/**
 * ESLint плагин для обязательного JSDoc
 * @description Проверяет наличие JSDoc комментариев для функций и хуков
 */

export default {
  rules: {
    "require-jsdoc": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Требует JSDoc комментарии для функций и хуков",
          category: "Stylistic Issues",
          recommended: false,
        },
        fixable: null,
        schema: [
          {
            type: "object",
            properties: {
              mode: {
                type: "string",
                enum: ["full", "new", "staged"],
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        /**
         * Проверяет, есть ли JSDoc комментарий перед узлом
         * @param {Object} node - AST узел
         * @returns {boolean} true если JSDoc найден
         */
        function hasJSDocComment(node) {
          const sourceCode = context.getSourceCode();
          const comments = sourceCode.getCommentsBefore(node);

          return comments.some(
            (comment) =>
              comment.type === "Block" && comment.value.startsWith("*")
          );
        }

        /**
         * Проверяет, является ли функция React хуком
         * @param {Object} node - AST узел функции
         * @returns {boolean} true если это хук
         */
        function isReactHook(node) {
          if (node.type === "FunctionDeclaration" && node.id) {
            return node.id.name.startsWith("use");
          }
          if (node.type === "VariableDeclarator" && node.id && node.id.name) {
            return node.id.name.startsWith("use");
          }
          return false;
        }

        /**
         * Проверяет узел функции на наличие JSDoc
         * @param {Object} node - AST узел функции
         */
        function checkFunction(node) {
          // Пропускаем анонимные функции и стрелочные функции в выражениях
          if (
            node.type === "ArrowFunctionExpression" &&
            node.parent.type !== "VariableDeclarator"
          ) {
            return;
          }

          // Проверяем обычные функции и хуки
          const isHook = isReactHook(node.parent || node);
          const isNamedFunction =
            node.type === "FunctionDeclaration" ||
            (node.type === "ArrowFunctionExpression" &&
              node.parent.type === "VariableDeclarator");

          if (isNamedFunction || isHook) {
            if (!hasJSDocComment(node.parent || node)) {
              const functionName =
                node.id?.name || node.parent?.id?.name || "функция";
              context.report({
                node: node,
                message: `Функция "${functionName}" должна иметь JSDoc комментарий`,
              });
            }
          }
        }

        return {
          FunctionDeclaration: checkFunction,
          ArrowFunctionExpression: checkFunction,
          FunctionExpression: checkFunction,
        };
      },
    },
  },
};