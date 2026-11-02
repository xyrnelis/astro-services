# Code Style

Read this file before changing source code. Task approval and verification workflow belong to [AGENTS.md](AGENTS.md); component ownership and current call paths belong to [ARCHITECTURE.md](ARCHITECTURE.md); product delivery constraints belong to [intent.md](intent.md).

## Local conventions first

- Inspect the affected code and any configured formatter, linter, test runner, or type checker before making style decisions.
- Follow established conventions in the edited area. Apply the defaults below only when no local convention exists.
- Keep formatting changes inside the approved scope. Preserve public exports, serialized fields, user-visible behavior, and existing interfaces unless a change is approved.
- Use the project's existing browser JavaScript ES modules, HTML, CSS, and Node build scripts. Introduce another framework, language, build system, or dependency only when a demonstrated need is approved.

## JavaScript and naming

- Default to two-space indentation, single-quoted JavaScript strings, semicolons, and trailing commas for multiline structures, following the surrounding file.
- Use `camelCase` for variables and functions, `PascalCase` for classes and error types, and descriptive `UPPER_SNAKE_CASE` for immutable catalogs or configuration where that pattern is already established.
- Use lowercase kebab-case for new JavaScript module filenames, following existing files such as `calculate-channels.js`.
- Name values for their domain meaning. Include units in names where numerical units or time representations could be confused.
- Prefer `const`; use `let` for reassignment. Avoid unnecessary mutation of shared data and broad mutable module state.
- Use JSDoc to clarify public data shapes or complex inputs where it materially improves understanding. Do not introduce TypeScript solely for annotations.

## File organization and reuse

- Keep a small helper, constant, or type next to its only consumer when it has no independent module responsibility.
- Extract a module when the code has a clear responsibility and real importing consumers, or when extracting shared logic removes duplication from existing files.
- Update imports and remove replaced definitions in the same approved change. Never leave competing maintained copies of a catalog, rule, or lookup.
- Keep one authoritative source for domain mappings. Derive secondary indexes and lookup structures from that source rather than editing the same relationship in multiple places.
- Prefer focused modules. Avoid catch-all helpers, speculative abstractions, unused exports, and new directories added solely for organization.
- Keep code at its owning boundary. UI may call domain operations; rendering should not reimplement domain calculations.

## Imports and dependencies

- Use explicit relative ES-module imports with `.js` extensions, consistent with the current source tree.
- Import public exports instead of reaching into another module's private details. Avoid circular dependencies, wildcard imports, and unnecessary import-time side effects.
- Keep browser-only APIs at their established boundary. Core domain calculations should remain callable without a DOM.
- Add third-party packages or remote services only when approved. Avoid dependencies that impose required paid accounts or a server runtime on the published website.

## Static-site compatibility

- Keep deployable functionality compatible with static hosting on GitHub Pages. Avoid runtime assumptions about Node, a private server, writable server files, or backend routes.
- Use asset and navigation paths that work when the website is served from a repository subpath. Check generated paths in the built site.
- Keep secrets, local configuration, internal documentation, and non-runtime files out of the published distribution. Assume all shipped browser JavaScript and network requests are publicly observable.
- Preserve the existing build and publishing workflow unless an approved task requires changing it.

## Data and calculation boundaries

- Treat input validation, timezone conversion, coordinates, and astronomical computation as distinct responsibilities according to [ARCHITECTURE.md](ARCHITECTURE.md).
- Preserve raw values and units where required by the existing calculation contract. Do not change rounding, sign boundaries, house assignment, or scoring behavior as a side effect of UI work.
- Keep calculations deterministic for identical validated inputs and mocked external data.
- Validate data at established boundaries and report actionable failures. Do not silently replace missing or invalid astronomical values with invented defaults.
- Avoid logging birth details or credentials. Explicitly review privacy implications when adding URL parameters, storage, telemetry, or external requests.

## UI and accessibility

- Follow the existing semantic HTML and plain CSS patterns. Keep labels, controls, status messages, and keyboard interaction usable.
- Preserve existing language and displayed symbols unless the approved feature changes them. Documentation language does not determine UI language.
- Escape or safely insert external/user-controlled content. Avoid adding untrusted values to HTML strings.

## Tests, build, and formatting

- Follow the repository's configured test framework, when one exists. Prefer deterministic fixtures and tests that identify observable behavior.
- Test domain logic independently of browser APIs when feasible; use fakes for network and ephemeris providers.
- Cover both the intended change and the existing behavior it could affect. Keep unrelated test updates outside scope.
- Run the relevant tests and static-site build when available. Verify linked assets and browser module paths in the resulting output.
- Do not add formatters, linters, or test frameworks merely for consistency with another repository; propose them when they solve a concrete problem.
