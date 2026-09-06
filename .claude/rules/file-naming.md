---
paths:
  - "src/**/*.ts"
---

# File & folder naming convention

Every file under `src/` is suffixed by what it holds. The suffix is the contract:
you can tell what's inside without opening it, and a file that grows the wrong
kind of code becomes obvious in review.

## The folders

| Folder | Holds only | Suffix | Example |
|---|---|---|---|
| `src/types/` | TypeScript type/interface definitions — **no runtime code** | `*.type.ts` | `user.type.ts` |
| `src/schemas/` | zod schemas that validate untrusted input (request bodies) | `*.schema.ts` | `user.schema.ts` |
| `src/services/` | logic: D1 access, auth, row→response mappers | `*.service.ts` | `user.service.ts` |
| `src/utils/` | reusable, domain-level helpers | `*.util.ts` | `request.util.ts` |
| `src/routes/` | Hono sub-apps, one per domain; declare endpoints + wire services | `*.routes.ts` | `me.routes.ts` |
| `src/index.ts` | entry point — composes routes, nothing else | — | — |

## Rules

- **`*.type.ts` files declare types only.** No functions, no zod, no constants.
- **`*.service.ts` files import types — they never declare them.** A mapper
  (`toUserResponse`) lives with its domain's service; the shapes it maps come
  from `*.type.ts`.
- **zod stays in `src/schemas/`.** Where a schema mirrors a hand-written type in
  `src/types/`, write `satisfies z.ZodType<T>` so drift fails to compile.
  Validate at the route boundary (`parseBody`), then trust the value downstream.
- **`*.routes.ts` is a Hono sub-app**, mounted in `index.ts` via
  `app.route("/", …)`. Routes call services; they hold no D1 logic of their own.
- **Domain naming, not consumer naming.** A helper specific to one route stays
  inline in that route; promote to `<domain>.util.ts` only when it's reusable.
- **File-size guide:** under ~300 LOC is fine; at ~500 watch it; ~700+ split.

## Why

The layering is what keeps the worker readable as it grows: a route reads as a
list of endpoints, a service reads as the logic, and a type file reads as the
shape. Mixing them is how a 200-line worker becomes a 2000-line one nobody wants
to touch.
