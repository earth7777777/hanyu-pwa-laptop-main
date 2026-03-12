# TASK_STAGE_S5.md

## 1. Stage identity

- Stage name: S5
- Stage type: frontend
- Batch owner: Batch 4
- Stage goal: build the minimum frontend entry points and run full-chain validation
- Execution rule: S5 starts only after S4 is completed, self-checked, and reported

This file defines S5 only.
It does not redefine S4 backend objects, backend posting rules, or backend contract design.

---

## 2. Stage purpose

S5 exists to connect the already-approved Batch 4 backend closure into real usable frontend actions.

This stage must establish:

1. outbound page
2. destination reroute entry
3. recycle page
4. full-chain adversarial validation actions
5. evidence-ready acceptance behavior

Big picture in plain words:

S4 puts the real backend ledger and rules in place.
S5 makes people able to actually use them from the PWA, without moving real logic into frontend.

---

## 3. Stage scope

S5 includes only the following frontend scope.

### 3.1 Required page / entry scope

S5 must establish:

1. one outbound page
2. one destination reroute entry
3. one recycle page
4. one evidence-friendly validation flow for Batch 4 acceptance

### 3.2 Required frontend API usage scope

S5 may call only the approved backend contracts for this stage:

- `pallet.get_by_code`
- `rm_outbound.create_draft`
- `rm_outbound.submit_and_post`
- `rm_outbound.reroute`
- `recycle_summary.create_draft`
- `recycle_summary.submit_and_generate_batches`
- `recycle_process.create_draft`
- `recycle_process.submit_and_apply`
- `recycle_scrap.submit_and_close`

S5 does not redefine request / response contracts.
S5 only consumes them.

### 3.3 Allowed support work

S5 may include only the minimum frontend support work required to make the above items usable, such as:

- page state
- form state
- route / entry wiring
- request wrappers
- result display
- validation prompts
- minimal loading / error state
- minimal frontend test hooks
- minimal screenshot / evidence helpers if needed

Do not expand beyond the minimum needed for S5.

---

## 4. Existing foundation that S5 must reuse

S5 must reuse existing frontend foundation instead of rebuilding from scratch.

Known existing frontend foundation includes:

- the PWA frontend already exists
- the main frontend entry already exists
- pallet scan capability from Batch 3 already exists
- pallet-related frontend actions were previously attached in a minimal way
- the no-code / no-pallet case must not break the main flow

S5 must treat Batch 3 pallet capability as reusable existing foundation.

Hard protection rule:

- `pallet_id -> f17` is already the protected Batch 3 rule
- do not remap pallet meaning
- do not rewrite earlier pallet area freely
- do not rebuild the page from zero if the current page can host minimum Batch 4 access points

---

## 5. Deliverable A — Outbound page

Create the minimum usable frontend outbound page.

### A1. Minimum required UI areas

The outbound page must include:

1. scan area
2. manual fallback area
3. destination area
4. submit area
5. clear result / error display area

### A2. Scan area

Purpose:
optional pallet-based outbound path.

Minimum required behavior:

1. user may scan / enter pallet code
2. page calls `pallet.get_by_code`
3. page displays returned material / batch / remaining quantity information
4. page must not require pallet flow if the user wants manual outbound

### A3. Manual fallback area

Purpose:
guaranteed no-pallet outbound path.

Minimum required inputs:

- `item_code`
- `batch_no`
- `qty`
- `source_location_id`

Hard frontend rule:

1. if no pallet is used, this is manual outbound
2. in manual outbound, `source_location_id` must be visibly required before submit
3. frontend may block empty submit early
4. frontend must not fake stock validation locally
5. real balance validation still belongs to backend

### A4. Destination area

The outbound page must keep destination fields:

- `machine_id`
- `work_order_id`
- `purpose`

Hard rule:

1. machine is default-required at frontend display level when the current config says so
2. frontend may show required markers and block obviously empty submit
3. real required-rule enforcement still belongs to backend
4. do not remove `work_order_id` or `purpose` from the page boundary just because they are optional in the first closure

### A5. Action buttons

Minimum required actions:

1. `Submit and Post` action is mandatory
2. `Create Draft` action may exist if the chosen UI shape needs it, but it must not replace submit/post closure
3. no fake “success” is allowed before backend returns success

### A6. Required request behavior

For outbound closure, the page must call approved contracts only.

Required behavior:

1. pallet-based path may start from `pallet.get_by_code`
2. outbound submit must land on `rm_outbound.submit_and_post`
3. if draft-first UI is used, draft creation must land on `rm_outbound.create_draft`
4. request payloads must respect backend contract fields
5. request / response handling must preserve `contract_version:"v1"` discipline

### A7. Outbound page acceptance

The outbound page is acceptable only when all of the following are true:

- pallet path works
- manual fallback path works
- no-pallet submit visibly requires `source_location_id`
- backend `INSUFFICIENT_STOCK` can be surfaced clearly
- stock deduction is understood by UI as submit/post result only
- no stock deduction is simulated in frontend
- machine-required behavior can be reflected at page level
- existing inbound page / earlier page capability is not broken

### A8. Rollback point

If this deliverable fails:

- rollback only outbound page entry / route / page-level wiring
- do not rollback recycle page
- do not rollback earlier inbound page
- do not rollback S4 backend unless page code proves the backend contract is unusable

---

## 6. Deliverable B — Destination reroute entry

Create the minimum frontend reroute entry.

### B1. Purpose

Allow users to change destination after outbound submission, without rewriting submitted history.

### B2. Minimum required inputs

The reroute entry must include:

- outbound record selector
- new machine input
- reason input

Optional display fields may include:

- current machine
- current work order
- current purpose
- target work order
- target purpose

### B3. Required behavior

1. reroute entry must target an already submitted outbound record
2. frontend calls `rm_outbound.reroute`
3. frontend must clearly show that reroute is a trace action, not direct history edit
4. result area must show readable from -> to evidence when backend returns it
5. quantity must not be editable in reroute entry
6. reroute entry must not pretend to change stock quantity

### B4. Reroute acceptance

This deliverable is acceptable only when all of the following are true:

- user can select a submitted outbound record
- user can submit a new machine plus reason
- original outbound history is not presented as silently overwritten
- reroute record is traceable
- stock quantity is unchanged

### B5. Rollback point

If this deliverable fails:

- rollback only the reroute entry button / dialog / page section
- do not rollback outbound page
- do not rollback recycle page
- do not rollback S4 reroute backend unless the contract itself is proven broken

---

## 7. Deliverable C — Recycle page

Create the minimum usable recycle page.

### C1. Page structure

The recycle page must include exactly these three entry groups:

1. recycle summary entry
2. recycle process entry
3. recycle scrap entry

The page may be one page with three sections, or a page with three visible action areas.
Do not split into unnecessary new product-level modules.

### C2. Recycle summary entry

Purpose:
default entry for recycle batch identity creation.

Minimum required inputs:

- `machine_id`
- `shift`
- `date`
- multi-line recycle items

Each line must support at least:

- `source_item_code`
- `grade_usability`
- `qty`
- `remarks` if needed

Required behavior:

1. summary submit must call `recycle_summary.submit_and_generate_batches`
2. if draft-first UI is used, draft creation must call `recycle_summary.create_draft`
3. frontend must make it clear that one submitted line becomes one recycle batch identity
4. do not present “merge lines” behavior in Batch 4

### C3. Recycle process entry

Purpose:
repeatable cost event entry.

Minimum required inputs:

- recycle batch selector
- `process_type`
- `total_cost`

Optional visible fields may include:

- input quantity
- output quantity
- loss quantity
- remarks

Hard rule:

1. `total_cost` must be visibly required
2. `cost_breakdown` is not required in Batch 4
3. if pre-embedded UI for `cost_breakdown` exists, it must stay hidden or disabled by default
4. frontend must not calculate accumulated cost as source of truth
5. accumulated cost truth belongs to backend response

Required behavior:

1. process submit calls `recycle_process.submit_and_apply`
2. if draft-first UI is used, draft creation calls `recycle_process.create_draft`
3. page can run repeated submits against the same recycle batch
4. page must display accumulated-cost result returned from backend in a readable way

### C4. Recycle scrap entry

Purpose:
official scrap-closing entry.

Minimum required inputs:

- recycle batch selector
- reason

Minimum display requirement:

- show the loss amount to be closed, or show the returned loss amount after backend success

Hard rule:

1. scrap closing must call `recycle_scrap.submit_and_close`
2. frontend must not offer any alternative shortcut to mark recycle batch as scrapped
3. frontend must not directly modify `process_status` or `is_closed`
4. closure truth belongs to backend result

### C5. Recycle page acceptance

The recycle page is acceptable only when all of the following are true:

- summary entry can generate recycle batch identity
- process entry can be submitted multiple times against one batch
- accumulated cost can be observed after repeated process submits
- scrap entry can close the recycle batch
- scrap result shows loss amount equal to accumulated backend cost
- traceability remains visible at result level
- recycle page does not break outbound page

### C6. Rollback point

If this deliverable fails:

- rollback by entry group in this order:
  1. recycle scrap entry
  2. recycle process entry
  3. recycle summary entry
- do not rollback outbound page
- do not rollback S4 backend unless the page proves backend contract unusable

---

## 8. Deliverable D — Full-chain adversarial validation

S5 must not stop at page rendering.
It must prove that Batch 4 works end-to-end.

### D1. Required validation cases

Run and record all of the following:

1. coded outbound
2. manual outbound
3. machine-required behavior
4. destination reroute traceability
5. recycle batch identity generation
6. repeated recycle process cost accumulation
7. recycle scrap closing with accumulated loss amount

### D2. Case details

#### Case 1 — coded outbound

Expected result:

- pallet scan works
- returned material context is visible
- submit/post succeeds
- backend closes deduction correctly

#### Case 2 — manual outbound

Expected result:

- user can submit without pallet
- `source_location_id` is required
- submit succeeds only when backend accepts it

#### Case 3 — insufficient stock

Expected result:

- manual outbound with insufficient balance is blocked
- backend returns `INSUFFICIENT_STOCK`
- frontend surfaces it clearly
- no fake success is shown

#### Case 4 — machine required

Expected result:

- when current config says machine is required, missing machine blocks submit
- frontend reflects requiredness clearly
- backend remains source of truth

#### Case 5 — destination reroute

Expected result:

- reroute goes through reroute entry
- original history is not erased
- traceability from old destination to new destination is readable
- quantity stays unchanged

#### Case 6 — recycle batch identity

Expected result:

- recycle summary submit creates recycle batch identity
- created identity can be selected later

#### Case 7 — repeated recycle process

Expected result:

- same recycle batch accepts two process submissions
- accumulated cost equals the sum of repeated `total_cost` events

#### Case 8 — recycle scrap closing

Expected result:

- scrap closes the recycle batch
- returned `loss_amount` equals accumulated recycle cost
- closed result remains traceable back to process events

### D3. Evidence rule

For each validation case, preserve readable evidence such as:

- screenshot
- response snapshot
- visible page state
- recorded error message
- record identifier

Do not claim acceptance without evidence-friendly result capture.

### D4. Rollback point

If one validation case fails:

- rollback only the related frontend entry or related small page wiring
- do not broad-refactor the whole frontend
- do not rollback unrelated successful entries

---

## 9. Hard rules for S5

These are non-negotiable in S5.

### Rule 1

S5 is frontend only.

Do not implement:

- backend posting rules
- backend stock deduction rules
- backend cost accumulation rules
- backend permission design
- backend data model redesign

### Rule 2

Frontend must not carry true business logic.

Frontend may do:

- input collection
- basic empty-field blocking
- display
- request sending
- result rendering

Frontend must not do:

- stock source of truth
- cost source of truth
- final state transition
- silent history rewrite
- scrap closing by local state

### Rule 3

Do not bypass approved backend contracts.

All closure actions must go through the approved APIs.

### Rule 4

Do not silently consume backend errors.

Especially preserve clarity for:

- `INSUFFICIENT_STOCK`
- machine-required failure
- permission failure
- contract misuse failure

### Rule 5

Do not break Batch 3 pallet capability.

Reuse the existing pallet entry / scan logic as foundation.
Extend minimally.

### Rule 6

Do not force pallet path.

Manual outbound fallback must remain available.

### Rule 7

Do not over-polish UI.

S5 is closure stage, not visual redesign stage.

### Rule 8

Do not invent real frontend root paths, route roots, or deployment locations if project boundary files do not confirm them.

Follow `AGENTS.md` and actual repository reality.

---

## 10. Explicit non-goals for S5

The following are outside S5 unless explicitly added by project owner files:

- broad UI redesign
- component library migration
- new dashboard system
- analytics expansion
- generalized report center
- backend contract redesign
- accounting integration
- advanced cost breakdown enablement
- production work-order full system
- unrelated refactor

---

## 11. Stage completion checklist

S5 is complete only when all items below are true:

- outbound page exists
- outbound page supports pallet-assisted flow
- outbound page supports manual fallback flow
- manual fallback visibly requires `source_location_id`
- outbound submit lands on approved backend contract
- backend `INSUFFICIENT_STOCK` can be clearly surfaced
- destination reroute entry exists
- reroute action preserves traceability and does not erase history
- recycle page exists
- recycle summary entry exists
- recycle process entry exists
- recycle scrap entry exists
- repeated recycle process submits can be performed against one batch
- accumulated cost result can be observed
- scrap closing result can be observed
- full-chain adversarial cases have been run
- evidence for validation exists
- no unrelated earlier page capability is broken
- smallest relevant frontend checks have been run
- results are reported with template

If any one item above is false, S5 is not complete.

---

## 12. Required self-check before claiming S5 done

Before claiming S5 completion, the agent must verify:

1. only S5 frontend scope was modified
2. no S4 backend redesign was mixed in
3. no unrelated files were modified without necessity
4. outbound and recycle are both present
5. reroute entry exists
6. manual outbound fallback still works
7. batch acceptance cases have evidence
8. any unfinished issue is clearly listed

If checks cannot be completed, report exactly why.

---

## 13. Required delivery format

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

## 14. One-sentence summary

S5 means:
build the minimum outbound page, destination reroute entry, recycle page, and full-chain adversarial validation for Batch 4, while keeping all real business logic in backend and closing the whole batch as one chain.
