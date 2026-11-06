# Reception Result Contract

Status: Stage 1 domain contract. Referenced by the [Stage 1 specification](../specs/01-reception-detection.md).

## Input

`findReceptions(positions)` consumes the original `chart.positions` map produced by
`src/astronomy/chart-calculator.js`, indexed by the 12 IDs from `PLANETS`.

Each position provides `longitude`, `formattedLongitude`, `sign`, `house` and `source`.
The detector reads original signs and does not update the input map. It validates only
the fields it requires: all 12 known planet IDs must be present and each must have a
known sign. Other chart fields are produced by the chart calculator but are outside
reception detection's validation boundary.

## Output

```js
[
  {
    id: 'Venus:Mars',
    planets: ['Venus', 'Mars']
  }
]
```

- The result is an array of unique `ReceptionPair` values.
- `planets` is a tuple of two distinct known planet IDs in canonical `DISPLAY_PLANETS` order.
- `id` joins the two ordered IDs with `:`; A/B and B/A have the same identity.
- Results are sorted by the first and second canonical planet indices.
- Each object contains IDs only; signs, localized text, HTML and virtual positions are excluded.
- A valid chart with no receptions returns `[]`.
- A missing planet or missing or unknown sign produces an explicit validation error.
- Multiple entries may share a planet when separate pairs qualify.

## Implementation ownership

`findReceptionLists(positions, memberships)` accepts the same positions and precomputed
boundary memberships from `findBoundaryMemberships`. It returns `receptions` with the
unchanged `findReceptions` result and `boundaryReceptions` with additional configurations:

```js
{
  id: 'Sun:Saturn:Aquarius:Leo',
  pairId: 'Sun:Saturn',
  planets: ['Sun', 'Saturn'],
  signs: ['Aquarius', 'Leo'],
  triggerIds: ['Sun:sign:Aquarius']
}
```

Each instance ID joins the canonical pair ID and the corresponding ordered signs with
`:`. Trigger IDs identify each added sign as `planetId:sign:addedSign`, in planet order.
Only sign memberships participate; duplicate signs are ignored. Each qualifying
configuration with at least one added sign appears separately, including when its pair
also qualifies natally. Instances follow canonical pair order, then the Cartesian product
of each planet's natal sign followed by its distinct added signs in membership order.
The same reception rules and input position validation apply, and inputs are not mutated.

The `ReceptionPair` JSDoc typedef, canonical pair creation and mutual-rulership predicate
belong inside `src/domain/find-receptions.js` while they have no second consumer.
Do not create separate JavaScript files solely for the typedef or one local helper.

The renderer resolves original signs from `positions` and obtains text labels from UI
constants. Stage 2 can reuse these pair IDs with the original chart without changing
this contract.

## Invariants

- Detection is deterministic for the same input.
- Reverse-order duplicates never appear.
- No chart positions or other application state are mutated.
- Detection does not award channel points.
