import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("resolves tailwind conflicts by keeping the last value", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("resolves conflicting text colors", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles falsy inputs", () => {
    expect(cn(null, undefined, false, "", 0)).toBe("");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("handles object inputs", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges complex tailwind classes correctly", () => {
    expect(cn("px-2 py-1 bg-red-500", "bg-blue-500 py-3")).toBe(
      "px-2 bg-blue-500 py-3"
    );
  });
});
