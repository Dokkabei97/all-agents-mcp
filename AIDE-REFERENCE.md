# AIDE (Agent-Informed Development Engineering) Quick Reference v1.0

> A software development methodology for the agentic era. Preserves core values of existing methodologies while realigning implementation approaches to match AI agent characteristics.

---

## 1. Ten Core Principles

### P1. Context Budget Principle — Context Budget Is a First-Class Design Constraint

| Item | Recommended | Upper Limit |
|------|-------------|-------------|
| File size | 200-300 lines | 500 lines |
| Function size | 30 lines | 50 lines |
| Line length | 100 characters | 120 characters |
| Meta files (CLAUDE.md) | 200 lines | 300 lines |
| Files loaded per feature modification | 1-2 | 3 |

### P2. Locality of Behavior — Locality Takes Priority Over Abstraction

- All code related to a single feature must be **physically co-located**
- Separate by **feature/domain**, not by technical role (presentation/business/data)
- Each Feature directory is **self-contained**

### P3. Functional Core, Structural Shell — Pure Function Core + Structural Shell

- Business logic: **pure functions** (no classes)
- Domain models: **immutable data structures + types**
- Infrastructure/IO: functions first, classes allowed when necessary
- Max 1 level of inheritance; Composition over Inheritance

### P4. Knowledge DRY, Code WET-tolerant — Knowledge Is DRY, Code Trades Off with Locality

| Level | Strategy | Duplication Tolerance |
|-------|----------|-----------------------|
| Business rules | Strict DRY | 0 (single source of truth) |
| Domain types | Allow re-declaration at Feature boundaries | Interface / partial re-declaration |
| Utility code | AHA principle | 2-3 allowed; review extraction at 4+ |
| Boilerplate | Structured duplication allowed | Unlimited |

### P5. Test as Specification — Tests Are a Specification Language

- **TDD**: Deterministic code (parsers, policies, state transitions)
- **PBT (Property-Based Testing)**: Business invariant property verification
- **EDD (Eval-Driven Development)**: Model output quality evaluation
- Confirmation bias prevention: use **different models/sessions** for test writing and code writing

### P6. Progressive Disclosure — Progressive Disclosure of Information

| Tier | File | Size | Loading |
|------|------|------|---------|
| Tier 1 | CLAUDE.md / AGENTS.md (root) | 300 lines | Always loaded |
| Tier 2 | AGENTS.md in subdirectories | 200 lines | Lazy loaded when working in that directory |
| Tier 3 | .agents/skills/*/SKILL.md | YAML + body | On-demand |

### P7. Deterministic Guardrails — Deterministic Guardrails for Probabilistic Generation

> "Never send an LLM to do a linter's job." Delegate style, type, and security pattern enforcement to deterministic tools.

- TypeScript strict mode, ESLint/Prettier, Zod/io-ts
- Pre-commit hooks, Security linters, CI test suite
- Self-Healing Loop: Generate → Compile/Lint → Test → Analyze errors → Regenerate

### P8. Observability as Structure — Observability Is Part of the Structure

- Include **structured logging** (JSON) in all handlers
- Distributed tracing via `trace_id` / `span_id` (OpenTelemetry)
- ON by default from the development stage

### P9. Security by Structure — Structural Security Verification

- ~45% of AI-generated code contains security flaws (Veracode 2025)
- Automated security linter execution in CI is mandatory
- Mandatory security review for auth, payment, and personal data code changes
- Audit trail for all sensitive data access

### P10. Meta-Code as First-Class — Meta-Code Is a First-Class Citizen

- AGENTS.md, CLAUDE.md, and Skills files are version-controlled with the same rigor as source code
- Meta file changes automatically trigger eval suite execution in CI
- CI warns/blocks when Tier 1 files exceed 300 lines

---

## 2. Feature-Based Architecture

### Directory Structure

```
src/features/{feature-name}/
  types.ts          — Immutable domain types (no imports, pure definitions)
  logic.ts          — Pure function business logic (depends only on types)
  handler.ts        — HTTP/event handlers (side-effect boundary, composes logic+store)
  store.ts          — Data access (side-effect boundary, DB/Cache)
  {feature}.test.ts — Unit + PBT + Integration tests
  AGENTS.md         — Domain context (Tier 2)
```

### Dependency Direction

```
types.ts → logic.ts → handler.ts
types.ts → store.ts → handler.ts
```

- `types.ts`: Depends on nothing (pure type definitions)
- `logic.ts`: Depends only on `types.ts` (pure functions)
- `handler.ts`: Composes `logic.ts` and `store.ts` (side-effect boundary)
- `store.ts`: Depends on `types.ts`, accesses infrastructure

### Shared Code

```
src/shared/     — Shared types, middleware, common errors (keep minimal)
infrastructure/ — DB, cache, messaging, external API clients
```

---

## 3. Code Style Guide

### Naming Conventions

#### Core Rule: Language-Native Convention First

AIDE does not prescribe a universal case style. **Always follow the target language's established naming convention.** What AIDE prescribes is the *semantic content* of names:

| Rule | Description | Example (TS) | Example (Python) | Counter-Example |
|------|-------------|--------------|-------------------|-----------------|
| Verb-object for functions | Name describes action and target | `calculateOrderTotal()` | `calculate_order_total()` | `calc(d)` |
| Meaningful variables | Name conveys purpose | `activeUserIdList` | `active_user_id_list` | `ids` |
| Explicit side effects | Prefix indicates side effect | `persistUserToDatabase()` | `persist_user_to_database()` | `save()` |
| Nouns for types | Type names are descriptive nouns | `OrderItem` | `OrderItem` | `OI` |
| Source in constants | Constant names include origin | `MAX_LOGIN_ATTEMPTS` | `MAX_LOGIN_ATTEMPTS` | `MAX` |
| File names | Follow language convention | `user-auth.ts` | `user_auth.py` | `ua.ts` |

### Code Pattern Examples

```typescript
// types.ts — Immutable domain types
type CartItem = Readonly<{
  productId: string
  unitPrice: number
  quantity: number
  discountRatePercent: number
}>

// logic.ts — Pure functions
const calculateItemPrice = (item: CartItem): number =>
  item.unitPrice * item.quantity * (1 - item.discountRatePercent / 100)

// handler.ts — Side-effect boundary (dependency injection)
const handleGetCart = async (
  req: Request,
  deps: { db: Database; logger: Logger }
): Promise<Response> => {
  const cart = await deps.db.findCart(req.userId)
  const summary = calculateCartSummary(cart)
  deps.logger.info({ event: 'cart_calculated', userId: req.userId })
  return ok(summary)
}

// store.ts — Data access (type-based DI)
type CartStore = {
  readonly findByUser: (userId: string) => Promise<Cart | null>
  readonly save: (cart: Cart) => Promise<void>
}
```

---

## 4. Development Workflow

1. `types.ts` — Define/modify types first
2. `logic.ts` — Implement business logic as pure functions
3. `*.test.ts` — Write tests (TDD + PBT)
4. `handler.ts` — Integrate side effects
5. Verify lint + test + type check pass

---

## 5. CI/CD Pipeline Gates

1. Static Analysis (TypeScript strict, ESLint, Prettier, Security linters)
2. Unit Tests (parsers, policies, business logic)
3. Property-Based Tests (invariant property verification)
4. Integration Tests (cross-Feature coordination, data flow)
5. Eval Suites (code quality evaluation)
6. Security Gate (XSS, SQL Injection, SCA)
7. Meta-File Validation (size limits, manifest consistency)

---

## 6. Relationship with Existing Methodologies

### SOLID Priority Reordering

DIP > SRP > ISP > LSP > OCP

### Preserve / Modify / Deprecate

| Classification | Principles |
|----------------|------------|
| **Preserve (Strengthen)** | DDD Bounded Context, Ubiquitous Language, Domain Events |
| **Modify** | Clean Architecture (reduce physical layers), DDD Aggregate (immutable types+functions), Hexagonal (minimize port/adapter file count) |
| **Deprecate** | 4+ horizontal layer separation, deep inheritance trees, excessive abstraction |

### AI-Friendly GoF Patterns

- **Actively use**: Strategy, Observer, Factory Method, Adapter, Command, Repository
- **Situational use**: Singleton, Template Method, State, Builder
- **Avoid**: Visitor, deep Abstract Factory hierarchies, long Decorator chains, complex Mediator

---

## 7. Adoption Level Guide

| Project Characteristics | Adoption Level | Core Principles |
|------------------------|----------------|-----------------|
| AI agents as primary code producers | Full adoption | All 10 principles |
| AI-assisted + mid-size projects | Core adoption | P1, P2, P5, P7, P10 |
| Simple chatbot / LLM projects | Partial adoption | P7, P8, P9 |

---

## 8. Minimum Requirements Checklist

- [ ] CLAUDE.md / AGENTS.md exist at root, within 300 lines
- [ ] Feature-based directory structure
- [ ] TypeScript strict mode (or equivalent type checking)
- [ ] Linter + Type checker + Pre-commit hook configured
- [ ] Structured log format, tracing enabled
- [ ] Security linter configured, automated execution in CI
- [ ] Unit + PBT minimum, Eval Suite recommended
- [ ] Automatic eval execution on meta file/code changes

---

*AIDE v1.0 — Semi-annual revision recommended as agent capabilities evolve. Source: https://github.com/Dokkabei97/aide-methodology
