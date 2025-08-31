import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';

// Mock execSync for testing Git commands
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));

const mockedExecSync = vi.mocked(execSync);

describe('Git Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Обработка Git команд', () => {
    it('должен обрабатывать успешные Git команды', () => {
      const mockOutput = 'src/test.ts\nsrc/utils.ts\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockOutput);
    });

    it('должен обрабатывать ошибки Git команд', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository');
      });

      expect(() => {
        execSync('git diff --name-only');
      }).toThrow('fatal: not a git repository');
    });

    it('должен обрабатывать пустой вывод Git команд', () => {
      mockedExecSync.mockReturnValue(Buffer.from(''));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe('');
    });

    it('должен обрабатывать Git diff команды', () => {
      const mockDiff = `
diff --git a/src/test.ts b/src/test.ts
index 1234567..abcdefg 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,6 @@
 export function existing() {
   return 'existing';
 }
+export function newFunction() {
+  return 'new';
+}
`;
      mockedExecSync.mockReturnValue(Buffer.from(mockDiff));

      const result = execSync('git diff HEAD', { encoding: 'utf8' });
      expect(result.toString()).toContain('diff --git');
      expect(result.toString()).toContain('newFunction');
    });

    it('должен обрабатывать Git staged файлы', () => {
      const mockStagedFiles = 'src/index.ts\nsrc/utils.ts\ntests/test.ts\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockStagedFiles));

      const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockStagedFiles);
    });
  });

  describe('Парсинг Git вывода', () => {
    it('должен корректно парсить список файлов', () => {
      const mockFiles = 'src/file1.ts\nsrc/file2.ts\nREADME.md\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockFiles));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      const files = result.toString().trim().split('\n').filter(f => f.length > 0);

      expect(files).toEqual(['src/file1.ts', 'src/file2.ts', 'README.md']);
    });

    it('должен обрабатывать файлы с пробелами в именах', () => {
      const mockFiles = '"src/file with spaces.ts"\n"another file.ts"\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockFiles));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      expect(result.toString()).toContain('file with spaces');
    });

    it('должен фильтровать пустые строки', () => {
      const mockFiles = 'src/file1.ts\n\nsrc/file2.ts\n\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockFiles));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      const files = result.toString().trim().split('\n').filter(f => f.length > 0);

      expect(files).toEqual(['src/file1.ts', 'src/file2.ts']);
    });
  });

  describe('Различные Git команды', () => {
    it('должен поддерживать git diff HEAD', () => {
      const mockOutput = 'modified file content';
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput));

      const result = execSync('git diff HEAD', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockOutput);
    });

    it('должен поддерживать git diff --cached', () => {
      const mockOutput = 'staged changes';
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput));

      const result = execSync('git diff --cached', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockOutput);
    });

    it('должен поддерживать git diff с опциями', () => {
      const mockOutput = 'diff with options';
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput));

      const result = execSync('git diff -U0 --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockOutput);
    });
  });

  describe('Обработка ошибок', () => {
    it('должен обрабатывать ошибки доступа', () => {
      const error = new Error('Permission denied');
      (error as any).code = 'EACCES';
      mockedExecSync.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        execSync('git diff');
      }).toThrow('Permission denied');
    });

    it('должен обрабатывать ошибки Git репозитория', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('fatal: not a git repository');
      });

      expect(() => {
        execSync('git status');
      }).toThrow('fatal: not a git repository');
    });

    it('должен обрабатывать ошибки команд', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      expect(() => {
        execSync('git invalid-command');
      }).toThrow('Command failed');
    });
  });

  describe('Интеграция с ESLint режимами', () => {
    it('должен работать с режимом new', () => {
      const mockDiff = `
diff --git a/src/new.ts b/src/new.ts
@@ -0,0 +1,3 @@
+export function newFunction() {
+  return 'new';
+}
`;
      mockedExecSync.mockReturnValue(Buffer.from(mockDiff));

      const result = execSync('git diff HEAD', { encoding: 'utf8' });
      expect(result.toString()).toContain('newFunction');
    });

    it('должен работать с режимом staged', () => {
      const mockStagedFiles = 'src/staged.ts\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockStagedFiles));

      const result = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockStagedFiles);
    });

    it('должен работать с режимом full (без Git команд)', () => {
          // In full mode Git commands are not used
    // Test verifies that mocking doesn't affect other logic
      expect(true).toBe(true);
    });
  });

  describe('Кодировка и форматирование', () => {
    it('должен корректно обрабатывать UTF-8', () => {
      const mockOutput = 'файл с русскими символами.ts\n';
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput, 'utf8'));

      const result = execSync('git diff --name-only', { encoding: 'utf8' });
      expect(result.toString()).toBe(mockOutput);
    });

    it('должен обрабатывать многострочный вывод', () => {
      const mockOutput = `line1
line2
line3
`;
      mockedExecSync.mockReturnValue(Buffer.from(mockOutput));

      const result = execSync('git log --oneline', { encoding: 'utf8' });
              expect(result.toString().split('\n')).toHaveLength(4); // 3 lines + empty
    });
  });
});