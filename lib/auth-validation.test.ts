import { describe, expect, it } from "vitest";
import { validateSignUpForm } from "./auth-validation";

describe("validateSignUpForm", () => {
  it("accepts a complete signup form", () => {
    const result = validateSignUpForm({
      firstName: "Maria",
      lastName: "Romero",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        firstName: "Maria",
        lastName: "Romero",
        fullName: "Maria Romero",
        email: "maria@example.com",
        password: "secret123",
      },
    });
  });

  it("trims names and email before returning values", () => {
    const result = validateSignUpForm({
      firstName: "  Juan  ",
      lastName: "  Dela Cruz  ",
      email: "  Juan@Example.COM  ",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        firstName: "Juan",
        lastName: "Dela Cruz",
        fullName: "Juan Dela Cruz",
        email: "juan@example.com",
        password: "secret123",
      },
    });
  });

  it("rejects a blank first name", () => {
    const result = validateSignUpForm({
      firstName: " ",
      lastName: "Romero",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter your first name.",
    });
  });

  it("rejects a blank last name", () => {
    const result = validateSignUpForm({
      firstName: "Maria",
      lastName: " ",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter your last name.",
    });
  });

  it("rejects an invalid email", () => {
    const result = validateSignUpForm({
      firstName: "Maria",
      lastName: "Romero",
      email: "maria",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter a valid email address.",
    });
  });

  it("rejects a short password", () => {
    const result = validateSignUpForm({
      firstName: "Maria",
      lastName: "Romero",
      email: "maria@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result).toEqual({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  });

  it("rejects mismatched passwords", () => {
    const result = validateSignUpForm({
      firstName: "Maria",
      lastName: "Romero",
      email: "maria@example.com",
      password: "secret123",
      confirmPassword: "secret124",
    });

    expect(result).toEqual({
      ok: false,
      message: "Passwords do not match.",
    });
  });
});
