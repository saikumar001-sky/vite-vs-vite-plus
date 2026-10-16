import { describe, expect, it } from "vite-plus/test";

describe("Counter", () => {
  it("should increment the counter", () => {
    let counter = 0;
    counter++;
    expect(counter).toBe(1);
  });

  it("should decrement the counter", () => {
    let counter = 1;
    counter--;
    expect(counter).toBe(0);
  });
});
