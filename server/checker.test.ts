import { describe, expect, it } from "vitest";
import { analyzeLosslessJoin } from "./checker";

describe("lossless join checker", () => {
  it("finds a full distinguished row for a lossless decomposition", () => {
    const result = analyzeLosslessJoin({
      relationSchema: "A, B, C",
      decompositions: "R1(A, B)\nR2(B, C)",
      functionalDependencies: "B -> C",
    });
    expect(result.ok).toBe(true);
    expect(result.lossless).toBe(true);
    expect(result.steps.at(-1)?.rows.some(row => row.cells.every(cell => cell.distinguished))).toBe(true);
  });

  it("stops at a fixed point when no dependency can close a row", () => {
    const result = analyzeLosslessJoin({
      relationSchema: "A, B, C",
      decompositions: "R1(A, B)\nR2(B, C)",
      functionalDependencies: "",
    });
    expect(result.ok).toBe(true);
    expect(result.lossless).toBe(false);
    expect(result.verdict).toBe("Potentially lossy");
  });

  it("rejects attributes that are not in the original relation", () => {
    const result = analyzeLosslessJoin({
      relationSchema: "A, B",
      decompositions: "R1(A, C)\nR2(B)",
      functionalDependencies: "A -> B",
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("original relation");
  });
});
