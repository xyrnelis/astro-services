# Existing Channel Calculation

Status: implemented behavior, documented from the supplied source archive (November 2026). This document describes the current baseline calculation; it does not authorize changes to it.

## Purpose and references

Calculate the six-channel matrix from the twelve natal object positions, retain each `+1` award, and present the existing matrix, summaries, and detailed steps.

- [Planet and channel relationships](../models/PLANET-RELATIONS.md): canonical channel membership, signs, houses, and lookup ownership.
- [`calculate-channels.js`](../../src/domain/calculate-channels.js): verified implementation of the baseline scoring algorithm and output.
- [`render.js`](../../src/ui/render.js): verified matrix, summary, and detailed-step presentation.
- [Architecture](../../ARCHITECTURE.md): current entry points and dependency boundaries.

## Inputs and validation

- `calculateChannels(positions)` receives `chart.positions` keyed by the twelve IDs in `PLANETS`.
- Every configured object must have a position with a recognized `sign` and `house`; otherwise the function throws `Некорректное положение объекта: <planet>`.
- Extra position fields are not used by the scoring rules. Position calculation and house assignment belong to `src/astronomy/chart-calculator.js`.
- Source-channel order and planet roles come from `CHANNELS`: `planets[0]` is primary and `planets[1]` is secondary.

## Award rules (steps 1–8)

Each step awards one point to a target channel and records a separate event. For steps 1–6, process the current source channel's two planets. For steps 7–8, inspect all twelve objects.

1. **Primary planet in a sign**: award the channel owning that sign.
2. **Primary planet in a house**: award the channel owning that house.
3. **Secondary planet in a sign**: award the channel owning that sign.
4. **Secondary planet in a house**: award the channel owning that house.
5. **Full-sign conjunction with primary**: for every other planet in the primary planet's sign, award the other planet's owning channel.
6. **Full-sign conjunction with secondary**: for every other planet in the secondary planet's sign, award the other planet's owning channel.
7. **Planets in the source channel's houses**: for every planet in either of the source channel's two houses, award that planet's owning channel.
8. **Planets in the source channel's signs**: for every planet in either of the source channel's two signs, award that planet's owning channel.

### Counting details

- Each of the six source channels executes steps 1–8 independently, in the canonical `CHANNELS` order.
- Steps 1–4 generate exactly one event each per source channel.
- Steps 5–6 compare sign IDs, without longitudinal orb or degree-based aspects. Each loop excludes its own anchor planet; the channel's other planet remains eligible.
- Steps 7–8 include every qualifying planet, including the source channel's own planets.
- Awards accumulate across steps; an identical source/target pair can gain points multiple times. No deduplication or cancellation takes place.
- Every event awards exactly `1` point; no weighting or fractional points occur.
- The loops over candidate objects follow `PLANETS` order, which differs from `DISPLAY_PLANETS` order.

## Existing output contract

The function returns one object:

```js
{
  matrix, events, rowTotals,
  rowLeaders, globalTopByTotal, isSymmetric
}
```

- `matrix` is a numeric 6-by-6 array. Row = source channel; column = award recipient; both use `CHANNELS` order.
- `events` retains one entry per awarded point in source/step/candidate iteration order.
- Each event has `sourceChannel`, `targetChannel`, `sourceIndex`, `targetIndex`, `step`, `points` and `reason`.
- Steps 1–4 and 7–8 additionally record `sourcePlanet` and `matchedSign` or `matchedHouse` as applicable. Steps 5–6 additionally record `matchedPlanet` and `matchedSign`.
- Event `reason` is an HTML-formatted Russian label built from the existing planet, sign, house and conjunction symbols.
- `rowTotals[i]` is the sum of `matrix[i]`.
- `rowLeaders[i]` contains all target channel IDs tied for the largest value in row `i`.
- `globalTopByTotal` contains all source channel IDs tied for the largest `rowTotals` value.
- `isSymmetric` reports whether `matrix[i][j] === matrix[j][i]` for every cell; the function calculates this boolean without enforcing it.

## Current presentation

### Channel matrix and summaries

- `Матрица каналов` shows all 36 numeric cells and one row total per source channel.
- The highest cell value in each row receives `matrix-highest` styling, including every tie for highest.
- The next distinct lower value receives `matrix-runner-up` styling only when at most two cells share that value. When there is no lower value, no runner-up is shown.
- `Верхние значения по каналам` lists each source channel's highlighted targets, in descending value order, breaking ties by canonical target index.
- `Глобальный максимум` lists only the channel IDs in `globalTopByTotal`, rendered as labels; it does not include runners-up.
- `Ранжирование по сумме` displays all six source channels in descending `rowTotals` order; ties use canonical channel order.

### Detailed calculation

- `Подробный расчёт` contains one expandable section per source channel.
- Each section contains steps 1–8 in order, with its baseline events grouped by step.
- Every event is displayed as its target channel followed by `+1` and its recorded reason.
- Steps without events display `0 значений`.

## Existing user scenarios

### UC-BASE-01: Calculate a valid chart

Given valid positions for all twelve objects, a calculation produces six matrix rows, source events, row totals, and the existing presentation sections.

### UC-BASE-02: Count multiple reasons

If a planet qualifies for an award in more than one step, each qualifying step produces an independent `+1` event and increases the corresponding cell.

### UC-BASE-03: Display ties

When multiple targets tie for a row's highest value, all are highlighted. A distinct second value shared by three or more targets receives no runner-up highlight.

### UC-BASE-04: Reject incomplete positions

If a required planet position is missing, or its sign or house is unrecognized, calculation fails with the corresponding invalid-position error.

## Baseline verification checks

- **AT-BASE-01**: Steps 1–4 contribute four events per source row.
- **AT-BASE-02**: Steps 5–6 award once per qualifying other planet in the same sign and exclude only the respective anchor.
- **AT-BASE-03**: Steps 7–8 consider all twelve planets and preserve repeated awards.
- **AT-BASE-04**: Each event increases exactly one matrix cell by `1`; matrix, totals and leader fields agree.
- **AT-BASE-05**: The renderer applies the stated highest/runner-up and summary-ordering rules, with empty steps showing `0 значений`.

## Scope boundary

This specification records steps 1–8 and their current UI. Reception detection belongs to [Stage 1](01-reception-detection.md); additional channel awards, Step 9 and the global view switch belong to [Stage 2](02-reception-channel-impact.md).
