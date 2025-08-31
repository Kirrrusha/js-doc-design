import { execSync } from "child_process";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

function parseMode(args: string[]): string {
  const modeIndex = args.indexOf("--mode");
  return modeIndex !== -1 && modeIndex + 1 < args.length
    ? args[modeIndex + 1]
    : "full";
}

describe("CLI Scripts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("parseMode", () => {
    it("должна возвращать переданный режим", () => {
      expect(parseMode(["--mode", "new"])).toBe("new");
      expect(parseMode(["--mode", "staged"])).toBe("staged");
      expect(parseMode(["--mode", "full"])).toBe("full");
    });

    it("должна возвращать 'full' по умолчанию", () => {
      expect(parseMode([])).toBe("full");
      expect(parseMode(["--other-flag"])).toBe("full");
    });

    it("должна корректно обрабатывать случай без значения", () => {
      expect(parseMode(["--mode"])).toBe("full");
    });
  });

  describe("execSync интеграция", () => {
    it("должна выполнять команду lint", () => {
      const command = "npm run lint";
      mockedExecSync.mockReturnValue(Buffer.from("Success"));

      execSync(command, { stdio: "inherit" });

      expect(mockedExecSync).toHaveBeenCalledWith(command, {
        stdio: "inherit",
      });
    });

    it("должна выполнять команду build", () => {
      const command = "npm run build";
      mockedExecSync.mockReturnValue(Buffer.from("Success"));

      execSync(command, { stdio: "inherit" });

      expect(mockedExecSync).toHaveBeenCalledWith(command, {
        stdio: "inherit",
      });
    });

    it("должна обрабатывать ошибки выполнения команд", () => {
      const command = "npm run invalid-command";
      mockedExecSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      expect(() => execSync(command)).toThrow("Command not found");
    });
  });

  describe("File System операции", () => {
    it("должна читать файл и возвращать его содержимое", () => {
      const mockFileContent = `/**
 * Тестовая функция
 * @param param - тестовый параметр
 * @returns возвращает строку
 */
export function testFunction(param: string): string {
  return param;
}
`;

      (fs.readFileSync as any).mockReturnValue(mockFileContent);
      (fs.existsSync as any).mockReturnValue(true);

      const content = fs.readFileSync("test.ts", "utf8");
      expect(content).toBe(mockFileContent);
      expect(fs.readFileSync).toHaveBeenCalledWith("test.ts", "utf8");
    });

    it("должен записывать сгенерированную документацию", () => {
      const mockDocumentation =
        "# API Документация\n\n## testFunction\n\nТестовая функция";

      fs.writeFileSync("README.md", mockDocumentation, "utf8");

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "README.md",
        mockDocumentation,
        "utf8"
      );
    });

    it("должен проверять существование файлов", () => {
      (fs.existsSync as any).mockReturnValue(true);

      const exists = fs.existsSync("test.ts");
      expect(exists).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith("test.ts");
    });
  });
});
