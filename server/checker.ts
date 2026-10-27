export type CheckerInput = {
  relationSchema: string;
  decompositions: string;
  functionalDependencies: string;
};

export type ParsedRelation = { name: string; attributes: string[] };
export type ParsedDependency = { lhs: string[]; rhs: string[]; label: string };
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
  relations: ParsedRelation[];
  dependencies: ParsedDependency[];
  lossless: boolean;
  verdict: "Lossless join" | "Potentially lossy" | "Invalid input";
  summary: string;
  steps: CheckerStep[];
  complexity: string;
  iterations: number;
};

const clean = (value: string) => value.trim().replace(/\s+/g, " ");
const unique = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))];
const normalizeAttr = (value: string) => value.trim().replace(/[{}()]/g, "").toUpperCase();

function parseAttributes(value: string): string[] {
  return unique(
    value
      .replace(/[{}()[\]]/g, "")
      .split(/[,,\s]+/)
      .map(normalizeAttr)
      .filter(attribute => /^[A-Z][A-Z0-9_]*$/.test(attribute)),
  );
}

export function parseRelationSchema(input: string): string[] {
  const raw = clean(input).replace(/^R\s*\(/i, "").replace(/\)$/, "");
  return parseAttributes(raw);
}

export function parseRelations(input: string): ParsedRelation[] {
  return input
    .split(/[\n;]+/)
    .map(clean)
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*[:(]\s*(.*?)\s*\)?$/);
      if (match) {
        return { name: match[1].toUpperCase(), attributes: parseAttributes(match[2]) };
      }
      return { name: `R${index + 1}`, attributes: parseAttributes(line) };
    })
    .filter(relation => relation.attributes.length > 0);
}

export function parseDependencies(input: string): ParsedDependency[] {
  return input
    .split(/[\n;]+/)
    .map(clean)
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/(?:->|→|=>)/);
      if (parts.length !== 2) return null;
      const lhs = parseAttributes(parts[0]);
      const rhs = parseAttributes(parts[1]);
      if (!lhs.length || !rhs.length) return null;
      return { lhs, rhs, label: `${lhs.join(", ")} → ${rhs.join(", ")}` };
    })
    .filter((dependency): dependency is ParsedDependency => Boolean(dependency));
}

function cloneRows(rows: TableauRow[]): TableauRow[] {
  return rows.map(row => ({
    relation: row.relation,
    cells: row.cells.map(cell => ({ ...cell, changed: false })),
  }));
}

function allDistinguished(row: TableauRow) {
  return row.cells.every(cell => cell.distinguished);
}

function createInitialRows(relations: ParsedRelation[], attributes: string[]): TableauRow[] {
  return relations.map((relation, rowIndex) => ({
    relation: relation.name,
    cells: attributes.map(attribute => ({
      value: relation.attributes.includes(attribute) ? `a${attribute}` : `b${rowIndex + 1}${attribute}`,
      distinguished: relation.attributes.includes(attribute),
      changed: false,
    })),
  }));
}

function applyDependency(rows: TableauRow[], dependency: ParsedDependency, attributes: string[]) {
  const changedCells: string[] = [];
  const determinantIndexes = dependency.lhs.map(attribute => attributes.indexOf(attribute));
  const dependentIndexes = dependency.rhs.map(attribute => attributes.indexOf(attribute));

  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < rows.length; rightIndex += 1) {
      if (leftIndex === rightIndex) continue;
      const agrees = determinantIndexes.every(index => index >= 0 && rows[leftIndex].cells[index].value === rows[rightIndex].cells[index].value);
      if (!agrees) continue;

      dependentIndexes.forEach(columnIndex => {
        const left = rows[leftIndex].cells[columnIndex];
        const right = rows[rightIndex].cells[columnIndex];
        const preferred = left.distinguished && !right.distinguished ? left : right.distinguished && !left.distinguished ? right : left;
        if (right.value !== preferred.value || right.distinguished !== preferred.distinguished) {
          right.value = preferred.value;
          right.distinguished = preferred.distinguished;
          right.changed = true;
          changedCells.push(`${rows[rightIndex].relation}.${attributes[columnIndex]}`);
        }
      });
    }
  }
  return unique(changedCells);
}

export function analyzeLosslessJoin(input: CheckerInput): CheckerResult {
  const relationAttributes = parseRelationSchema(input.relationSchema);
  const relations = parseRelations(input.decompositions);
  const dependencies = parseDependencies(input.functionalDependencies);
  const errors: string[] = [];

  if (relationAttributes.length < 2) errors.push("Enter at least two attributes in the original relation schema.");
  if (relations.length < 2) errors.push("Add at least two decomposed relations, one per line.");
  if (relations.some(relation => relation.attributes.some(attribute => !relationAttributes.includes(attribute)))) {
    errors.push("Every decomposition attribute must exist in the original relation schema.");
  }
  if (relations.some(relation => relation.attributes.length === 0)) errors.push("Each decomposed relation needs at least one attribute.");
  if (input.functionalDependencies.trim() && dependencies.length === 0) errors.push("Use the functional-dependency format A, B -> C, D.");
  if (relations.length && relationAttributes.length && relations.every(relation => !relation.attributes.some(attribute => relationAttributes.includes(attribute)))) {
    errors.push("At least one decomposition must share an attribute with the original relation.");
  }

  if (errors.length) {
    return {
      ok: false,
      errors,
      relationAttributes,
      relations,
      dependencies,
      lossless: false,
      verdict: "Invalid input",
      summary: errors[0],
      steps: [],
      complexity: "Not available until the input is valid.",
      iterations: 0,
    };
  }

  const rows = createInitialRows(relations, relationAttributes);
  const steps: CheckerStep[] = [
    {
      index: 0,
      title: "Initialize the tableau",
      description: "Create one row per decomposed relation. Distinguished symbols (a…) represent values preserved by that relation; fresh symbols (b…) represent unknown values.",
      changedCells: [],
      rows: cloneRows(rows),
    },
  ];

  let lossless = rows.some(allDistinguished);
  let iterations = 0;
  const maxIterations = Math.max(8, relations.length * Math.max(1, dependencies.length) * relationAttributes.length * 2);

  while (!lossless && iterations < maxIterations) {
    let changedInRound = false;
    for (const dependency of dependencies) {
      const changedCells = applyDependency(rows, dependency, relationAttributes);
      if (!changedCells.length) continue;
      changedInRound = true;
      iterations += 1;
      steps.push({
        index: steps.length,
        title: `Apply ${dependency.label}`,
        description: `Rows that agree on ${dependency.lhs.join(", ")} must also agree on ${dependency.rhs.join(", ")}. The highlighted cells are copied toward the most informative symbol.`,
        dependency: dependency.label,
        changedCells,
        rows: cloneRows(rows),
      });
      lossless = rows.some(allDistinguished);
      if (lossless) break;
    }
    if (!changedInRound) break;
  }

  const finalStep = steps[steps.length - 1];
  const fullRow = finalStep?.rows.find(allDistinguished);
  const verdict = lossless ? "Lossless join" : "Potentially lossy";
  const summary = lossless
    ? `${fullRow?.relation ?? "A tableau row"} becomes fully distinguished, so every original attribute can be reconstructed after joining the decomposed relations.`
    : "No tableau row becomes fully distinguished after the dependencies reach a fixed point, so the decomposition is potentially lossy.";

  return {
    ok: true,
    errors: [],
    relationAttributes,
    relations,
    dependencies,
    lossless,
    verdict,
    summary,
    steps,
    complexity: `O(i × f × r × a) = O(${Math.max(1, iterations)} × ${Math.max(1, dependencies.length)} × ${relations.length} × ${relationAttributes.length}) for this bounded simulation`,
    iterations,
  };
}

export const SAMPLE_CASES = [
  {
    id: "student-course",
    label: "Student · Course",
    description: "A common classroom decomposition where course code determines its department.",
    input: { relationSchema: "STUDENT, COURSE, DEPT", decompositions: "R1(STUDENT, COURSE)\nR2(COURSE, DEPT)", functionalDependencies: "COURSE -> DEPT" },
  },
  {
    id: "employee-project",
    label: "Employee · Project",
    description: "Project IDs determine the department that owns the project.",
    input: { relationSchema: "EMPLOYEE, PROJECT, DEPARTMENT", decompositions: "EP(EMPLOYEE, PROJECT)\nPD(PROJECT, DEPARTMENT)", functionalDependencies: "PROJECT -> DEPARTMENT" },
  },
  {
    id: "no-dependencies",
    label: "No dependencies",
    description: "The same decomposition without a useful dependency becomes lossy.",
    input: { relationSchema: "A, B, C", decompositions: "R1(A, B)\nR2(B, C)", functionalDependencies: "" },
  },
  {
    id: "supply-chain",
    label: "Supply chain",
    description: "A chained set of dependencies spreads preserved symbols across three relations.",
    input: { relationSchema: "SUPPLIER, PART, WAREHOUSE, REGION", decompositions: "SP(SUPPLIER, PART)\nPW(PART, WAREHOUSE)\nWR(WAREHOUSE, REGION)", functionalDependencies: "PART -> WAREHOUSE\nWAREHOUSE -> REGION" },
  },
  {
    id: "two-islands",
    label: "Two islands",
    description: "Disconnected relations show a clean potentially-lossy counterexample.",
    input: { relationSchema: "ORDER_ID, CUSTOMER, PRODUCT, CATEGORY", decompositions: "OC(ORDER_ID, CUSTOMER)\nPC(PRODUCT, CATEGORY)", functionalDependencies: "ORDER_ID -> CUSTOMER\nPRODUCT -> CATEGORY" },
  },
] as const;
