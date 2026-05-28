# AGENTS.md - Codex Production Directives

These directives are written for Codex operating in this repository. They
override any default tendency toward shallow, fast, or incomplete output.

The governing loop for all work is: **gather context -> take action ->
verify work -> repeat**.

---

## 1. Pre-Work

### Step 0: Delete Before You Build

Before any structural refactor on a file larger than 300 lines, first
remove dead code: unused props, unused exports, unused imports, stale
helpers, and debug logs. If restructuring makes more code obsolete, remove
that too. Do not leave ghosts behind.

### Phased Execution

Do not attempt broad multi-file refactors in a single pass unless the user
explicitly asks for it. Break the work into phases. Keep each phase small
enough to reason about and verify properly. For larger changes, complete
Phase 1, verify it, report results, and wait for approval before moving to
the next phase.

### Plan and Build Are Separate Steps

If the user asks for a plan, or asks to think first, provide only the plan.
Do not write code until the user says to proceed.

If the user gives a written plan, follow it exactly. If you find a real
technical flaw in the plan, call it out clearly and stop for confirmation.
Do not silently improvise.

If the request is vague, do not start building. First describe what you
would build, where it belongs, and what tradeoffs matter.

### Spec-Based Development

For non-trivial work with multiple implementation decisions, first clarify
the contract. In Codex, use `request_user_input` when available in Plan
mode; otherwise ask concise direct questions in chat only when necessary.
Reduce ambiguity before editing code.

The spec is the contract. Execute against the agreed spec, not assumptions.

---

## 2. Understanding Intent

### Follow References, Not Descriptions

When the user points to existing code as a reference, inspect that code
first and match its conventions. Existing working code is a stronger spec
than a prose description.

### Work From Raw Data

When debugging, work from actual logs, stack traces, failing tests, and
repro steps. Do not guess. Trace the concrete failure.

If the bug report lacks raw error output and the failure cannot be derived
locally, ask for the console output or failing log directly.

### One-Word Mode

If the user says “yes”, “do it”, “push”, or similar after prior context has
already established the task, execute immediately. Do not restate the plan.

---

## 3. Code Quality

### Senior Dev Override

Do not settle for band-aids when the local design is clearly flawed. If the
change exposes duplicated state, inconsistent patterns, leaky abstractions,
or structural weakness, fix the underlying problem within scope and explain
the reasoning.

Ask: “What would a strong senior reviewer reject here?” Then address it.

### Forced Verification

Never report work as complete just because files were edited successfully.
Before closing the task, run all applicable verification that exists in the
repo:

- Type-checker / compiler
- Linter
- Tests
- Relevant manual validation or runtime checks

If one of these does not exist, say so explicitly. If one exists but cannot
be run, say why. Do not claim success with outstanding errors.

### Write Human Code

Write code that looks like an experienced human wrote it. Avoid noisy
commentary, decorative abstractions, and boilerplate explanations of obvious
logic.

### Don’t Over-Engineer

Do not design for hypothetical future requirements that the user did not
ask for. Prefer solutions that are simple, correct, and maintainable.

### Demand Elegance

For non-trivial work, pause and check whether the solution is merely working
or actually clean. If the first fix is obviously hacky, replace it with the
cleaner design before presenting it.

---

## 4. Context Management

### Use Delegation When It Helps

If the task spans many independent files or parallelizable subtasks, use
Codex sub-agents where appropriate. Give each sub-agent a narrow, concrete,
self-contained responsibility. Keep ownership boundaries clear so changes do
not conflict.

Do not delegate the immediate critical-path task if doing it locally is
faster and clearer.

### Context Decay Awareness

After a long conversation or after substantial time has passed, re-read any
file before editing it. Do not trust memory of file contents.

### Persistent State

Use the file system as durable memory when the task is long-running or
multi-step. If useful, maintain concise notes in files like
`context-log.md` or `gotchas.md` so future work can resume cleanly.

### File Read Discipline

Do not dump large files into context without need. Search first, then read
only the relevant sections. For very large files, inspect them in chunks.

### Tool Output Skepticism

If a search or shell result looks suspiciously incomplete, narrow the scope
and rerun it. Assume truncation or overly broad queries before assuming
absence.

---

## 5. File System as Working Memory

Use the file system actively instead of holding everything in chat context.

- Prefer targeted search over reading whole files.
- Save intermediate outputs when that makes debugging or verification more
  reliable.
- Use shell tools for filtering, searching, and inspecting project state.
- Preserve useful notes, decisions, and follow-up items in repo-local
  markdown files when that improves continuity.
- When debugging, keep reproducible logs or command outputs if they help
  validate the fix.

---

## 6. Edit Safety

### Edit Integrity

Before every edit, re-read the file. After every edit, read the affected
section again to verify the change landed correctly.

Do not make repeated blind edits against stale file contents.

### No Semantic Assumptions

Codex does not have guaranteed whole-program semantic awareness from a
single search. When renaming or changing a symbol, search separately for:

- Direct references and call sites
- Type references
- String literals containing the name
- Dynamic imports / requires
- Re-exports and barrel entries
- Tests, fixtures, and mocks

Assume one search pattern is insufficient.

### One Source of Truth

Do not solve rendering or state bugs by duplicating state. Keep one
authoritative source and derive everything else from it.

### Destructive Action Safety

Do not delete files until you verify nothing still references them. Do not
revert user changes unless explicitly asked. Do not push or perform other
shared-repo actions unless explicitly told to do so.

---

## 7. Codex Workflow Awareness

### Stay Within Codex’s Real Tooling

Do not write instructions that depend on unsupported Claude-specific
features or slash commands. Use the actual Codex toolset available in this
environment: shell commands, file reads, `apply_patch`, planning tools,
verification commands, and sub-agents when explicitly appropriate.

### Keep the Prefix Stable

Do not suggest changing models or tool availability mid-task unless the user
explicitly asks. Solve the task with the current environment.

---

## 8. Self-Improvement

### Mistake Logging

If the user corrects a recurring mistake or workflow issue, record the
lesson in `gotchas.md` when appropriate so the same mistake is less likely
to recur.

### Bug Autopsy

After fixing a bug, explain briefly why it happened and what would prevent
that category of bug in the future.

### Two-Perspective Review

For meaningful tradeoffs, present both views:

- What a perfectionist reviewer would still criticize
- What a pragmatist would accept as sufficient

Let the user choose when the tradeoff is real.

### Failure Recovery

If two fix attempts fail, stop and reassess. Re-read the relevant code
top-down, identify where the mental model was wrong, and explain the new
understanding before trying again.

### Fresh Eyes Pass

When testing your own change, evaluate it like a new user would. Flag rough
edges, confusing behavior, or missing validation.

---

## 9. Housekeeping

### Autonomous Bug Fixing

When given a concrete bug report, own the problem end-to-end. Trace the
failure, implement the fix, and verify it without asking the user to manage
the process for you unless you are blocked on missing external information.

### Proactive Guardrails

If a file is becoming hard to reason about, say so. If the repo lacks basic
validation, tests, or safety checks in the area you are touching, note that
once and propose the smallest useful guardrail.

### Batch Changes

When the same change must be applied across many files, group the work into
clear batches and verify each batch before moving on.

### File Hygiene

Prefer small, focused, navigable files. If a file has become unwieldy,
recommend splitting it along real responsibility boundaries.


<claude-mem-context>
# Memory Context

# [pf2e-leveler] recent context, 2026-05-28 10:00am GMT+3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (16,091t read) | 818,620t work | 98% savings

### May 3, 2026
S834 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 3 at 1:42 PM)
S120 Feat retraining implementation for pf2e-leveler — Task 2 complete (validator + apply), Task 3 (planner UI) in progress (May 3 at 1:42 PM)
### May 28, 2026
S835 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 28 at 7:52 AM)
S836 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 28 at 7:57 AM)
6756 8:29a 🔵 createMockActor Sets items as Non-Iterable Mock Object — for...of Fails
6757 " 🟣 New Test: Gradual Boost Partial Display Preserved When Previewing Next Gradual Set
6758 8:30a 🔴 Fixed getAppliedBoostsForLevel Order: Gradual Lookup Must Run Before Direct Bucket Lookup
6760 " ✅ pf2e-leveler Bumped to Version 3.4.28 With 4-Item CHANGELOG
6761 8:31a ✅ Version 3.4.28 Confirmed Across All Files, Lint Clean, Tests Running
6762 " ✅ pf2e-leveler 3.4.28 Fully Verified and Ready to Commit
6763 8:32a ✅ Session Complete: pf2e-leveler 3.4.28 Ready for Commit
6764 " 🔵 Partial Boost UI Pipeline Confirmed: template → CSS → i18n All Consistent
6765 8:33a 🟣 Added pendingPartial Field and UI Display for Unselected Partial Boost Buttons
6766 " 🟣 pendingPartial UI Applied Across All Three Template Files
6767 " 🟣 pendingPartial Template Test and Existing Test Updates Pass
6768 " ✅ CHANGELOG 3.4.28 Updated With Fifth Item for Partial Boost Label Display
6769 " ✅ pf2e-leveler 3.4.28 CHANGELOG Finalized With 5 User-Facing Items
6770 8:34a ✅ intelligence.test.js 39/39 and Lint Clean After pendingPartial Addition
6771 " ✅ pf2e-leveler 3.4.28 Final: 1467 Tests, 86 Suites, Lint Clean — Ready to Commit
6772 " ✅ Final Code Review Confirmed: pendingPartial Field and Template Display Correct
6773 8:37a 🔵 Open User Question: Levels 7 and 8 Not Showing +4(partial) for Gradual Boosts
6774 8:38a 🔵 Levels 7-8 pendingPartial=false Bug: buildAppliedLevelAttributeBaseline Cannot Detect Fractional Raw From Integer Actor Mod
6775 " 🔴 Fixed buildAppliedLevelAttributeBaseline to Use Reconstructed Raw for Pending Partial Detection
6776 8:39a ✅ pf2e-leveler 3.4.28 Final: 1468 Tests, 86 Suites Pass After Applied-Level Partial Fix
6777 8:41a 🔵 buildAppliedLevelAttributeBaseline Change Preserves All Existing Test Semantics
6778 " 🟣 Additional Test Confirms pendingPartial Display for Current Standard Boost Level
6779 8:42a 🔵 Object-Shaped PF2e Boost Buckets Not Handled by buildKnownInitialAttributeBaseline
6781 8:43a 🔴 normalizeActorBoostEntries Extended to Handle Array-Valued Slot Objects
6782 8:44a 🔴 index.js normalizeActorBoostEntries Also Patched for Array-Value Slot Format
6783 " ✅ 42 Intelligence Tests, 92 Bootstrap Tests Pass; Lint Clean After All normalizeActorBoostEntries Fixes
6785 " ✅ pf2e-leveler 3.4.28 Final Verified: 1470 Tests, 86 Suites, Lint Clean
6788 8:45a ✅ Final Code Review Confirms All pendingPartial and normalizeActorBoostEntries Diffs Are Correct
6792 8:47a ✅ CHANGELOG Patch Version Increment Requested
6793 8:48a 🔵 pf2e-leveler Project State: Version 3.4.28 with Uncommitted Level-Planner Changes
6794 " ✅ pf2e-leveler Bumped from 3.4.28 to 3.4.29
6795 " ✅ pf2e-leveler 3.4.29 Full Test Suite Passes: 1470/1470
6796 " 🔵 3.4.29 CHANGELOG Entry Expands Partial Boost Label Description
6797 8:49a 🟣 pf2e-leveler 3.4.29 Release: Five Level Planner Fixes Documented
6798 " ✅ CHANGELOG Restructured: 3.4.29 Correctly Isolated from 3.4.28 Entries
6849 9:39a 🟣 New failing test for auto-scaling feat skill visibility bug
6850 " 🔵 Confirmed bug: acrobatics entry returns undefined when actor rank matches planned feat rank
6852 " 🔴 Fixed: auto-scaling feat skills disappearing from skill picker when actor rank matches planned feat rank
6853 9:40a ✅ CHANGELOG.md updated for auto-scaling feat skill fix in 3.4.29
6854 " 🔴 pf2e-leveler 3.4.29 fix verified: all tests pass and lint clean
6855 " 🔴 Full pf2e-leveler test suite passes: 1471/1471 tests green for v3.4.29
6860 9:44a 🔴 Free Heart Background Lore Skill Not Available at Character Creation Level
6861 9:50a 🔴 Same-Level Feat-Granted Lore Now Appears in Skill Increase Picker Immediately
6862 " 🔴 Auto-Scaling Feat Skills Stay Visible After Owned Actor Rule Catches Up
6868 9:53a ✅ Patch Version Increment with Changelog Entry
6869 9:54a 🔵 pf2e-leveler Current Version and Project Structure Confirmed
6870 " 🔵 Files Staged for 3.4.30 Patch Release
6871 " ✅ pf2e-leveler Bumped to 3.4.30 with Free Heart Lore Fix Changelog Entry
6873 " 🔵 ESLint Passes Clean on 3.4.30 Release Candidate
6874 " 🔵 Full Test Suite Passes for 3.4.30 Release

Access 819k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>