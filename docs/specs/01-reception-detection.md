# Stage 1: Detect and Display Mutual Receptions

Project: `astro-services`. Status: approved Stage 1 requirements.
Stage 2 channel recalculation is out of scope.

## Purpose and references

A mutual domicile-by-sign reception is a pair in which each planet occupies a sign
ruled by the other. Detect qualifying pairs in the original natal chart and display
them below the existing planet positions table.

- [Current architecture](../../ARCHITECTURE.md): current call flow and responsibilities.
- [Planet relationships](../models/PLANET-RELATIONS.md): canonical catalog, rulers and shared projections.
- [Reception contract](../models/RECEPTION-CONTRACT.md): input, output, ID and ordering.
- Existing source: `src/domain/channels.js`, `src/astronomy/chart-calculator.js`,
  `src/domain/calculate-channels.js`, `src/ui/app.js`, `src/ui/render.js`.
- Stage 2 is specified separately in `docs/specs/02-reception-channel-impact.md`.

## Business rules

- **BR-01**: Evaluate all 66 unordered pairs of distinct planets from the 12 chart objects.
- **BR-02**: Consider both primary and minor sign rulers with equal authority.
- **BR-03**: A/B qualifies when B rules A's original sign and A rules B's original sign.
- **BR-04**: Exclude any pair occupying the same original sign.
- **BR-05**: Planets belonging to the same channel can qualify if their signs differ.
- **BR-06**: Each unordered pair appears once, including intersecting pairs with a shared planet.
- **BR-07**: Read original positions only; no swaps, mutation or bonuses in Stage 1.
- **BR-08**: One-sided rulership, houses, exaltation and aspects do not qualify a pair.
- **BR-09**: Use the deterministic order and IDs from the reception contract.

```text
A != B
AND sign(A) != sign(B)
AND B in rulersBySign[sign(A)]
AND A in rulersBySign[sign(B)]
```

## User interface

- **UI-01**: Add `Взаимные рецепции` directly beneath the planet positions table.
- **UI-02**: Display one line per unique pair with each planet's original sign and house: `Венера в Овне, 7 дом ↔ Марс в Тельце, 8 дом`.
- **UI-03**: Use original signs and plain Russian inflected planet/sign names.
- **UI-04**: Keep the existing Russian interface and position table unchanged.
- **UI-05**: If the list is empty, show `Взаимные рецепции не обнаружены`.
- **UI-06**: Recalculate the list on every successful chart computation.
- **UI-07**: Clearing the form removes the list; shared-URL restore reproduces it.
- **UI-08**: Allow wrapping on narrow screens; escape user-facing text as appropriate.

## Architecture delta

**Add**

- `src/domain/channel-relations.js`: move existing shared lookup maps from `channels.js`
  and add `rulersBySign`, all generated from `CHANNELS`. Existing calculation and render
  modules must import these extracted maps. See [relationship ownership](../models/PLANET-RELATIONS.md).
- `src/domain/find-receptions.js`: pure `findReceptions(positions)` consumed by existing
  `app.js`. Keep its pair builder, predicate and JSDoc contract local unless reused elsewhere.

**Change**

- `src/domain/channels.js`: remove definitions of four extracted lookup maps; preserve
  `CHANNELS`, `PLANETS`, `DISPLAY_PLANETS` and existing display constants. Add the
  plain-text Russian labels needed by the renderer in the existing presentation catalog.
- `src/domain/calculate-channels.js`: replace mapping imports; preserve all eight steps
  and the public result shape.
- `src/ui/render.js`: change `channelIndexById` import; extend `renderPositions()` to accept
  detected pairs and show the new subsection after the positions table.
- `src/ui/app.js`: call the detector after chart calculation; pass pairs into
  `renderPositions()` in both manual and shared-link flows.
- `src/styles.css`: add minimal list spacing and responsive text wrapping, if required.

**Remove / avoid**

- Remove the old lookup-map declarations from `channels.js` when extracting them.
- Do not introduce the previously proposed `models/planet-relations.js`,
  `models/reception-model.js` or `models/reception-interaction.js` as standalone modules.
- No separate reception log, scoring changes or unused abstraction layers.

**Unchanged**

- Astronomy, birth-time resolution, URL schema, six-channel configuration,
  original calculation results, eight steps, matrix and rankings.

## Use cases

### UC-01: Display results

Given 12 valid chart positions, when a calculation completes, render every unique
qualifying pair below the positions table, or the empty-state message.

### UC-02: Minor rulership

Given Mars in Cancer and Sun in Scorpio, detection includes that pair because both
sign-rulership conditions are satisfied, including minor rulership.

### UC-03: Same channel and same-sign exclusion

Given Mars in Aries and Pluto in Scorpio, include the pair.
Given Mars and Pluto both in Scorpio, exclude the pair.

### UC-04: Intersecting receptions

Given Venus in Aries, Mars in Taurus and Pluto in Taurus, include Venus/Mars and
Venus/Pluto once each. Exclude Mars/Pluto because their signs are identical.

### UC-05: Refresh and restore

Given a recalculation, replace the previous pair list.
Given form clear, remove its results.
Given equivalent manual inputs and shared URL data, show identical pairs.

## Acceptance checks

- **AT-01**: All 66 candidate pairs are tested once per chart.
- **AT-02**: Venus in Aries and Mars in Taurus qualifies.
- **AT-03**: Mars in Cancer and Sun in Scorpio qualifies.
- **AT-04**: Mars in Aries and Pluto in Scorpio qualifies.
- **AT-05**: Any same-sign pair is excluded; one-sided rulership is excluded.
- **AT-06**: Overlapping qualifying pairs are retained independently.
- **AT-07**: Reverse pair order cannot create a second result or a different pair ID.
- **AT-08**: No results shows the agreed Russian empty-state text.
- **AT-09**: Manual calculation, recalculation, clear and shared-URL restore behave consistently.
- **AT-10**: Existing eight-step matrix, row totals, global totals and rankings do not change.
- **AT-11**: All four extracted lookup maps have their original values and all existing
  imports resolve through `channel-relations.js`; their old definitions are removed.
- **AT-12**: `rulersBySign` contains both rulers for all twelve signs; it is derived
  from the same `CHANNELS` data used by the baseline calculator.
- **AT-13**: No new JavaScript module remains unimported or duplicates a maintained catalog.
- **AT-14**: Domain reception results contain IDs only, no HTML or copied positions.

## Scope limit

Stage 1 has no virtual charts, bonus points, ninth scoring step, matrix updates
or second ratings block. Those belong to Stage 2.
