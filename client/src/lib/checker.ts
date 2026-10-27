export type CheckerInput = {
  relationSchema: string;
  decompositions: string;
  functionalDependencies: string;
};

export type TableauCell = { value: string; distinguished: boolean; changed?: boolean };
export type TableauRow = { relation: string; cells: TableauCell[] };
export type CheckerStep = {
  index: number;
  title: string;
  description: string;
  dependency?: string;
  changedCells: string[];
  rows: TableauRow[];
};
export type CheckerResult = {
  ok: boolean;
  errors: string[];
  relationAttributes: string[];
  relations: { name: string; attributes: string[] }[];
  dependencies: { lhs: string[]; rhs: string[]; label: string }[];
  lossless: boolean;
  verdict: "Lossless join" | "Potentially lossy" | "Invalid input";
  summary: string;
  steps: CheckerStep[];
  complexity: string;
  iterations: number;
};

export type HistoryItem = {
  id: number | string;
  relationSchema: string;
  decompositions: string;
  functionalDependencies: string;
  verdict: string;
  summary: string;
  result: CheckerResult;
  createdAt: string;
};

export const SAMPLE_CASES = [
  { id: "student-course", label: "Student · Course", description: "A common classroom decomposition where course code determines its department.", input: { relationSchema: "STUDENT, COURSE, DEPT", decompositions: "R1(STUDENT, COURSE)\nR2(COURSE, DEPT)", functionalDependencies: "COURSE -> DEPT" } },
  { id: "employee-project", label: "Employee · Project", description: "Project IDs determine the department that owns the project.", input: { relationSchema: "EMPLOYEE, PROJECT, DEPARTMENT", decompositions: "EP(EMPLOYEE, PROJECT)\nPD(PROJECT, DEPARTMENT)", functionalDependencies: "PROJECT -> DEPARTMENT" } },
  { id: "no-dependencies", label: "No dependencies", description: "The same decomposition without a useful dependency becomes lossy.", input: { relationSchema: "A, B, C", decompositions: "R1(A, B)\nR2(B, C)", functionalDependencies: "" } },
  { id: "supply-chain", label: "Supply chain", description: "A chained set of dependencies spreads preserved symbols across three relations.", input: { relationSchema: "SUPPLIER, PART, WAREHOUSE, REGION", decompositions: "SP(SUPPLIER, PART)\nPW(PART, WAREHOUSE)\nWR(WAREHOUSE, REGION)", functionalDependencies: "PART -> WAREHOUSE\nWAREHOUSE -> REGION" } },
  { id: "two-islands", label: "Two islands", description: "Disconnected relations show a clean potentially-lossy counterexample.", input: { relationSchema: "ORDER_ID, CUSTOMER, PRODUCT, CATEGORY", decompositions: "OC(ORDER_ID, CUSTOMER)\nPC(PRODUCT, CATEGORY)", functionalDependencies: "ORDER_ID -> CUSTOMER\nPRODUCT -> CATEGORY" }, },
] as const;

export const defaultInput: CheckerInput = {
  relationSchema: "STUDENT, COURSE, DEPT",
  decompositions: "R1(STUDENT, COURSE)\nR2(COURSE, DEPT)",
  functionalDependencies: "COURSE -> DEPT",
};

export const HISTORY_KEY = "lossless-join-lab-history";

export function loadLocalHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveLocalHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
}

export function buildReport(input: CheckerInput, result: CheckerResult) {
  const rows = result.steps.at(-1)?.rows ?? [];
  const header = `# Lossless Join Lab report\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
  const body = [
    `## Verdict: ${result.verdict}`,
    result.summary,
    "",
    "## Input",
    `- Original relation: ${input.relationSchema}`,
    `- Decompositions:\n${input.decompositions.split("\\n").map(line => `  - ${line}`).join("\\n")}`,
    `- Functional dependencies:\n${input.functionalDependencies ? input.functionalDependencies.split("\\n").map(line => `  - ${line}`).join("\\n") : "  - None supplied"}`,
    "",
    "## Final tableau",
    `| Relation | ${result.relationAttributes.join(" | ")} |`,
    `| --- | ${result.relationAttributes.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.relation} | ${row.cells.map(cell => cell.value).join(" | ")} |`),
    "",
    "## Step summary",
    ...result.steps.map(step => `${step.index + 1}. **${step.title}** — ${step.description}`),
    "",
    `**Complexity:** ${result.complexity}`,
  ].join("\n");
  return `${header}${body}\n`;
}

export function downloadReport(input: CheckerInput, result: CheckerResult) {
  const blob = new Blob([buildReport(input, result)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lossless-join-report.md";
  anchor.click();
  URL.revokeObjectURL(url);
}
