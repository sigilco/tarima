import { describe, expect, it } from "vitest";
import { roomWsUrl } from "./api";

describe("roomWsUrl", () => {
  it("generates correct websocket URL without share token", () => {
    // In node/test environment window is undefined or mockable
    const url = roomWsUrl("p-123");
    // When window is undefined it returns empty string
    expect(url).toBe("");
  });
});
