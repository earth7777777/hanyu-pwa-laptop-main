# CHANGE_REPORT_TEMPLATE.md

## 1. Purpose

This file defines the fixed delivery report format for the project.

Its only job is:

force every delivery report to use the same structure.

This file does not define:

- implementation tasks
- acceptance truth
- documentation sync rules
- project scope

Big picture in plain words:

work may change by stage,
but report format must stay stable.

---

## 2. Hard rules

Use this template literally.

1. field names must stay fixed
2. field order must stay fixed
3. do not rename fields
4. do not drop fields
5. do not replace the template with free-form prose
6. keep each section short, factual, and reviewable
7. if something is unknown, say `unknown`
8. if nothing applies, say `none`
9. do not write vague text like:
   - basically done
   - should be okay
   - almost there
   - mostly works

---

## 3. Required report template

Use this exact structure in every delivery report:

- Read files:
- Current stage:
- Stage type:
- Modified files:
- Completed:
- Self-check:
- Remaining:
- Can move to next stage:
- Risks / Notes:

Do not change the order.

---

## 4. Field meaning

### Read files:

List the files actually read before work started.

Rules:

- use concrete file names
- do not write files that were not actually read
- keep the list short but complete

### Current stage:

Write the current stage name.

Examples:

- `S4`
- `S5`
- `Batch-level check`
- `Docs sync only`

If not applicable, write:

- `N/A`

### Stage type:

Write the current work lane.

Allowed values:

- `backend`
- `frontend`
- `docs`
- `mixed`
- `N/A`

Do not invent decorative labels.

### Modified files:

List only files actually changed in this round.

Rules:

- use concrete paths when known
- do not hide unrelated file changes
- if no file was changed, write `none`

### Completed:

List only what is actually finished in this round.

Rules:

- write factual completed items
- do not write future plan as completed work
- do not write acceptance claims here unless they were actually checked

### Self-check:

Write what was checked after the change.

May include:

- boundary check
- relevant test or command
- manual validation result
- contract check
- acceptance item spot-check

Rules:

- if no check was run, say exactly why
- do not fake green status

### Remaining:

List what is still not done.

Rules:

- be concrete
- if nothing remains for this round, write `none`
- do not hide unresolved issues

### Can move to next stage:

Write one of these only:

- `yes`
- `no`
- `unknown`

Then add one short reason.

Examples:

- `yes - current stage checklist is complete`
- `no - acceptance still has open items`
- `unknown - required boundary is missing`

### Risks / Notes:

List only important review notes.

May include:

- rule conflict
- missing boundary
- rollback note
- compatibility warning
- evidence note
- doc sync note

Rules:

- keep it short
- do not repeat Completed
- do not turn this section into a diary

---

## 5. Required style

Every field should use short bullet points when there are multiple items.

Recommended style:

- one bullet = one fact
- one line = one idea
- concrete nouns over abstract summary
- facts first, judgment second

Do not write long narrative paragraphs inside the template.

---

## 6. Stop / failure reporting rule

Even if work stops early, the same template must still be used.

If work stopped because of:

- missing boundary
- rule conflict
- missing file
- command failure
- test failure
- contract mismatch

still report with the same fields.

Special rule:
do not claim `Can move to next stage: yes` when there are blocking failures.

---

## 7. Minimal review standard

A good report must let the reviewer answer these questions immediately:

1. what was read
2. what was changed
3. what was actually completed
4. what was checked
5. what still remains
6. whether the project can move forward

If the reviewer cannot answer these six questions quickly, the report is not good enough.

---

## 8. Recommended output example

- Read files:
  - AGENTS.md
  - TASK_BATCH_4.md
  - TASK_STAGE_S4.md
  - ACCEPTANCE_BATCH_4.md

- Current stage:
  - S4

- Stage type:
  - backend

- Modified files:
  - hanyu_warehouse/doctype/rm_outbound/...
  - hanyu_warehouse/api/rm_outbound.py

- Completed:
  - Added RM Outbound submit/post backend path
  - Added insufficient-stock backend blocking

- Self-check:
  - Verified manual outbound requires source_location_id
  - Verified insufficient stock returns INSUFFICIENT_STOCK

- Remaining:
  - Destination reroute API not finished
  - Recycle Scrap not finished

- Can move to next stage:
  - no - S4 checklist is not complete

- Risks / Notes:
  - Current backend editable path must still follow AGENTS.md
  - No unrelated frontend files were modified

This example shows format only.
Do not copy its project facts blindly.

---

## 9. One-sentence summary

`CHANGE_REPORT_TEMPLATE.md` means:

every delivery must use one fixed, short, factual, review-friendly report structure, so stage-based work can be checked quickly and consistently.
