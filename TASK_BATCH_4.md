# TASK_BATCH_4.md

## 1. Batch identity

- Batch name: Batch 4
- Batch theme: Outbound + Recycle full closure
- Stage range: S4 -> S5
- Batch type: real project implementation, not experiment
- Execution mode: staged execution only

This batch is not complete if only one side is done.

The batch is complete only when:

- outbound closure is complete,
- recycle closure is complete,
- connection points are complete,
- batch acceptance is green.

Connection points for this batch:

- outbound destination reroute with traceability
- recycle process cost accumulation
- recycle scrap cost closing

---

## 2. Batch goal

Build the minimum real closure for:

- raw material outbound,
- recycle flow,
- reroute traceability,
- recycle cost accumulation,
- recycle scrap closing.

This batch must push the project from:

- inbound-side foundation already completed in earlier batches

to:

- outbound closure
- recycle closure
- batch-level traceable closure

This batch does not chase feature breadth.
This batch only chases minimum working closure with correct boundaries.

---

## 3. What this batch must achieve

By the end of Batch 4, the project must support all of the following as one connected chain:

### Outbound chain

- pallet-based outbound path
- manual outbound fallback path
- stock deduction only after submit/post
- machine destination collection
- reroute after submit with traceability
- no silent overwrite of submitted history

### Recycle chain

- recycle summary as default entry
- recycle batch identity creation
- recycle process as repeatable cost event
- total cost accumulation across multiple process records
- recycle scrap as the only scrap-closing path
- scrap loss amount equal to accumulated recycle cost
- closed recycle batch remains traceable

### Batch-wide closure

- outbound and recycle must both exist in the same accepted batch
- this batch cannot be accepted as half-finished
- acceptance must follow batch acceptance file, not subjective judgment

---

## 4. Stage order

This batch has exactly two execution stages.

### Stage S4

Type: backend

Goal:

- establish backend objects
- establish backend rules
- establish whitelist contracts
- establish posting / traceability / cost event foundations

S4 is the stage that makes the ledger and rules stand up first.

S4 must be completed and reported before S5 can start.

### Stage S5

Type: frontend

Goal:

- build the minimum frontend entry points
- connect frontend pages to approved backend contracts
- complete full-chain adversarial validation
- prove the batch works end-to-end

S5 is not allowed to redefine backend logic.
S5 only consumes approved backend behavior and proves closure.

---

## 5. Batch focus

This batch focuses on only these five things:

1. outbound posting closure
2. destination reroute traceability
3. recycle batch identity creation
4. recycle cost accumulation
5. recycle scrap closing

If a task does not directly help one of the five items above, it is probably outside Batch 4.

---

## 6. Batch dependencies from earlier batches

This batch depends on earlier completed foundations.

### Batch 1 dependency

Inbound draft creation foundation already exists.
Do not rewrite it unless current stage files explicitly require extension.

### Batch 2 dependency

The existing field-rule foundation around `f12 ~ f16` already exists.
Do not freely remap earlier meanings.

### Batch 3 dependency

Pallet capability already exists and must be reused as existing foundation.

The protected Batch 3 pallet rule is:

- `pallet_id -> f17`

Do not remap `pallet_id` back to `f12`.
Do not rewrite pallet foundation freely.

This batch may reuse existing pallet scan capability for outbound flow, but must treat Batch 3 as existing foundation, not rewrite territory.

---

## 7. Hard batch rules

### Rule 1: do not do only half the chain

Do not stop at:

- outbound only
- recycle only
- page only
- API only

Batch 4 is accepted only as one closed chain.

### Rule 2: frontend must not carry true business logic

Frontend is only for:

- collecting input
- showing data
- calling approved APIs

Do not move stock deduction, cost accumulation, posting rules, or traceability rules into frontend.

### Rule 3: submitted history must not be silently rewritten

Destination reroute must be a traceable action.
It must not erase the original submitted record.

### Rule 4: manual outbound must lock stock source

If outbound is manual and not tied to pallet flow, `source_location_id` is mandatory.
No guessed deduction source is allowed.

### Rule 5: recycle scrap must have one official path

Recycle scrap closing must go through the recycle scrap flow only.
No alternative shortcut is allowed to mark a recycle batch as scrapped.

### Rule 6: contract discipline is mandatory

All new batch contracts must follow the approved contract discipline.
Breaking changes must not silently replace the old contract.

### Rule 7: stage order is mandatory

Do not start S5 before S4 is completed, checked, and reported.

### Rule 8: no broad refactor

This batch is for closure, not architecture redesign.
Do not expand into unrelated optimization, styling cleanup, or wide refactor.

---

## 8. Batch object and capability boundary

This file defines batch scope only.
Detailed object fields and API details belong to stage files and supporting docs.

At the batch level, the implementation scope is limited to these capability groups:

### Outbound capability group

- outbound document
- outbound posting
- manual outbound fallback
- destination reroute

### Recycle capability group

- recycle summary
- recycle batch identity
- recycle process
- recycle scrap closing

### Frontend capability group

- outbound page
- reroute entry
- recycle page
- full-chain validation actions

Anything beyond these capability groups is outside Batch 4 unless explicitly added by project owner files.

---

## 9. Batch completion boundary

Batch 4 is complete only when all of the following are true:

- S4 is complete
- S5 is complete
- batch acceptance file is green
- outbound coded path works
- outbound manual path works
- manual outbound requires source location
- insufficient stock is blocked with clear error behavior
- machine-required rule is configurable and effective
- reroute is traceable and does not erase history
- recycle batch identity is created successfully
- multiple recycle process records accumulate cost correctly
- recycle scrap closes the batch and carries the accumulated loss amount
- closure remains traceable

If any one of the above is not true, Batch 4 is not complete.

---

## 10. Explicit non-goals

The following are not goals of Batch 4 unless explicitly added by later files:

- broad warehouse redesign
- unrelated inbound redesign
- full UI polish pass
- analytics dashboard expansion
- generalized reporting system
- historical data migration project
- free refactor of earlier batch foundations
- new contract system unrelated to current batch
- advanced cost breakdown activation beyond current approved minimum

---

## 11. Execution expectation

When executing this batch, the agent must:

1. read `AGENTS.md` first
2. read this file second
3. read the assigned stage file next
4. read `ACCEPTANCE_BATCH_4.md` before implementation is considered complete
5. execute one stage at a time
6. self-check before claiming completion
7. report with the required template
8. stop if real project boundary is missing

This file defines batch-level intent and order.
It does not replace:

- `TASK_STAGE_S4.md`
- `TASK_STAGE_S5.md`
- `ACCEPTANCE_BATCH_4.md`

---

## 12. Batch summary in one sentence

Batch 4 means:
build the minimum real closure for outbound plus recycle, in two stages, with traceability, correct posting boundaries, and full acceptance as one chain.
