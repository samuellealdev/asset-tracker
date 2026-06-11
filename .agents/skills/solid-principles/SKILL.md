---
name: solid-principles
description: "Trigger: SOLID, single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion. Apply the five SOLID principles during design and code review."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Load this skill when the user asks about SOLID, mentions any of the five principles by name, or when reviewing/designing class structures where these principles apply.

## The Five Principles

### S — Single Responsibility Principle (SRP)

A class or module should have ONE reason to change. Every component owns a single responsibility.

- If a struct/class handles validation AND persistence AND HTTP, split it.
- Go: one `service` per domain concern; do not mix business logic with transport.
- Node: one class/module per concern; service layer is separate from controllers.

### O — Open/Closed Principle (OCP)

Open for extension, closed for modification. Add behavior via composition and interfaces, not by editing existing code.

- Go: use interfaces + dependency injection. Add new implementations; don't modify existing ones.
- Node: use strategy pattern, dependency injection via constructor params.

### L — Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types without breaking the contract.

- Go: interface implementations must honor the full contract.
- Node: subclasses must not throw unexpected errors or change return types.
- Violation: a Square extending Rectangle that breaks `setWidth`/`setHeight` invariants.

### I — Interface Segregation Principle (ISP)

Clients should not depend on interfaces they don't use. Keep interfaces small and focused.

- Go: prefer many small interfaces over one large one (`io.Reader` + `io.Writer` > `io.ReadWriter` for most consumers).
- Node/TypeScript: role-based interfaces, not monster interfaces.

### D — Dependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both depend on abstractions.

- Go: depend on interfaces, not concrete structs. Inject dependencies via constructor.
- Node: depend on abstractions (interface/type), not concrete classes.

## Decision Tree

```
Does this class have more than one reason to change? → Split it (SRP)
Will adding a feature require editing existing code?   → Extract interface (OCP)
Does the subtype break the parent's contract?          → Fix the subtype (LSP)
Does the client depend on methods it never calls?      → Split the interface (ISP)
Does a high-level module import a low-level one?       → Invert via interface (DIP)
```

## Code Example (Go)

```go
// BAD: one struct does everything
type UserService struct { db *sql.DB }

// GOOD: separated concerns with DI
type UserRepository interface {
    FindByID(id string) (*User, error)
}
type UserNotifier interface {
    SendWelcome(user *User) error
}
type UserService struct {
    repo     UserRepository   // DIP
    notifier UserNotifier     // DIP + ISP
}
```

## Code Example (Node.js/TypeScript)

```typescript
// BAD: controller depends on concrete DB
class UserController {
  private db: PostgresDB; // DIP violation
}

// GOOD: depend on abstraction
interface UserRepository {
  findById(id: string): Promise<User>;
}
class UserController {
  constructor(private repo: UserRepository) {} // DIP
}
```
