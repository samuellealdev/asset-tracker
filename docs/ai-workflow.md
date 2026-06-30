# AI-Assisted Development Workflow

## Overview

Asset Tracker was built using a **human-directed, AI-assisted** development methodology powered by OpenCode, DeepSeek v4, and the GentleAI SDD orchestrator. Every design decision, architecture choice, and code review was directed by the human engineer — the AI acted as an accelerator, not a decision-maker.

## Toolchain

| Tool | Version | Purpose |
|------|---------|---------|
| [OpenCode](https://opencode.ai) | Latest | AI coding agent runtime with sub-agent orchestration |
| DeepSeek v4 | `deepseek-v4-pro` | LLM backend for code generation and reasoning |
| [GentleAI](https://github.com/Gentleman-Programming/gentle-ai) | Latest | SDD orchestrator with phase gates, skill registry, and enforcement rules |
| [Engram](https://github.com/Gentleman-Programming/engram) | Latest | Persistent memory system surviving session compactions |

## SDD Workflow (Spec-Driven Development)

Every feature and phase followed a structured 7-step pipeline (changes typically start with an optional exploration phase to investigate the codebase before committing to a proposal):

```
proposal → specs → design → tasks → apply → verify → archive
```

| Phase | Owner | What happens |
|-------|-------|-------------|
| **Proposal** | `sdd-propose` sub-agent | Defines intent, scope, approach. Product-level questions before any code |
| **Specs** | `sdd-spec` sub-agent | Writes delta specs with formal requirements and acceptance scenarios |
| **Design** | `sdd-design` sub-agent | Technical architecture decisions, component boundaries, data flow |
| **Tasks** | `sdd-tasks` sub-agent | Breaks design into implementation tasks with review workload forecast |
| **Apply** | `sdd-apply` sub-agent | Implements tasks in batches using TDD (red → green → refactor) |
| **Verify** | `sdd-verify` sub-agent | Validates implementation against specs, reports CRITICAL/WARNING/SUGGESTION |
| **Archive** | `sdd-archive` sub-agent | Closes the change, promotes delta specs, creates archive report |

Each phase runs in a **fresh sub-agent context** — no memory of prior phases except what was persisted to Engram or filesystem artifacts. This prevents context pollution and enforces independent verification at each stage.

## Sub-Agent Architecture

The orchestrator delegates all real work to specialized sub-agents:

- **Exploration agents**: read-only codebase analysis, no files created
- **Planning agents** (`propose`, `spec`, `design`, `tasks`): produce artifacts stored in `openspec/` and Engram
- **Execution agents** (`apply`): implement tasks test-first, report progress
- **Verification agents** (`verify`): adversarial review against specs and design
- **Review agents** (`4R`): Risk, Readability, Reliability, Resilience reviews for PRs

**Key enforcement rules** built into the orchestrator:
- 4-file rule: if understanding requires 4+ files, delegate exploration
- Multi-file write rule: if touching 2+ non-trivial files, delegate a writer
- PR review rule: fresh-context review before any PR after code changes
- Session preflight: pace, artifact store, PR strategy, and review budget collected before any SDD command

## Persistent Memory (Engram)

Engram provided cross-session memory, surviving context compactions:

- **Topic keys**: stable identifiers for evolving decisions (e.g., `architecture/auth-model`)
- **Proactive saves**: every architecture decision, bug fix, and discovery auto-persisted
- **Session summaries**: mandatory end-of-session protocol so the next session starts with full context
- **Conflict detection**: semantic duplicate/conflict detection when saving related memories

## Concrete Impact

### What the AI Accelerated
*Mechanical tasks — high volume, well-known patterns, low judgment required:*

- **Project scaffolding**: hexagonal architecture structure in Go and Node.js, directory layouts, configuration boilerplate
- **Test scaffolding**: 430 frontend tests, 144 Go tests, 85 Node.js tests — writing every assertion by hand at this volume is infeasible in the timeframe
- **CRUD handlers, DTOs, migrations**: the pattern is known, typing it manually consumes hours with no architectural value
- **Documentation**: ADRs, README sections, spec files, archive reports — structured docs following a consistent template
- **Refactors**: renaming, extracting functions, updating test expectations across multiple files

### What Required Human Judgment
*Architecture decisions, tradeoffs, and design choices — where AI assisted but did not decide:*

- **Hexagonal over MVC**: evaluated both patterns for two polyglot services, chose Ports & Adapters for testability without DB/HTTP
- **Append-only slice over ring buffer**: detected that the ring buffer (cap 200) silently discarded error traces due to the 5:1 success-to-error ratio; replaced with unbounded append-only storage after confirming the root cause
- **Kafka event model**: designed three event types (`device.created`, `device.updated`, `device.deleted`), chose schema-on-read (no Schema Registry) for demo scope, documented production topology in ADR-005
- **Kafka library selection**: `segmentio/kafka-go` (pure Go, no CGO) for the producer; `@confluentinc/kafka-javascript` for the consumer — evaluated API surface, build complexity, and distroless compatibility
- **Auth scope decision**: initially designed GET /devices as public, reversed mid-session to require JWT on all device endpoints — recognized the security implication and updated code, tests, and documentation
- **No HTTP framework**: evaluated Express/Fastify/Chi/Gin, chose stdlib (`net/http` + `node:http`) — the handler layer was thin enough that framework magic added more surface area than value

### Time Allocation Shift

The AI didn't eliminate work — it shifted where time was spent:

| Before AI | With AI |
|-----------|---------|
| ~70% typing boilerplate | ~20% validating AI output |
| ~20% debugging | ~30% debugging (same, AI introduces its own bugs) |
| ~10% architecture decisions | ~50% architecture decisions, code review, and design iteration |

The net effect: same quality bar, higher-level thinking, faster iteration on design decisions.

## Validation

Every AI-generated artifact passed through human review:

1. **Code review**: every line of generated code was read, understood, and approved before commit
2. **TDD gates**: tests written first, verified they fail (RED), then implementation (GREEN), then refactoring
3. **Verify phase**: adversarial sub-agent validation against specs after every implementation batch
4. **Manual testing**: `docker compose up -d`, curl endpoints, browser interaction
5. **CI validation**: GitHub Actions runs all 703 tests on every push
