# Channel Calculation Result Contract

Status: Feature-02, natal boundary-only, and combined Feature-03 domain scoring implemented. See [Feature-02 (part 1)](../specs/02-reception-channel-impact.md) and [Feature-03](../specs/03-boundary-planet-channel-scoring.md).

## Existing inputs and compatibility

- `chart.positions` is the original 12-object position map produced by `src/astronomy/chart-calculator.js`; [reception detection](RECEPTION-CONTRACT.md) defines the fields relevant to pair detection.
- `ReceptionPair[]` is the unchanged output of `findReceptions(positions)`; its IDs, ordering, and pair shape belong to [RECEPTION-CONTRACT.md](RECEPTION-CONTRACT.md).
- `calculateChannels(positions)` retains its existing export and numeric result shape defined in [baseline calculation](../specs/00-channel-calculation.md#existing-output-contract). The extension returns a separate `ExtendedResult`.

## Extended result shape

Conceptual schema (type names designate documented shapes, not JavaScript runtime constructors):

```js
{
  base: {
    calculation: BaseCalculationResult,
    ranking: RankingSnapshot
  },
  variants: {
    '1000': {
      receptions: ReceptionContribution[],
      matrix: Score[6][6],
      rowTotals: Score[6],
      overallScore: Score,
      ranking: RankingSnapshot
    }
    // Every other valid OptionKey has the same ScoreVariant shape.
  },
  boundaryVariants: {
    '0111': CompositeScoreVariant
    // Every other valid BoundaryOptionKey is present.
  },
  combinedVariants: {
    '0111:0111': CompositeScoreVariant
    // Every other valid CombinedOptionKey is present.
  }
}
```

- `base.calculation` is exactly one original `calculateChannels(positions)` result. Its numeric `matrix`, `rowTotals`, `events`, and other existing fields remain intact; it supplies the original steps 1–8.
- `base.ranking` is the baseline `RankingSnapshot` derived from `base.calculation`.
- `variants` has exactly one complete `ScoreVariant` for each valid `OptionKey`, including configurations with no additional awards. No redundant top-level matrix, events, or rankings fields exist.
- The `ScoreVariant` fields are paired: its `receptions`, scores, and `ranking` all correspond to the same option key. No variant changes `base.calculation` or its `ranking`.
- Feature-03 preserves `variants` as the reception-only cache and combines it with `boundaryVariants` and `combinedVariants` derived from the same `base`.
- `boundaryVariants` has 12 boundary-only entries. `combinedVariants` has 144 entries, one for every reception-key and boundary-key pair. Neither cache contains redundant entries for a disabled main switch.
- `ExtendedResult`, `BaseResult` (the `base` object), `BaseCalculationResult`, `Score`, `ScoreVariant`, `BoundaryOptionKey`, `CombinedOptionKey`, `CompositeScoreVariant`, `ReceptionContribution`, and `RankingSnapshot` are schema labels, not requirements to create standalone JavaScript model files.

### OptionKey

`OptionKey` is a four-character string of `0`/`1` bits for suboptions 1, 2, 3, and 4, in UI order. A bit is `1` exactly when that suboption is selected. The primary reception switch is not part of the key.

The full set of keys is:

```text
0000 1000 0100 1100
0010 1010 0110 1110
0011 1011 0111 1111
```

- The default suboptions select `0111` when the primary reception switch is on.
- A complete result always contains all 12 keys; lookups select an existing entry instead of computing a missing configuration.

### Boundary and combined option keys

`BoundaryOptionKey` uses the same four-bit grammar and the same 12 valid values as `OptionKey`. Its bits represent the four Feature-03 boundary suboptions in UI order. The boundary main switch is not part of the key.

`CombinedOptionKey` is `${OptionKey}:${BoundaryOptionKey}`. The reception key is always first and the boundary key second. For example, `1000:0111` selects reception suboptions `1000` and boundary suboptions `0111`. All 144 pairings are valid.

Selection is exact and performs no calculation:

- Both main switches off: `base`.
- Reception on and boundary off: `variants[optionKey]`.
- Reception off and boundary on: `boundaryVariants[boundaryOptionKey]`.
- Both on: `combinedVariants[combinedKey]`, using the reception-first combined key defined above.

### Score

```js
{ base: 3, reception: 3, total: 6 }
```

- The only additional-award field name is `reception`; `total = base + reception`.
- Every `ScoreVariant` matrix cell, row total, and overall score has this shape, with nonnegative integer values.
- `Score.base` equals the corresponding numeric value from `base.calculation`. `Score.reception` is the sum of events in this variant for the corresponding source/target cell.
- Matrix rows and columns retain the [baseline canonical order](../specs/00-channel-calculation.md#existing-output-contract). `rowTotals[i]` is the fieldwise sum of `matrix[i]`, and `overallScore` is the fieldwise sum of `rowTotals`.
- Symmetry is not required. Separate score events may contribute to one matrix cell.

Feature-03 `CompositeScoreVariant` matrices, row totals, and overall scores use:

```js
{ base: 3, boundary: 2, reception: 3, total: 8 }
```

- `total = base + boundary + reception`.
- Boundary-only variants set `reception` to zero. Combined variants retain both subtotals.
- `CompositeScoreVariant` otherwise pairs its event groups, scores, and ranking like `ScoreVariant`; Feature-03 owns its boundary provenance and event grouping.

### AwardEvent and ReceptionContribution

`AwardEvent` retains the [baseline event fields](../specs/00-channel-calculation.md#existing-output-contract). A reception-generated event additionally carries `receptionId`:

```js
{
  pairId: 'Venus:Mars',
  affectedSourceChannels: ['venus', 'mars'],
  events: [
    { /* existing AwardEvent fields */, receptionId: 'Venus:Mars' }
  ]
}
```

- `pairId` identifies a Stage-1 `ReceptionPair.id`; this group does not copy planet identities or original signs.
- `affectedSourceChannels` contains unique source-channel IDs in canonical channel order.
- Every reception event has `receptionId === pairId`; `step` is its generating step from 1–8, even though it is displayed under Step 9.
- `base.calculation.events` contains only original awards and has no `receptionId`.
- Each variant's `receptions` groups preserve the supplied pair order; each group's events retain their original source channel, target channel, and generation order.
- To display Step 9, resolve `pairId` against the original pair list and resolve original signs against `chart.positions`. Filter a variant's events by `sourceChannel`; show a pair only where it has events. A channel with none displays the empty state specified in Feature-02.

### Natal boundary contributions

`calculateWithBoundaries(positions, memberships)` returns `base` and `boundaryVariants` only. Each variant has `boundaries`, `matrix`, `rowTotals`, `overallScore`, and `ranking`. The `boundaries` array follows membership order, with duplicate planet/kind/added-value triggers counted once. Each group is `{ triggerId, affectedSourceChannels, events }`; `triggerId` is `${planetId}:${kind}:${addedValue}` and source channels with events follow canonical channel order. Empty groups remain present when options suppress their awards.

Every group event retains the baseline `AwardEvent` fields and adds `phase: 'natal-boundary'` and its group's `triggerId`. Conjunction events retain `matchedPlanet`, including for the stationary participant. Resolve the trigger against the supplied memberships for natal and boundary details. Each score's `boundary` field sums these events and `reception` is zero.

### Combined contributions

`calculateCombined(positions, cusps, memberships, receptions, boundaryReceptions)` returns all three caches. Each combined variant retains the natal `boundaries` groups and has a `receptions` group for each original and boundary-derived reception instance. The group's `pairId` is the instance ID; `events` are ordinary exchange awards and `boundaryEvents` are post-exchange boundary awards. Both carry `receptionId` equal to that ID. Ordinary events have `phase: 'reception'`; boundary events have `phase: 'post-exchange-boundary'` and `triggerId`. Each instance exchanges original position objects independently. Boundary and reception events contribute to their respective score fields.

## RankingSnapshot

The same baseline [ranking and tie rules](../specs/00-channel-calculation.md#channel-matrix-and-summaries) produce `base.ranking` from baseline scores and each `variants[key].ranking` from that variant's `Score.total` values.

```js
{
  rowHighlights: [
    {
      sourceChannel: 'luminaries',
      entries: [
        { targetChannel: 'venus', points: 5, level: 'highest' },
        { targetChannel: 'mars', points: 4, level: 'runnerUp' }
      ]
    },
    // Five more source-channel entries.
  ],
  globalLeaders: ['venus'],
  overallOrder: [
    { channelId: 'venus', points: 30 }
    // Five more entries in descending order.
  ]
}
```

Example IDs and values illustrate the shape only; they do not describe a verified chart.

- `rowHighlights` holds the selected target channels for each source row; `level` is `highest` or `runnerUp`.
- `globalLeaders` holds source-channel IDs tied at the global maximum; `overallOrder` orders all six sources by row totals.
- Rank by baseline or selected variant totals; reception-only scores are never a ranking basis.
- The result holds one `base.ranking` snapshot and one ranking snapshot per entry in each variant cache. The option-selection and lifecycle behavior is defined by [Feature-02](../specs/02-reception-channel-impact.md) and [Feature-03](../specs/03-boundary-planet-channel-scoring.md).
- One `ExtendedResult` is the sole stored channel-score result for a natal calculation. Its baseline and all variant caches derive from the same original positions and pair lists; the result does not duplicate their position or display records.
