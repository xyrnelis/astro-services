# Channel Calculation Result Contract

Status: implemented and verified Feature-02 contract (2026-11-04). See [Feature-02 (part 1)](../specs/02-reception-channel-impact.md).

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
  }
}
```

- `base.calculation` is exactly one original `calculateChannels(positions)` result. Its numeric `matrix`, `rowTotals`, `events`, and other existing fields remain intact; it supplies the original steps 1–8.
- `base.ranking` is the baseline `RankingSnapshot` derived from `base.calculation`.
- `variants` has exactly one complete `ScoreVariant` for each valid `OptionKey`, including configurations with no additional awards. No redundant top-level matrix, events, or rankings fields exist.
- The `ScoreVariant` fields are paired: its `receptions`, scores, and `ranking` all correspond to the same option key. No variant changes `base.calculation` or its `ranking`.
- `ExtendedResult`, `BaseResult` (the `base` object), `BaseCalculationResult`, `Score`, `ScoreVariant`, `ReceptionContribution`, and `RankingSnapshot` are schema labels, not requirements to create standalone JavaScript model files.

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

### Score

```js
{ base: 3, reception: 3, total: 6 }
```

- The only additional-award field name is `reception`; `total = base + reception`.
- Every `ScoreVariant` matrix cell, row total, and overall score has this shape, with nonnegative integer values.
- `Score.base` equals the corresponding numeric value from `base.calculation`. `Score.reception` is the sum of events in this variant for the corresponding source/target cell.
- Matrix rows and columns retain the [baseline canonical order](../specs/00-channel-calculation.md#existing-output-contract). `rowTotals[i]` is the fieldwise sum of `matrix[i]`, and `overallScore` is the fieldwise sum of `rowTotals`.
- Symmetry is not required. Separate score events may contribute to one matrix cell.

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
- The result holds one `base.ranking` snapshot and one `variants[key].ranking` snapshot per valid key. The option-selection and lifecycle behavior is defined by FR-02 and FR-12 in [Feature-02](../specs/02-reception-channel-impact.md).
- One `ExtendedResult` is the sole stored channel-score result for a natal calculation. Its baseline and variants derive from the same original positions and pair list; the result does not duplicate their position or display records.
