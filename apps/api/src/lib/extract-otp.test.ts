import { describe, expect, it } from "vitest";
import { extractOtp } from "./extract-otp";

describe("extractOtp", () => {
  it("reads an emphasized code", () => {
    expect(extractOtp("<p>Your code is <strong>123456</strong>.</p>")).toBe("123456");
  });

  it("reads a labelled code", () => {
    expect(extractOtp("OTP: 654321")).toBe("654321");
    expect(extractOtp("Your code is 111222")).toBe("111222");
    expect(extractOtp("Codigo: 000123")).toBe("000123");
  });

  it("reads a standalone code", () => {
    expect(extractOtp("Use 987654 to sign in")).toBe("987654");
  });

  it("prefers the labelled code over an unrelated number", () => {
    expect(extractOtp("Ref 445566. OTP: 223344")).toBe("223344");
  });

  it("does not match digits glued to other characters", () => {
    expect(extractOtp("order-1234567")).toBeNull();
    expect(extractOtp("abc123456def")).toBeNull();
  });

  it("does not false-positive on ordinary numbers", () => {
    expect(extractOtp("Total due: $45000 for 2026")).toBeNull();
    expect(extractOtp("Call +34 600123456 now")).toBeNull();
    expect(extractOtp("2026-10-21T18:00:00Z")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractOtp("")).toBeNull();
    expect(extractOtp("no code here")).toBeNull();
  });
});
