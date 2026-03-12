# ACCEPTANCE_BATCH_4.md

## 1. Acceptance identity

- Batch name: Batch 4
- Batch theme: Outbound + Recycle full closure
- Stage range: S4 -> S5
- Acceptance rule: Batch 4 passes only when S4 passes, S5 passes, and final batch closure passes

This file is the acceptance sheet for Batch 4.

This file does not define implementation steps.
This file defines what counts as:

- stage pass
- final pass
- failure
- evidence
- delivery format

---

## 2. How to use this file

Use this file in three layers:

1. after S4, check the S4 acceptance section
2. after S5, check the S5 acceptance section
3. before claiming Batch 4 complete, check the final batch acceptance section

Do not claim Batch 4 complete by checking only one layer.

If any required item is false, the related stage or batch is not accepted.

---

## 3. S4 acceptance gate

S4 is the backend acceptance gate.

S4 passes only when all required items below are true.

### 3.1 Backend objects

- [ ] `RM Outbound` exists and can be created as draft
- [ ] `Outbound Destination Change` exists
- [ ] `Recycle Batch` exists
- [ ] `Recycle Summary` exists
- [ ] `Recycle Process` exists
- [ ] `Recycle Scrap` exists

### 3.2 RM Outbound rules

- [ ] pallet-based outbound path exists
- [ ] manual outbound path exists
- [ ] in manual outbound, `source_location_id` is mandatory
- [ ] stock deduction happens only on submit/post
- [ ] no stock deduction happens at draft stage
- [ ] insufficient manual stock is blocked
- [ ] insufficient stock returns error code `INSUFFICIENT_STOCK`
- [ ] machine-required rule is configurable and effective at backend level

### 3.3 Destination reroute rules

- [ ] reroute can be created against a submitted outbound record
- [ ] reroute changes destination fields only
- [ ] reroute does not change stock quantity
- [ ] reroute preserves from -> to information
- [ ] reroute preserves operator
- [ ] reroute preserves timestamp
- [ ] reroute preserves reason
- [ ] reroute is traceable
- [ ] submitted outbound history is not silently overwritten
- [ ] repeated reroute can exist as stacked trace records

### 3.4 Recycle rules

- [ ] recycle batch identity can be created successfully
- [ ] `grade_usability` allows only approved values for Batch 4
- [ ] `grade_usability` does not use `报废` as usability grade
- [ ] recycle summary is the default entry
- [ ] one submitted summary line creates one new recycle batch
- [ ] Batch 4 does not merge recycle summary lines
- [ ] one recycle batch can have multiple recycle process records
- [ ] `total_cost` is required in recycle process
- [ ] `cost_breakdown` is pre-embedded only
- [ ] `cost_breakdown` is hidden or disabled by default
- [ ] `cost_breakdown` is not required in Batch 4
- [ ] recycle process submit can accumulate cost into the recycle batch
- [ ] recycle scrap is the only official scrap-closing path
- [ ] recycle scrap submit generates `loss_amount`
- [ ] recycle scrap `loss_amount` equals accumulated recycle cost
- [ ] recycle scrap submit sets recycle batch to closed state
- [ ] scrap loss is traceable back to recycle process cost events
- [ ] Batch 4 recycle scrap does not require accounting general ledger integration

### 3.5 API contract gate

- [ ] `rm_outbound.create_draft` is callable
- [ ] `rm_outbound.submit_and_post` is callable
- [ ] `rm_outbound.reroute` is callable
- [ ] `recycle_summary.create_draft` is callable
- [ ] `recycle_summary.submit_and_generate_batches` is callable
- [ ] `recycle_process.create_draft` is callable
- [ ] `recycle_process.submit_and_apply` is callable
- [ ] `recycle_scrap.submit_and_close` is callable
- [ ] each required request carries `contract_version:"v1"`
- [ ] each required response carries `contract_version:"v1"`
- [ ] permission validation is active
- [ ] error behavior is clear
- [ ] no fake success response is returned

### 3.6 S4 pass condition

S4 passes only when every checkbox in section 3 is checked.

If any checkbox in section 3 is unchecked, S4 does not pass.

---

## 4. S5 acceptance gate

S5 is the frontend acceptance gate.

S5 passes only when all required items below are true.

### 4.1 Outbound page

- [ ] outbound page exists
- [ ] outbound page has pallet-assisted path
- [ ] outbound page has manual fallback path
- [ ] pallet scan / input can call `pallet.get_by_code`
- [ ] returned pallet-related material context can be displayed
- [ ] manual fallback visibly requires `source_location_id`
- [ ] outbound page keeps destination inputs:
  - [ ] `machine_id`
  - [ ] `work_order_id`
  - [ ] `purpose`
- [ ] outbound page can trigger submit/post through approved contract
- [ ] outbound page does not fake stock deduction locally
- [ ] outbound page can clearly surface backend `INSUFFICIENT_STOCK`
- [ ] existing earlier page capability is not broken

### 4.2 Destination reroute entry

- [ ] reroute entry exists
- [ ] reroute entry can target a submitted outbound record
- [ ] reroute entry can submit new machine plus reason
- [ ] reroute entry clearly behaves as trace action, not direct history edit
- [ ] reroute result can show readable from -> to evidence
- [ ] reroute entry does not allow quantity editing
- [ ] reroute entry does not pretend to change stock quantity

### 4.3 Recycle page

- [ ] recycle page exists
- [ ] recycle summary entry exists
- [ ] recycle process entry exists
- [ ] recycle scrap entry exists
- [ ] recycle summary submit can generate recycle batch identity
- [ ] recycle process can be submitted multiple times against one recycle batch
- [ ] accumulated cost result can be observed after repeated process submits
- [ ] recycle scrap entry can close the recycle batch
- [ ] recycle scrap result can show loss amount
- [ ] recycle page does not break outbound page

### 4.4 Frontend discipline

- [ ] frontend does not carry stock source-of-truth logic
- [ ] frontend does not carry final cost source-of-truth logic
- [ ] frontend does not perform silent history rewrite
- [ ] frontend does not close recycle batch by local state only
- [ ] frontend uses approved backend contracts only
- [ ] frontend preserves readable backend errors
- [ ] manual outbound remains available
- [ ] Batch 3 pallet capability remains usable

### 4.5 S5 pass condition

S5 passes only when every checkbox in section 4 is checked.

If any checkbox in section 4 is unchecked, S5 does not pass.

---

## 5. Final Batch 4 acceptance gate

Batch 4 final acceptance is not the same as “pages exist” or “APIs exist”.

Batch 4 passes only when all required end-to-end cases below are true.

### 5.1 Required end-to-end cases

#### Case 1 — coded outbound

- [ ] pallet-based outbound can run end-to-end
- [ ] material / batch / remaining quantity context can be observed
- [ ] submit/post succeeds
- [ ] stock deduction happens only after submit/post

#### Case 2 — manual outbound

- [ ] manual outbound can run end-to-end without pallet
- [ ] `source_location_id` is required for manual outbound
- [ ] submit succeeds only when backend accepts it

#### Case 3 — insufficient stock

- [ ] manual outbound with insufficient balance is blocked
- [ ] backend returns `INSUFFICIENT_STOCK`
- [ ] frontend surfaces the error clearly
- [ ] no fake success is shown

#### Case 4 — machine required

- [ ] when current config says machine is required, missing machine blocks submit
- [ ] frontend reflects requiredness clearly
- [ ] backend remains the final source of truth

#### Case 5 — destination reroute traceability

- [ ] reroute can be executed after outbound submission
- [ ] original history is not erased
- [ ] from -> to trace is readable
- [ ] quantity stays unchanged

#### Case 6 — recycle batch identity

- [ ] recycle summary submit creates recycle batch identity
- [ ] created recycle batch can be selected later

#### Case 7 — repeated recycle process accumulation

- [ ] the same recycle batch accepts multiple process submissions
- [ ] accumulated cost equals the sum of repeated `total_cost` events
- [ ] repeated process events do not lose earlier cost history

#### Case 8 — recycle scrap closing

- [ ] recycle scrap can close the recycle batch
- [ ] returned `loss_amount` equals accumulated recycle cost
- [ ] recycle batch becomes closed
- [ ] closure remains traceable back to process cost events

### 5.2 Batch-wide closure rules

- [ ] outbound closure is green
- [ ] recycle closure is green
- [ ] reroute connection point is green
- [ ] recycle cost event connection point is green
- [ ] recycle scrap closing connection point is green
- [ ] Batch 4 is not accepted as outbound-only
- [ ] Batch 4 is not accepted as recycle-only
- [ ] Batch 4 is not accepted as page-only
- [ ] Batch 4 is not accepted as API-only

### 5.3 Final pass condition

Batch 4 passes only when every checkbox in section 5 is checked.

If any checkbox in section 5 is unchecked, Batch 4 does not pass.

---

## 6. Failure conditions

Any of the following means failure:

- [ ] a required stage checkbox is false
- [ ] a final end-to-end case is false
- [ ] only outbound is complete
- [ ] only recycle is complete
- [ ] `source_location_id` is not enforced in manual outbound
- [ ] insufficient stock does not return `INSUFFICIENT_STOCK`
- [ ] reroute silently overwrites history
- [ ] recycle process cost cannot accumulate across multiple records
- [ ] recycle scrap does not close the batch correctly
- [ ] recycle scrap `loss_amount` does not equal accumulated recycle cost
- [ ] frontend carries business logic that belongs to backend
- [ ] approval is claimed without evidence
- [ ] approval is claimed without running required checks

If any item in section 6 is true, Batch 4 fails acceptance.

---

## 7. Evidence requirement

Acceptance must be evidence-backed.

For every required end-to-end case in section 5, preserve at least one readable evidence set.

Allowed evidence includes:

- screenshot
- response snapshot
- visible page state
- curl output
- record identifier
- clear error message capture

Minimum evidence rule:

- [ ] each required case has evidence
- [ ] each failure has evidence
- [ ] each corrected re-run has evidence
- [ ] evidence is readable by human review
- [ ] evidence can link the result back to the related record or action

No evidence, no acceptance.

---

## 8. Reporting requirement

When reporting Batch 4 acceptance result, use the fixed delivery structure.

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

In addition, acceptance reporting must include:

- [ ] which section was checked
- [ ] which checkboxes passed
- [ ] which checkboxes failed
- [ ] what evidence exists
- [ ] whether the project can move to the next stage or final close

Do not use vague summary like:

- “basically done”
- “should be okay”
- “mostly works”

---

## 9. One-sentence summary

Batch 4 is accepted only when:
S4 backend rules pass, S5 frontend closure passes, and all end-to-end outbound + recycle acceptance cases are green with evidence.
