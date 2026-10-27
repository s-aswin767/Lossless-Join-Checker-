# User manual

## 1. Start a check

Open the **Checker** page. Enter the attributes of the original relation, list the decomposed relations one per line, and add functional dependencies using `A, B -> C` syntax. Choose **Run lossless check**.

## 2. Read the result

The dark verdict card reports **Lossless join** when the tableau reaches a fully distinguished row. **Potentially lossy** means the rows reached a fixed point without such a witness. Validation messages appear beside the input panel when the structure is incomplete.

## 3. Explain each step

Use the numbered stepper or the Previous/Next controls. Read the highlighted cells in the tableau together with the right-hand explanation. Cyan cells are distinguished symbols; grey cells are fresh symbols; cells highlighted with a cyan tint changed in the current step.

## 4. Compare examples

The input rail includes five ready-to-run examples: Student · Course, Employee · Project, No dependencies, Supply chain, and Two islands. The **Examples** page describes the cases and the expected contrast between proof and counterexample.

## 5. Save and export

Choose **Save run** to save the current inputs and result. The application attempts the managed history table and also keeps a small local browser cache. **Export report** downloads a Markdown report containing the input, final tableau, step summary, and complexity.

## 6. Learn mode

Use the **Learn** page for definitions, real-world uses, limitations, algorithm selection, and an exam-oriented hint about relation intersections.

## 7. Accessibility and responsive use

All fields have labels, controls are keyboard-friendly, the color system is paired with text labels, and the three-pane desktop layout stacks into a single readable flow on narrow screens. Use the moon/sun button to switch themes.
