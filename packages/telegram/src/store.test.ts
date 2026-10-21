import { describe, expect, it } from "vitest";
import { MemoryBindingStore } from "./store.js";

describe("MemoryBindingStore", () => {
  it("stores and reads a binding", () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    expect(store.get(1)).toBe("p1");
    expect(store.get(2)).toBeUndefined();
  });

  it("lists the chats of a project", () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    store.set(2, "p1");
    store.set(3, "p2");
    expect(store.listForProject("p1").toSorted((a, b) => a - b)).toEqual([1, 2]);
    expect(store.listForProject("p2")).toEqual([3]);
    expect(store.listForProject("p3")).toEqual([]);
  });

  it("moves a chat between projects without leaving stale entries", () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    store.set(1, "p2");
    expect(store.get(1)).toBe("p2");
    expect(store.listForProject("p1")).toEqual([]);
    expect(store.listForProject("p2")).toEqual([1]);
  });

  it("removes a binding", () => {
    const store = new MemoryBindingStore();
    store.set(1, "p1");
    store.remove(1);
    expect(store.get(1)).toBeUndefined();
    expect(store.listForProject("p1")).toEqual([]);
  });

  it("tolerates removing an unbound chat", () => {
    const store = new MemoryBindingStore();
    expect(() => store.remove(42)).not.toThrow();
  });
});
