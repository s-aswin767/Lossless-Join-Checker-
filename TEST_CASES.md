# Test cases

| ID | Input | Expected result |
| --- | --- | --- |
| TC-01 | `R(A,B,C)`, `R1(A,B)`, `R2(B,C)`, `B -> C` | Valid, lossless, final tableau contains a fully distinguished row |
| TC-02 | `R(A,B,C)`, `R1(A,B)`, `R2(B,C)`, no dependencies | Valid, potentially lossy, fixed point has fresh symbols |
| TC-03 | `R(A,B)`, `R1(A,C)`, `R2(B)` | Invalid, decomposition contains attribute not in original relation |
| TC-04 | `R(A,B,C)`, `R1(A,B)`, `R2(B,C)`, `A => B` | Valid arrow alias, same parser behavior as `A -> B` |
| TC-05 | Load Student · Course example | Loads one-click example and displays a lossless proof |
| TC-06 | Save a valid run, open History, choose Reopen | Returns to Checker with the saved input restored |
| TC-07 | Export a valid run | Downloads `lossless-join-report.md` with verdict and final tableau |
| TC-08 | Resize to 390px viewport | Input, workbench, and explanation stack vertically without horizontal page overflow |

Automated cases live in `server/checker.test.ts` and run with `pnpm test`.
