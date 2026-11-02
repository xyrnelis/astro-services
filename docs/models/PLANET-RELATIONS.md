# Planet and Channel Relationships

Status: domain reference for Stage 1 and later channel extensions.

## Canonical data

`src/domain/channels.js` owns `CHANNELS`, `PLANETS` and `DISPLAY_PLANETS`.
There are six channels. Each defines two planet IDs, two sign IDs and two house numbers.
Planet, sign and house ownership is unique across channels.
`CHANNELS[n].planets[0]` is primary; `[1]` is minor for the existing scoring steps.
For the sign-rulership relation used by reception detection, both have equal authority.

```text
Channel -> two Planets
        -> two Signs
        -> two Houses
Sign -> one Channel -> its two ruling Planets
Planet -> one Channel -> its ruled Signs
```

Original signs and houses are properties of `chart.positions`, not of this catalog.
Chart positions must never be copied into permanent channel relationships.

## Shared projections

Stage 1 extracts the four generated maps from `channels.js` into
`src/domain/channel-relations.js` and adds one generated map there:

- `channelIndexById[channelId]`: row/column index.
- `channelByPlanet[planetId]`: owning channel ID.
- `channelBySign[signId]`: owning channel ID.
- `channelByHouse[houseNumber]`: owning channel ID.
- `rulersBySign[signId]`: both ruling planet IDs, derived from that sign's `CHANNELS` record.

All projections are created from imported `CHANNELS`. Do not duplicate the catalog.
Do not re-export or copy `PLANETS` or `DISPLAY_PLANETS`; import them from `channels.js`.

## Required consumers

- Existing `src/domain/calculate-channels.js` imports the four moved maps.
- Existing `src/ui/render.js` imports `channelIndexById` from the shared module.
- `src/domain/find-receptions.js` imports `rulersBySign`.
- `channels.js` no longer declares the four moved maps.
- `channel-relations.js` imports `CHANNELS` from `channels.js`; no reverse import is allowed.

The shared file must exist only as part of these import rewrites. Remove obsolete duplicate
exports and update all usages in the same change. Do not create unused wrapper modules.

## Boundaries

- The shared module contains reusable relationships and lookup data only.
- The detector owns its single-use reception predicate and pair construction.
- UI text belongs to presentation constants and does not belong in relationship records.
- Eligibility rules: [Stage 1 specification](../specs/01-reception-detection.md).
- Pair output shape: [Reception contract](RECEPTION-CONTRACT.md).
