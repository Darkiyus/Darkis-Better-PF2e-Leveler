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

# [pf2e-leveler] recent context, 2026-05-28 1:37pm GMT+3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (21,242t read) | 291,990t work | 93% savings

### May 3, 2026
S834 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 3 at 1:42 PM)
S120 Feat retraining implementation for pf2e-leveler — Task 2 complete (validator + apply), Task 3 (planner UI) in progress (May 3 at 1:42 PM)
### May 28, 2026
S835 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 28 at 7:52 AM)
S836 Free Heart Background: Prompt for untrained skill replacement when background grants an already-trained skill (May 28 at 7:57 AM)
6874 9:54a 🔵 Full Test Suite Passes for 3.4.30 Release
6906 10:08a ⚖️ Extend Feat Fix to Cover "Additional Lore" Feats Like Operatic Adventurer
6908 10:09a 🔵 getDerivedFeatLoreRules Already Covers Operatic Adventurer; Fix Was Broader Than Initially Stated
6909 " 🟣 Test Added for Same-Level Derived Feat Lore in Skill Increase Picker (Operatic Adventurer)
6910 " ✅ CHANGELOG Updated to Reflect Broader Same-Level Lore Fix Scope
6981 12:30p 🔵 pf2e-leveler Initial Skill Import System Architecture
6982 " 🔵 Initial Skill Import Dialog: Duplicate-Skill Fallback Detection Architecture
6983 12:31p 🔵 `getImportedInitialSkillLimit` Has No Class-Specific Branching
6984 12:32p 🔵 INVESTIGATOR Class Definition and Rule Extraction Discrepancy Between context.js and build-state.js
6986 " 🔵 Initial Skill Dialog Selection Normalization: Fallback Choices Count Against Flexible Pick Limit
6988 12:33p 🔵 Two Divergent `reverseApplyAbilityBoost` Implementations
6991 12:34p 🔴 Fixed `getLevelOneIntModifier` Over-Subtracting INT When Modifier Sits at the Ability Score Cap Boundary
6993 " 🔴 Prevent Duplicate Fallback Prompts When Description-Text and Rule-Based Detection Both Fire
6994 " 🔴 Test Mock Actor Missing `abilities`/`build` Properties for INT Boost Test
6996 12:35p ✅ All Tests Green — Preparing Changelog Entry for v3.4.31
6997 " ✅ pf2e-leveler Released as v3.4.31
6998 " 🔴 v3.4.31 Passes Full Lint Check
6999 " 🔴 `npm version` Does Not Update `module.json` in pf2e-leveler
7001 " ✅ pf2e-leveler v3.4.31 Full Test Suite Green
7002 12:36p ✅ v3.4.31 Complete Changeset Ready to Commit — 9 Files Changed
7020 1:17p 🔵 Level Planner Skill Grant Logic Conflates "Granted" vs "Trained" States Incorrectly
7021 1:18p 🔵 Dual Code Paths in `buildInitialSkillChoiceSetsAndFallbacks` Produce "Already Trained" vs "Already Granted" Inconsistency
7022 1:19p 🔵 `getAutomaticInitialSkillTrainingEntries` and `getInitialSkillSourceItems` Return Different Skill Sets — Root Cause of Double-Prompt
7023 " 🔴 Fixed Double-Prompt: Duplicate-Loop Now Skips Skills Already Covered by Fallback-Text Detection
7024 " 🔴 Test Updated to Assert Alchemist Dedication Does Not Produce a `duplicateSkillFallback_` Prompt
7025 " 🔴 All 92 Tests Pass and Lint Clean After Double-Prompt Fix in `context.js`
7026 1:20p 🔴 Full Test Suite Green: 1474/1474 Tests Pass Across All 86 Suites
7027 " ✅ Three Files Modified and Uncommitted: context.js, test file, and AGENTS.md
7028 1:21p 🔵 Initial Skill Choice-Sets Dialog CSS Uses Non-Standard Variable Names With Hardcoded Fallbacks
7029 " 🔵 Confirmed: Choice-Sets CSS Uses 6 Undefined Variable Names — All Fall Through to Hardcoded Values
7030 " 🔄 Choice-Sets Dialog CSS Refactored to Use Leveler Design Tokens
7033 1:24p 🔴 Dialog Scroll Constraint Moved From Inner Grid to Outer Container
7035 1:25p ✅ Full Suite Green After All v3.4.31 Dialog Fixes: 1474/1474 Tests, Lint Clean
7037 1:26p 🔵 Initial Skill Dialog Count Display Excludes Dropdown-Selected Replacement Skills
7038 " 🟣 Added Test Specifying Cross-Fallback Deduplication: Selecting a Skill in One Dropdown Should Disable It in Other Fallback Dropdowns
7040 1:27p 🔵 TDD Red Phase: "Ancient Elf Dedication" Test Fails — `initialSkills` Is `[]` Not `['deception']`
7042 1:28p 🔵 Interactive Fallback Test Accidentally Applied to Wrong Test Case — "Ancient Elf" Test Still Uses Simple Mock
7043 " 🔵 Interactive Fallback Test Now in Correct "Ancient Elf" Test — Failing Because `data-initial-skill-choice-fallback` Attribute Is Not Rendered
7045 1:29p 🟣 Cross-Fallback Skill Deduplication Implemented: Selecting Same Skill in Multiple Fallback Dropdowns Now Prevents Duplicates
7046 " 🟣 Full Suite Passes After Cross-Fallback Deduplication: 92/92 Tests, Lint Clean
7047 " 🟣 Full Suite Green: 1474/1474 Tests Pass — All Changes Verified and Commit-Ready
7048 " 🔵 Changes Split Across Staged and Unstaged: index.js and Latest Test Changes Are Unstaged
7051 1:32p 🔴 Final State Confirmed: All Code Changes Verified Before Commit
7052 " 🟣 Test Expanded: Fallback-Selected Skills Now Expected to Auto-Check Their Skill Cards and Increment the Counter
7053 1:33p 🟣 Fallback-Selected Skills Now Auto-Check and Lock Their Skill Cards in the Dialog
7054 " 🟣 Skill Card Auto-Lock Feature Complete: 92/92 Tests Pass, Lint Clean
7055 1:34p 🟣 Complete Starting Skill Training Dialog Overhaul Ready for Commit — 1474/1474 Tests Pass
7059 1:35p 🟣 Test Expanded: Manually-Checked Skill Cards Should Also Disable That Skill in Fallback Dropdowns
7060 " 🟣 Bidirectional Skill Card / Fallback Dropdown Sync Implemented
7061 1:36p 🟣 Full Bootstrap Suite Passes After Bidirectional Sync: 92/92 Tests, Lint Clean

Access 292k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>