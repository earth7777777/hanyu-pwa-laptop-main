# DOC_RULES.md

## 1. Purpose

This file defines documentation sync rules for the project.

Its job is simple:

when code facts change, the related documents must be updated in the correct place.

This file does not define implementation tasks.
This file does not define batch scope.
This file does not replace:

- `AGENTS.md`
- `TASK_BATCH_*.md`
- `TASK_STAGE_*.md`
- `ACCEPTANCE_*.md`

Big picture in plain words:

code changes are not complete if the related long-term documents are left behind.

---

## 2. Core principle

Only sync documents from confirmed code facts.

Do not write documentation from:

- guesses
- future wishes
- temporary discussion
- unmerged ideas
- assumed paths
- assumed contracts
- assumed data model

If a code fact is not confirmed by actual repository reality, do not document it as settled truth.

---

## 3. What counts as a code fact

A code fact means one of the following is true:

1. the code was actually changed
2. a new file / object / endpoint / command / config was actually added
3. an existing behavior was actually changed
4. an old behavior was actually removed
5. a real deployment or runtime step was actually changed
6. a document path or entry relationship became true in the repository

If none of the above is true, do not update long-term project docs.

---

## 4. Document sync rule by change type

Use the rules below literally.

### 4.1 Interface / API change -> update `API_SPEC.md`

Update `API_SPEC.md` when any of the following changes become real:

- new endpoint is added
- existing endpoint path changes
- request field changes
- response field changes
- response structure changes
- error code changes
- permission rule changes at API level
- contract version changes
- submit/post boundary changes exposed through API

At minimum, update:

- endpoint name or path
- method
- request fields
- response fields
- error codes
- contract notes
- special constraints

Do not leave `API_SPEC.md` stale after API changes.

---

### 4.2 Data object / field / state change -> update `DATA_MODEL.md`

Update `DATA_MODEL.md` when any of the following changes become real:

- new object / DocType is added
- key field is added
- key field is removed
- field meaning changes
- allowed values change
- relation between objects changes
- state field changes
- status transition rule changes
- protected mapping changes
- key validation constraint becomes true in code

At minimum, update:

- object name
- key fields
- field meanings
- allowed values
- relations
- state fields
- key constraints

Do not treat temporary UI labels as data model facts.

---

### 4.3 Project-wide structure / module boundary / main flow change -> update `PROJECT_BLUEPRINT.md`

Update `PROJECT_BLUEPRINT.md` when any of the following changes become real:

- new module is added
- module responsibility changes
- major flow changes
- project boundary changes
- front-end / back-end lane boundary changes
- long-term architecture direction changes already landed in code
- protected foundation relationship changes
- officially adopted non-goals or hard boundaries change

At minimum, update:

- project goal
- module split
- main flow
- current boundary
- current scope
- explicit non-goals if changed

Do not turn `PROJECT_BLUEPRINT.md` into a task list.

---

### 4.4 Local run / migration / troubleshooting / command change -> update `OPERATIONS.md`

Update `OPERATIONS.md` when any of the following changes become real:

- startup command changes
- migration command changes
- local run order changes
- required service startup order changes
- common troubleshooting steps become necessary
- debug command changes
- environment boot sequence changes
- developer operation sequence changes

At minimum, update:

- command
- when to use it
- order of use
- expected result
- common failure note if needed

Do not put deployment-only steps into `OPERATIONS.md`.

---

### 4.5 Deployment / environment / release change -> update `DEPLOYMENT.md`

Update `DEPLOYMENT.md` when any of the following changes become real:

- deployment steps change
- environment variables change
- server requirement changes
- build output path changes
- release procedure changes
- online configuration changes
- process manager or hosting method changes
- reverse proxy / domain / network requirement changes

At minimum, update:

- environment requirement
- deployment steps
- config items
- environment variables
- deployment notes
- release caution if needed

Do not mix local operations into `DEPLOYMENT.md` unless the local step is a required deployment prerequisite.

---

### 4.6 Project entry / navigation / current status / doc index change -> update `README.md`

Update `README.md` when any of the following changes become real:

- project entry method changes
- quick start changes
- main directory meaning changes
- related document list changes
- current project status changes in a way new readers must know
- project naming or scope summary changes

At minimum, update:

- project intro
- current status
- directory note
- quick start
- related document links

Keep `README.md` short and navigational.

Do not dump full technical detail into `README.md`.

---

## 5. Special rules for control files

The files below are control files.
They are not synced from ordinary code changes by default.

### 5.1 `AGENTS.md`

Update only when long-term execution rules change, such as:

- editable scope changes
- forbidden scope changes
- read order changes
- delivery structure changes
- hard execution boundary changes
- front-end / back-end lane rules change
- missing-information stop rule changes

Do not update `AGENTS.md` just because one stage added one feature.

### 5.2 `TASK_BATCH_*.md`

Update only when batch-level intent changes, such as:

- batch goal changes
- stage order changes
- batch hard rules change
- batch completion boundary changes
- batch non-goals change

Do not update batch files for routine implementation detail already covered by stage files or project docs.

### 5.3 `TASK_STAGE_*.md`

Update only when current stage requirements change, such as:

- stage deliverables change
- stage hard rules change
- stage completion checklist changes
- stage rollback boundary changes

Do not rewrite past stage files after completion unless the project owner explicitly orders it.

### 5.4 `ACCEPTANCE_*.md`

Update only when acceptance truth changes, such as:

- new must-pass item becomes real
- old must-pass item is removed by decision
- evidence requirement changes
- failure condition changes
- stage or batch pass logic changes

Do not change acceptance files just to make a failing result look green.

### 5.5 `CHANGE_REPORT_TEMPLATE.md`

Update only when the delivery format itself changes.

Do not change it because one report felt inconvenient once.

---

## 6. Mapping table

Use this mapping table as the default decision rule.

| Real change                                                    | Must update                 |
| -------------------------------------------------------------- | --------------------------- |
| New API / API field / error code / contract version            | `API_SPEC.md`               |
| New object / field / relation / state / allowed value          | `DATA_MODEL.md`             |
| New module boundary / major flow / long-term structure         | `PROJECT_BLUEPRINT.md`      |
| New startup command / migration step / troubleshooting command | `OPERATIONS.md`             |
| New deployment step / env var / release process                | `DEPLOYMENT.md`             |
| New entry method / quick start / document navigation           | `README.md`                 |
| Long-term execution rule change                                | `AGENTS.md`                 |
| Batch-level goal / order / boundary change                     | `TASK_BATCH_*.md`           |
| Stage-level requirement / checklist / rollback change          | `TASK_STAGE_*.md`           |
| Acceptance truth / failure condition / evidence rule change    | `ACCEPTANCE_*.md`           |
| Delivery report format change                                  | `CHANGE_REPORT_TEMPLATE.md` |

If one real change affects multiple document types, update all affected files.
Do not choose only one when multiple are required.

---

## 7. Multi-document sync rules

One change may require multiple document updates.

Examples:

### Example 1

A new whitelist API for outbound is added.

Then update:

- `API_SPEC.md`
- `README.md` if the entry or quick start changed
- `OPERATIONS.md` if new test / run command became necessary

### Example 2

A new DocType is added with new states and relations.

Then update:

- `DATA_MODEL.md`
- `PROJECT_BLUEPRINT.md` if project flow or module split changed

### Example 3

A new deployment step is required because build output path changed.

Then update:

- `DEPLOYMENT.md`
- `OPERATIONS.md` if local build/run order also changed
- `README.md` if quick start changed

### Example 4

A long-term execution rule changes, such as front-end / back-end editable scope.

Then update:

- `AGENTS.md`
- `PROJECT_BLUEPRINT.md` if module boundary explanation also changed

Do not assume one change means one document only.

---

## 8. What must not be documented as settled truth

Do not write any of the following into long-term docs as if already true:

- planned future module not yet implemented
- guessed API path
- guessed request / response field
- guessed DocType location
- guessed frontend route
- guessed deployment path
- temporary debug idea
- one-time experiment result that was not adopted
- stage wish list not yet landed
- business preference not yet reflected in code or approved rule files

Keep future ideas in planning files, not in fact documents.

---

## 9. Required sync order after code change

After a real code change lands, sync docs in this order:

1. update fact documents first:
   - `API_SPEC.md`
   - `DATA_MODEL.md`
   - `PROJECT_BLUEPRINT.md`
   - `OPERATIONS.md`
   - `DEPLOYMENT.md`
   - `README.md`
     as needed

2. then update control files only if execution truth changed:
   - `AGENTS.md`
   - `TASK_BATCH_*.md`
   - `TASK_STAGE_*.md`
   - `ACCEPTANCE_*.md`
   - `CHANGE_REPORT_TEMPLATE.md`

3. then report which docs were updated and why

Big picture in plain words:

fact docs follow code facts first.
control files change only when the rules themselves changed.

---

## 10. Missing-doc rule

If a document should be updated by rule but does not yet exist:

1. report that the required document is missing
2. do not pretend it was updated
3. if project owner allows, create the missing document in the correct category
4. keep content limited to confirmed facts only

Do not silently skip required documentation because the file was absent.

---

## 11. Minimal documentation standard

When updating a document, update enough for future use.

Do not leave half-finished placeholders like:

- `TODO`
- `fill later`
- `to be updated`
- `maybe`
- `probably`

unless the project owner explicitly requested a temporary placeholder.

If a fact is known, write it clearly.
If a fact is unknown, say it is unknown.
Do not blur the two.

---

## 12. Reporting requirement for documentation sync

Every implementation report must include a documentation sync note.

If no document update was needed, say exactly:

- no long-term document update required

If document updates were needed, list:

- which files were updated
- why each one was updated
- which code fact triggered the update

Do not use vague text like:

- docs synced
- docs updated
- documentation adjusted

Be specific.

---

## 13. One-sentence summary

`DOC_RULES.md` means:

when code facts change, update the correct long-term documents clearly, minimally, and truthfully — without mixing guesses, task steps, or future wishes into project facts.
