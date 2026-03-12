# TASK_STAGE_S4.md

## 1. Stage identity

- Stage name: S4
- Stage type: backend
- Batch owner: Batch 4
- Stage goal: stand up the ledger, objects, contracts, and backend rules first
- Execution rule: S4 must be completed, self-checked, and reported before S5 can start

This file defines S4 only.
It does not define S5 pages, page routes, or frontend interaction details.

---

## 2. Stage purpose

S4 exists to build the backend foundation for Batch 4.

This stage must establish:

1. outbound backend document and posting rule
2. destination reroute traceability rule
3. recycle backend document set
4. recycle cost accumulation rule
5. recycle scrap closing rule
6. whitelist API contracts for the minimum closure

Big picture in plain words:

S4 is the stage that puts the real bookkeeping and rule engine in place first.
Frontend is not allowed to fake these rules.

---

## 3. Stage scope

S4 includes only the following backend scope.

### 3.1 New / updated backend objects

S4 must establish these backend objects:

1. `RM Outbound`
2. `Outbound Destination Change`
3. `Recycle Batch`
4. `Recycle Summary`
5. `Recycle Process`
6. `Recycle Scrap`

### 3.2 New / updated backend contracts

S4 must establish these whitelist API endpoints:

1. `pallet.get_by_code`
   Reuse existing Batch 3 pallet capability.
   Do not rewrite Batch 3 foundation freely.

2. `rm_outbound.create_draft`

3. `rm_outbound.submit_and_post`

4. `rm_outbound.reroute`

5. `recycle_summary.create_draft`

6. `recycle_summary.submit_and_generate_batches`

7. `recycle_process.create_draft`

8. `recycle_process.submit_and_apply`

9. `recycle_scrap.submit_and_close`

### 3.3 Allowed support work

S4 may include only the minimum backend support work required to make the above items runnable, such as:

- validators
- permission checks
- posting helpers
- traceability logging
- status transition helpers
- minimal tests
- minimal fixtures or config support if explicitly required by current code reality

Do not expand beyond the minimum needed for S4.

---

## 4. S4 deliverables

S4 is considered implemented only when all deliverables below exist.

### Deliverable A — RM Outbound backend foundation

Create the backend document and rules for `RM Outbound`.

Minimum required field meaning:

- `pallet_id` can be empty
- `source_location_id` can be empty in scan flow, but cannot be empty in manual flow
- keep destination fields:
  - `machine_id`
  - `work_order_id`
  - `purpose`

Minimum required backend rules:

1. stock deduction happens only on submit/post, never on draft creation
2. if `pallet_id` exists, outbound follows pallet-based stock source
3. if `pallet_id` is empty, this is manual outbound
4. in manual outbound, `source_location_id` is mandatory
5. before manual outbound submit/post, backend must validate available balance for:
   - `source_location_id`
   - `item_code`
   - `batch_no`
6. if stock is insufficient, return clear error code:
   - `INSUFFICIENT_STOCK`
7. machine-required rule must be configurable, with default behavior aligned to current batch rule

S4 acceptance for Deliverable A:

- document can be created as draft in Desk
- submit/post path exists
- manual path blocks missing `source_location_id`
- insufficient stock returns `INSUFFICIENT_STOCK`
- no stock deduction happens at draft stage

Rollback point:

- rollback only `RM Outbound` backend object and related new backend code if this deliverable fails

---

## 5. Deliverable B — Outbound Destination Change backend foundation

Create the backend document and rules for destination reroute.

Purpose:
change destination fields without rewriting submitted history.

Minimum required fields:

- `outbound_id`
- `from_machine_id`
- `to_machine_id`
- `from_work_order_id`
- `to_work_order_id`
- `from_purpose`
- `to_purpose`
- `reason`
- `operator`
- `timestamp`

Minimum required backend rules:

1. reroute can only affect destination-related fields
2. reroute must not affect stock quantity
3. reroute must not silently overwrite submitted outbound history
4. reroute action must be traceable in backend log / timeline
5. repeated reroute is allowed as stacked trace records, not overwrite behavior

S4 acceptance for Deliverable B:

- reroute can be created against a submitted outbound record
- from -> to information is visible
- operator, timestamp, and reason are preserved
- quantity is unchanged
- history is not silently rewritten

Rollback point:

- rollback only destination change object and related reroute interface code
- do not rollback `RM Outbound` unless explicitly required

---

## 6. Deliverable C — Recycle backend document set

Create the recycle backend object set.

### C1. Recycle Batch

Minimum required meaning:

- unique recycle batch identity
- source machine is required
- shift is required
- source item is required
- `grade_usability` must allow only:
  - `可直接用`
  - `需拉丝后可用`
- `grade_usability` must not include `报废`
- `process_status` must support:
  - `未处理`
  - `已拉丝`
  - `已报废处置`
- `total_cost_accumulated` starts from 0
- `is_closed` exists

Minimum required backend rules:

1. `报废` is not a usability grade
2. scrap state can only happen through `Recycle Scrap`
3. batch must preserve repeated process events without losing accumulated cost

### C2. Recycle Summary

Purpose:
default entry point for recycle creation.

Minimum required backend rules:

1. summary submit creates recycle batch identities
2. each submitted summary line creates one new `Recycle Batch`
3. do not merge summary lines in Batch 4
4. summary is the default closure entry for this batch

### C3. Recycle Process

Purpose:
repeatable cost event carrier.

Minimum required backend rules:

1. one recycle batch may have multiple process records
2. `total_cost` is required
3. `cost_breakdown` may be pre-embedded only
4. `cost_breakdown` must stay hidden / disabled by default
5. `cost_breakdown` must not become required in Batch 4
6. submit/apply must accumulate process `total_cost` into recycle batch accumulated cost
7. process submit may update process status when appropriate

### C4. Recycle Scrap

Purpose:
the only official scrap-closing path.

Minimum required backend rules:

1. scrap can only be closed through `Recycle Scrap`
2. `loss_amount` is system-generated
3. `loss_amount` must equal the accumulated recycle cost of that batch
4. scrap submit changes:
   - `Recycle Batch.process_status = 已报废处置`
   - `Recycle Batch.is_closed = 1`
5. scrap loss must remain traceable back to process cost events
6. this batch only records custom loss closure
7. do not connect to accounting general ledger in Batch 4

S4 acceptance for Deliverable C:

- recycle batch identity can be created successfully
- summary line -> batch creation works
- multiple process records can accumulate cost
- scrap submit closes the batch
- scrap `loss_amount` equals accumulated recycle cost
- traceability can point back to process cost events

Rollback point:

- rollback per object independently
- preferred rollback order:
  1. `Recycle Scrap`
  2. `Recycle Process`
  3. `Recycle Summary`
  4. `Recycle Batch`

Do not force full rollback if only one recycle object fails.

---

## 7. Deliverable D — whitelist API contracts

Create the minimum whitelist API set for S4.

All request and response payloads in newly added S4 APIs must carry:

- `contract_version: "v1"`

Contract discipline rules:

1. `contract_version:"v1"` is mandatory in request and response
2. breaking field changes must not silently replace existing contract behavior
3. if a breaking change is needed, a new versioned contract must be added while preserving old compatibility
4. do not change code path naming just because documents mention `V1` or `v1` in narrative text

S4 API-level acceptance:

- each required API can be called
- curl-level minimum usability exists
- permission validation is active
- error code behavior is clear
- submit/post boundary is correct
- no fake success response

Rollback point:

- if only API code fails, rollback only new API code files
- do not rollback DocTypes unless API failure proves object design is invalid

---

## 8. Hard rules for S4

These are non-negotiable in S4.

### Rule 1

S4 is backend only.

Do not implement:

- frontend page
- frontend route
- frontend button
- frontend validation UX
- page-level form orchestration

### Rule 2

Do not move real business logic to frontend.

Stock deduction, cost accumulation, traceability, state change, and scrap closing must stay in backend.

### Rule 3

Do not rewrite Batch 1 / Batch 2 / Batch 3 foundation freely.

Especially protect:

- inbound draft creation foundation
- `f12 ~ f16` foundation
- Batch 3 pallet rule: `pallet_id -> f17`

### Rule 4

Do not silently rewrite submitted outbound history.

Destination correction must be trace-based, not overwrite-based.

### Rule 5

Do not invent real file paths, landing points, or object locations.

If real backend boundaries are missing, stop and report.

### Rule 6

Do not overbuild.

S4 is minimum closure stage, not architecture beautification stage.

### Rule 7

Do not add accounting integration for recycle scrap in Batch 4.

Only custom loss recording is allowed in this stage.

---

## 9. Explicit non-goals for S4

The following are outside S4 unless the project owner adds them explicitly:

- outbound page UI
- recycle page UI
- reroute frontend entry
- full-chain adversarial test page actions
- broad dashboard / report work
- generalized workflow redesign
- accounting general ledger integration
- advanced cost breakdown enablement
- production-side complete work-order system
- unrelated refactor

---

## 10. Stage completion checklist

S4 is complete only when all items below are true:

- `RM Outbound` backend object exists
- manual outbound requires `source_location_id`
- insufficient manual stock returns `INSUFFICIENT_STOCK`
- submit/post is the only deduction point
- destination reroute object exists
- reroute preserves trace and does not erase history
- recycle batch exists
- recycle summary exists
- recycle process exists
- recycle scrap exists
- summary line creates new recycle batch identity
- multiple process events can accumulate cost
- scrap submit closes recycle batch and writes loss amount
- loss amount equals accumulated recycle cost
- traceability exists from scrap loss back to process costs
- required whitelist APIs are callable
- request/response contract includes `contract_version:"v1"`
- permission checks are active
- smallest relevant backend checks have been run
- results are reported with template

If any one item above is false, S4 is not complete.

---

## 11. Required self-check before claiming S4 done

Before claiming S4 completion, the agent must verify:

1. only S4 backend scope was modified
2. no S5 page-layer work was mixed in
3. no unrelated files were modified without necessity
4. all newly added APIs follow contract discipline
5. all protected foundations remain compatible
6. each rollback point remains understandable
7. any unfinished issue is clearly listed

If checks cannot be completed, report exactly why.

---

## 12. Required delivery format

If `CHANGE_REPORT_TEMPLATE.md` exists, use it.

Otherwise use:

- Read files:
- Current stage:
- Stage type:
- Modified files:
- Completed:
- Self-check:
- Remaining:
- Can move to next stage:
- Risks / Notes:

Do not replace this with free-form prose.

---

## 13. One-sentence summary

S4 means:
stand up the backend documents, posting rules, reroute traceability, recycle cost accumulation, scrap closing, and versioned whitelist contracts for Batch 4, without touching S5 page work.
