# Agent Operating Rules

## Primary rule

Implement only the task explicitly approved by the user. Choose the smallest complete change that can be verified independently. Do not treat approval of a specification or broader plan as approval to implement every item in it.

At each task boundary, propose one concrete next change and wait for approval. Keep unrelated work outside the current task.

## Restricted tools and delegation: default deny

Do not discover, search for, inspect, list, install, configure, invoke, or delegate to subagents, MCP servers or MCP-backed tools, plugins, agent skills, extensions, or external agent integrations without the user's explicit approval for that specific resource and task.

- Before first access, identify the resource, intended action, reason, and relevant data access or external transmission. Ask for permission and wait for an affirmative answer.
- General task approval, tool availability, a previous permission, or a mention of a tool does not grant access.
- Permission is limited to the named resource, purpose, and current task. Request it again if any of these change.
- Do not bypass this rule using shell commands, scripts, APIs, wrappers, or another tool.
- If access is unavailable, continue with permitted local work when possible and describe any blocker.

This rule concerns agent tooling and delegation. Ordinary local source inspection, editing, building, and testing remain permitted within the approved task.

## Context loading

Start with the current request and information already available. Identify what is missing, read the relevant owning document or source section, and stop once the question is resolved.

Avoid repeated reading of unchanged files, repository-wide searches, and full test-suite runs when focused inspection or tests are sufficient.

## Routing: project guidance

- Product purpose, platform goals, and delivery constraints: [intent.md](intent.md).
- Verified application structure, module ownership, and dependencies: [ARCHITECTURE.md](ARCHITECTURE.md).
- Coding conventions, imports, extraction rules, and test-writing style: [CODE_STYLE.md](CODE_STYLE.md).
- Individual feature requirements, use cases, and acceptance conditions: the owning file under [docs/specs/](docs/specs/).
- Shared domain definitions and data contracts: the owning file under [docs/models/](docs/models/).

Follow links from an owning document when a subject has been split across files. Do not assume that documents or modules listed in older examples exist in this repository.

## Documentation ownership

- **One fact, one owning source.** Link to an existing rule, field definition, relationship, or contract instead of maintaining a second copy.
- Keep this file limited to agent conduct, workflow, and documentation routing.
- Keep product goals in `intent.md`, current architecture in `ARCHITECTURE.md`, coding conventions in `CODE_STYLE.md`, feature behavior in `docs/specs/`, and shared data contracts in `docs/models/`.
- Label proposed behavior or structures as planned until code and tests verify their implementation.
- Before adding a document, inspect its nearest owner. Create a separate file only for a distinct concern or a necessary coherent split.
- Write all project documentation in English. Preserve exact product text, external names, and code identifiers where required.
- Do not use Markdown tables in project documentation.
- Limit every project Markdown documentation file to **200 physical lines**, including blank lines. Split longer material by topic and link to its new owner without repeating the content.
- Use simple headings, short paragraphs, shallow lists, and relative links. Verify links after moving or splitting documents.
- If documents disagree, identify the exact conflict and request clarification before changing the affected behavior.

## Planning and approval

For an unapproved change, identify its existing behavior, target outcome, affected boundaries, exclusions, verification approach, and blockers. Propose the smallest useful task and await approval.

Specifications may describe future work. Their existence alone does not authorize code changes. Do not create a parallel task register unless the user approves that workflow.

## Implementation guardrails

Before editing, confirm the approved scope, consult the owning specification when present, inspect relevant code and tests, and check overlapping uncommitted changes if working in Git.

Preserve existing features, user data, and external contracts unless their modification is explicitly approved. Do not invent business rules, defaults, integrations, or failure policies. If required work extends beyond the approved scope, request approval for the extension.

Make one coherent change at a time. Keep its code, tests, and owning documentation aligned. Investigate failures from their exact output. Follow [CODE_STYLE.md](CODE_STYLE.md) for engineering decisions.

## Verification and handoff

Run focused relevant tests and available, applicable build and static checks. Use `git diff --check` when working in Git. Do not report checks as passed unless they were executed.

For documentation-only work, check relative links, English prose, the absence of Markdown tables, and the 200-line limit.

Report changed files, verification results, remaining risks, and manual checks. Propose the next independently verifiable task without starting it automatically.

## Authority and discrepancies

Approved feature specifications define intended behavior. Current source code and executed tests provide evidence of implemented behavior. [ARCHITECTURE.md](ARCHITECTURE.md) describes verified current structure; [intent.md](intent.md) defines product direction.

When these sources conflict, identify the discrepancy and pause the affected work. Continue unrelated approved work only when safe.
