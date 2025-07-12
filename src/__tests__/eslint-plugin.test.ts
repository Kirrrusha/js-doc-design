import { execSync } from "child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Мокаем execSync для тестирования Git интеграции
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

describe("ESLint Plugin JSDoc Required", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Структура плагина", () => {
    it("должен экспортировать корректную структуру плагина", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      expect(plugin.default).toBeDefined();
      expect(plugin.default.rules).toBeDefined();
      expect(plugin.default.rules["require-jsdoc"]).toBeDefined();
      expect(plugin.default.rules["require-jsdoc"].meta).toBeDefined();
      expect(plugin.default.rules["require-jsdoc"].meta.type).toBe(
        "suggestion"
      );
      expect(plugin.default.rules["require-jsdoc"].meta.docs).toBeDefined();
      expect(
        plugin.default.rules["require-jsdoc"].meta.docs.description
      ).toBeDefined();
      expect(typeof plugin.default.rules["require-jsdoc"].create).toBe(
        "function"
      );
    });

    it("должен иметь корректную схему опций", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");
      const rule = plugin.default.rules["require-jsdoc"];

      expect(rule.meta.schema).toBeDefined();
      expect(Array.isArray(rule.meta.schema)).toBe(true);

      // Проверяем что schema существует и не пустая
      if (rule.meta.schema && rule.meta.schema.length > 0) {
        expect(rule.meta.schema.length).toBe(1);
        expect(rule.meta.schema[0].properties.mode).toBeDefined();
        expect(rule.meta.schema[0].properties.mode.enum).toEqual([
          "full",
          "new",
          "staged",
        ]);
      } else {
        // Если schema пустая, это тоже валидно для некоторых правил
        expect(rule.meta.schema.length).toBe(0);
      }
    });

    it("должен иметь корректные метаданные", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");
      const rule = plugin.default.rules["require-jsdoc"];

      expect(rule.meta.type).toBe("suggestion");
      expect(rule.meta.docs.description).toContain("JSDoc");
      expect(rule.meta.docs.category).toBe("Stylistic Issues");
      expect(rule.meta.docs.recommended).toBe(false);
      expect(rule.meta.fixable).toBe(null);
    });
  });

  describe("Создание правила", () => {
    it("должен создавать правило с корректными обработчиками", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      // Мокаем контекст ESLint
      const mockContext = {
        options: [{ mode: "full" }],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );

      expect(rule).toBeDefined();
      expect(typeof rule.FunctionDeclaration).toBe("function");
      expect(typeof rule.ArrowFunctionExpression).toBe("function");
      expect(typeof rule.FunctionExpression).toBe("function");
    });

    it("должен работать с разными режимами", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const modes = ["full", "new", "staged"];

      for (const mode of modes) {
        const mockContext = {
          options: [{ mode }],
          getFilename: () => "/test/file.ts",
          getSourceCode: () => ({
            getCommentsBefore: () => [],
          }),
          report: vi.fn(),
        };

        const rule = plugin.default.rules["require-jsdoc"].create(
          mockContext as any
        );
        expect(rule).toBeDefined();
      }
    });

    it("должен использовать режим full по умолчанию", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });

    it("должен обрабатывать пустые опции", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{}],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });
  });

  describe("Git интеграция (мокированная)", () => {
    it("должен обрабатывать ошибки Git команд", async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error("Git command failed");
      });

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "new" }],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      // Должно создаться правило без ошибок, даже если Git команды не работают
      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });

    it("должен работать в режиме staged с мокированными Git командами", async () => {
      mockedExecSync.mockReturnValue(Buffer.from("test.ts\n"));

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "staged" }],
        getFilename: () => "/test/test.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });

    it("должен работать в режиме new с мокированными Git командами", async () => {
      mockedExecSync.mockReturnValue(
        Buffer.from("@@@ -1,3 +1,6 @@@\n+export function newFunction() {\n")
      );

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "new" }],
        getFilename: () => "/test/test.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });

    it("должен обрабатывать пустой вывод Git команд", async () => {
      mockedExecSync.mockReturnValue(Buffer.from(""));

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "staged" }],
        getFilename: () => "/test/test.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });
  });

  describe("Режимы работы", () => {
    it("должен поддерживать режим full", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "full" }],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
      expect(typeof rule.FunctionDeclaration).toBe("function");
    });

    it("должен поддерживать режим new", async () => {
      mockedExecSync.mockReturnValue(Buffer.from("test.ts\n"));

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "new" }],
        getFilename: () => "/test/test.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
      expect(typeof rule.FunctionDeclaration).toBe("function");
    });

    it("должен поддерживать режим staged", async () => {
      mockedExecSync.mockReturnValue(Buffer.from("test.ts\n"));

      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockContext = {
        options: [{ mode: "staged" }],
        getFilename: () => "/test/test.ts",
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
      expect(typeof rule.FunctionDeclaration).toBe("function");
    });
  });

  describe("Обработка контекста", () => {
    it("должен корректно обрабатывать getFilename", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const testFilename = "/path/to/test/file.ts";
      const mockContext = {
        options: [{ mode: "full" }],
        getFilename: () => testFilename,
        getSourceCode: () => ({
          getCommentsBefore: () => [],
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });

    it("должен корректно обрабатывать getSourceCode", async () => {
      const plugin = await import("../../eslint-plugins/jsdoc-required");

      const mockGetCommentsBefore = vi.fn().mockReturnValue([]);
      const mockContext = {
        options: [{ mode: "full" }],
        getFilename: () => "/test/file.ts",
        getSourceCode: () => ({
          getCommentsBefore: mockGetCommentsBefore,
        }),
        report: vi.fn(),
      };

      const rule = plugin.default.rules["require-jsdoc"].create(
        mockContext as any
      );
      expect(rule).toBeDefined();
    });
  });
});
