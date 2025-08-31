import { describe, expect, it } from "vitest";
import { add, createUser, greetUser, processArray, type User } from "../index";

describe("Основные функции", () => {
  describe("greetUser", () => {
    it("должна возвращать приветствие с именем", () => {
      const result = greetUser("Иван");
      expect(result).toBe("Привет, Иван!");
    });

    it("должна работать с пустой строкой", () => {
      const result = greetUser("");
      expect(result).toBe("Привет, !");
    });

    it("должна работать с именами на разных языках", () => {
      expect(greetUser("John")).toBe("Привет, John!");
      expect(greetUser("José")).toBe("Привет, José!");
      expect(greetUser("李明")).toBe("Привет, 李明!");
    });
  });

  describe("add", () => {
    it("должна складывать положительные числа", () => {
      expect(add(2, 3)).toBe(5);
      expect(add(10, 15)).toBe(25);
    });

    it("должна работать с отрицательными числами", () => {
      expect(add(-5, 3)).toBe(-2);
      expect(add(-10, -5)).toBe(-15);
    });

    it("должна работать с нулем", () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });

    it("должна работать с дробными числами", () => {
      expect(add(1.5, 2.5)).toBe(4);
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe("createUser", () => {
    it("должна создавать пользователя с корректными данными", () => {
      const user = createUser("Иван", 25);
      expect(user).toEqual({
        name: "Иван",
        age: 25,
      });
    });

    it("должна создавать пользователя с email", () => {
      const user = createUser("Иван", 25, "ivan@example.com");
      expect(user).toEqual({
        name: "Иван",
        age: 25,
        email: "ivan@example.com",
      });
    });

    it("должна работать с граничными значениями возраста", () => {
      const youngUser = createUser("Молодой", 0);
      const oldUser = createUser("Старый", 150);
      expect(youngUser.age).toBe(0);
      expect(oldUser.age).toBe(150);
    });

    it("должна работать с пустым именем", () => {
      const user = createUser("", 25);
      expect(user.name).toBe("");
      expect(user.age).toBe(25);
    });

    it("должна соответствовать интерфейсу User", () => {
      const user: User = createUser("Тест", 30, "test@example.com");
      expect(user.name).toBe("Тест");
      expect(user.age).toBe(30);
      expect(user.email).toBe("test@example.com");
    });
  });

  describe("processArray", () => {
    it("должна обрабатывать массив чисел с функцией удвоения", () => {
      const result = processArray([1, 2, 3, 4, 5], (x) => x * 2);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it("должна работать с пустым массивом", () => {
      const result = processArray([], (x) => x * 2);
      expect(result).toEqual([]);
    });

    it("должна работать с отрицательными числами", () => {
      const result = processArray([-1, -2, -3], (x) => x * 2);
      expect(result).toEqual([-2, -4, -6]);
    });

    it("должна работать с нулем", () => {
      const result = processArray([0, 1, 0, 2], (x) => x * 2);
      expect(result).toEqual([0, 2, 0, 4]);
    });

    it("должна работать с дробными числами", () => {
      const result = processArray([1.5, 2.5, 3.5], (x) => x * 2);
      expect(result).toEqual([3, 5, 7]);
    });

    it("должна работать с одним элементом", () => {
      const result = processArray([5], (x) => x * 2);
      expect(result).toEqual([10]);
    });

    it("должна работать с разными функциями обработки", () => {
      const numbers = [1, 2, 3, 4, 5];

      const squared = processArray(numbers, (x) => x * x);
      expect(squared).toEqual([1, 4, 9, 16, 25]);

      const strings = processArray(numbers, (x) => `число ${x}`);
      expect(strings).toEqual([
        "число 1",
        "число 2",
        "число 3",
        "число 4",
        "число 5",
      ]);

      const isEven = processArray(numbers, (x) => x % 2 === 0);
      expect(isEven).toEqual([false, true, false, true, false]);
    });

    it("должна работать с объектами", () => {
      const users = [
        { name: "Иван", age: 25 },
        { name: "Петр", age: 30 },
        { name: "Мария", age: 28 },
      ];

      const names = processArray(users, (user) => user.name);
      expect(names).toEqual(["Иван", "Петр", "Мария"]);

      const ages = processArray(users, (user) => user.age);
      expect(ages).toEqual([25, 30, 28]);
    });
  });
});
