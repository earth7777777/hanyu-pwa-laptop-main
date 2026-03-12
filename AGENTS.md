# AGENTS.md

## 1. Project purpose

This repository is the Hanyu Warehouse project.

The project is executed through:

- one shared rule system,
- one batch file for overall scope,
- one stage file for the current step,
- one acceptance file for completion checks.

This repository uses a front-end / back-end separated workflow.
At any given time, work must stay inside the current lane:

- backend lane, or
- frontend lane.

This file defines long-term execution rules only.
It does not define the current batch details.
Current batch scope is defined only by:

- `TASK_BATCH_*.md`
- `TASK_STAGE_*.md`
- `ACCEPTANCE_*.md`

---

## 2. Required read order

Before making any change, always read files in this order:

1. `AGENTS.md`
2. current `TASK_BATCH_*.md`
3. current `TASK_STAGE_*.md`
4. current `ACCEPTANCE_*.md`
5. `DOC_RULES.md` if present
6. `CHANGE_REPORT_TEMPLATE.md` if present

Do not write code before reading the required files.

If any required file is missing, stop and report it.

---

## 3. Execution rules

1. Work on one stage at a time.
2. Do not jump to the next stage unless the current stage is finished and reported.
3. Follow task files exactly.
4. If task files and code reality conflict, stop and report the conflict before changing code.
5. Prefer the smallest runnable implementation that satisfies the current stage.
6. Do not expand scope on your own.
7. Do not refactor unrelated modules.
8. Do not rename, move, or delete major project structure unless the task file explicitly requires it.
9. Do not guess missing paths, API landing points, DocType locations, page entry points, branch rules, or worktree rules.
10. If a boundary is missing, stop and report the missing boundary instead of guessing.
11. Preserve compatibility unless the current task file explicitly allows a breaking change.
12. Treat earlier completed batches as existing foundation, not as free rewrite area.

---

## 4. Front-end / back-end lane rule

This repository is not a mixed free-edit project.

You must first determine whether the current stage belongs to:

- backend, or
- frontend.

### If the current stage is backend

You may only change:

- backend business logic
- backend API handlers
- backend validators
- backend data objects / DocTypes
- backend tests
- minimal backend support code required by the current stage

You must not change:

- frontend pages
- frontend routes
- frontend UI structure
- frontend interaction flow

unless the current stage file explicitly requires it.

### If the current stage is frontend

You may only change:

- frontend pages
- frontend routes
- frontend forms
- frontend API calls
- frontend validation prompts
- frontend tests
- minimal frontend support code required by the current stage

You must not change:

- backend contracts
- backend business rules
- backend data model
- backend posting logic

unless the current stage file explicitly requires it.

---

## 5. Directory boundary

Use the real repository boundary filled by the project owner.

### Editable paths

Only edit files inside the approved paths below:

- `/home/yue/frappe-bench/apps/hanyu_warehouse`
- `/home/yue/frappe-bench/apps/hanyu_warehouse/hanyu_warehouse`

### Forbidden paths

Do not edit files inside the forbidden paths below:

- `/home/yue/hanyu-pwa`
- `/home/yue/frappe-bench/sites`
- `/home/yue/frappe-bench/env`

### Historical foundation protection

Do not rewrite earlier completed foundation unless the current stage file explicitly requires it.

Protected existing foundation includes:

- Batch 1 inbound draft creation foundation
- Batch 2 f12~f16 related foundation
- Batch 3 pallet capability foundation

If the current task depends on them, extend them carefully.
Do not rewrite them freely.

---

## 6. Data and history protection

1. Do not silently modify historical records.
2. Do not replace audit trail behavior with overwrite behavior.
3. Do not turn correction flow into history rewrite.
4. Do not fake passing results.
5. Do not claim completion without running the required checks.
6. Do not invent fields, endpoints, pages, paths, or commands that were not confirmed by files or code.

---

## 7. Missing information rule

If any of the following is unclear, stop and report instead of guessing:

- editable scope
- forbidden scope
- real API landing point
- real DocType location
- real frontend entry point
- current git root
- current worktree / branch rule
- required environment command
- current stage ownership between frontend and backend

Use this exact behavior:

- say what is missing
- say why work cannot continue safely
- wait for the boundary to be provided in project files or user instruction

---

## 8. Self-check rule

After implementation, always do all of the following:

1. verify changed files match the current stage only
2. verify no unrelated files were modified
3. run the smallest relevant checks or tests for the changed area
4. compare the result against the current acceptance file
5. note any unfinished item clearly
6. do not move to the next stage automatically

If checks cannot be run, report exactly why.

---

## 9. Documentation sync rule

If the current task introduces new code facts, follow `DOC_RULES.md`.

Do not update documentation by guess.
Only sync documents that are required by actual code changes.

---

## 10. Required delivery format

Every delivery must follow the project report format.

If `CHANGE_REPORT_TEMPLATE.md` exists, use it.

Otherwise use this exact structure:

- Read files:
- Current stage:
- Stage type:
- Modified files:
- Completed:
- Self-check:
- Remaining:
- Can move to next stage:
- Risks / Notes:

Do not replace this structure with free-form prose.

---

## 11. Writing style for execution

Rules must be followed literally.

Do not interpret:

- “maybe”
- “normally”
- “probably”
- “should be fine”

as permission.

If permission is not explicit in project files, treat it as not allowed.

This file is a stable execution rule file.
Do not put batch details or stage details into this file.
