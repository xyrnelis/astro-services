# Architecture

Status: current codebase, including Stage 1 reception detection.
Evidence: `index.html`, `src/` and `scripts/` from the supplied project archive.
Stage 1 requirements are recorded in [Stage 1](docs/specs/01-reception-detection.md).

## Application shape

```text
index.html -> src/main.js -> src/ui/app.js
                               |-> astronomy/* -> chart.positions
                               |-> domain/calculate-channels.js
                               |-> domain/find-receptions.js
                               `-> ui/render.js -> DOM
```

The app uses native browser ES modules, direct DOM updates and no frontend framework.
There is no application server, router or global client store in the reviewed source.

## Responsibilities

### Entry and UI

- `index.html`: birth form and output containers.
- `src/main.js`: initializes the application.
- `src/ui/app.js`: event handling, city selection, calculation coordination, error and clear flows.
- `src/ui/render.js`: HTML for planet positions, mutual receptions, matrix, rankings and eight scoring steps.
- `src/ui/share-url.js`: birth input serialization to and from URL parameters.
- `src/styles.css`: layout, table and responsive styles.
- State is local to `initializeApp()`; the app writes results into `#positions-results` and `#results`.

### Astronomy

- `src/astronomy/geo.js`: city lookup via Open-Meteo.
- `src/astronomy/time.js`: birth-time conversion and timezone/UTC-offset handling.
- `src/astronomy/chart-calculator.js`: Swiss Ephemeris, 12 object positions and Placidus houses.
- `chart.positions` contains one position for each of the 12 configured planet IDs.

### Domain

- `src/domain/channels.js`: single channel catalog (`CHANNELS`), planet IDs/order and labels.
- `src/domain/channel-relations.js`: lookup maps and sign rulers derived from `CHANNELS`.
- `src/domain/calculate-channels.js`: input validation, eight award steps, 6 x 6 numeric
  matrix, per-award events, totals, leaders and symmetry check.
- `src/domain/find-receptions.js`: mutual domicile-by-sign reception detection from original
  chart positions.
- Virtual position exchange and reception bonuses are absent.

## Current calculation flow

```text
Form submit or shared URL
  -> resolve birth instant and coordinates
  -> calculateChart(input, ephemeris)
  -> findReceptions(chart.positions)
  -> calculateChannels(chart.positions)
  -> renderPositions(chart, birth, receptions)
  -> renderResults({ calculation, chart, birth })
```

## Dependency boundaries

- Astronomy produces chart data and does not depend on DOM rendering.
- Domain consumes chart positions and the channel catalog; it must not depend on UI or browser APIs.
- UI coordinates and renders results; it must not implement domain eligibility rules.
- `CHANNELS` remains the only editable source of channel/planet/sign/house assignments.
- Derived lookup structures are generated from `CHANNELS`, never independently maintained.
- Extract shared code only when existing or new callers actually import it; remove its old
  definition from the original file instead of keeping parallel implementations.
- Keep single-use predicates, normalization helpers and JSDoc types with their caller.

## Build and external services

- `scripts/build.mjs` copies `index.html`, `src/` and `public/` into `dist/`.
- `scripts/serve.mjs` runs a minimal Node HTTP server for `dist/`.
- Open-Meteo provides geocoding; Swiss Ephemeris browser resources are external.
- `./zodiacfonts/` contains the referenced SVG assets in the full project.
- The reviewed archive omitted `public/` and `package.json`; the user confirmed both exist.

## Related documentation

- [Planet and channel relationships](docs/models/PLANET-RELATIONS.md)
- [Reception result contract](docs/models/RECEPTION-CONTRACT.md)
- [Stage 1 specification and architectural delta](docs/specs/01-reception-detection.md)
