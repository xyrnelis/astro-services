# Astro Services

Astro Services is an extensible collection of browser-based tools for natal-chart calculations and analysis. Each tool can be developed as a separate feature within the same project.

**Current status:** the Natal Chart Channels calculator is the first implemented feature. The project name refers to the broader application; additional services have not yet been implemented.

## Available feature: Natal Chart Channels

The current calculator accepts a birth date, time, and city and displays:

- Natal-chart positions calculated with Swiss Ephemeris in the browser.
- Zodiac signs and Placidus houses for the supported celestial bodies.
- A calculation of six natal-chart channels, including a channel interaction matrix and detailed calculation results.
- An optional manual UTC offset for birth-time interpretation.
- A shareable URL containing the calculation's birth data and selected location.

The interface is currently in Russian.

### Data sources and limitations

- Astronomy and Placidus houses are calculated in the browser using `@kuntay/swisseph`. The calculator downloads the ephemeris module and data from third-party CDNs, so an internet connection is required.
- City search uses Open-Meteo geocoding when the user explicitly starts a search. There is no automatic city autocomplete.
- Proserpina uses the standard hypothetical Swiss Ephemeris model. It has not been verified as the Sotis model.
- Placidus houses may be unavailable for some geographical coordinates. The calculator reports an error rather than silently switching house systems.
- Shared URLs contain birth details; anyone with the link can read those details.

## Project structure

```text
astro-services/
├── index.html                # Current web entry point: Natal Chart Channels
├── src/
│   ├── astronomy/            # Birth time, location, and chart calculations
│   ├── domain/               # Channel definitions and calculation rules
│   ├── ui/                   # Browser UI, result rendering, and shareable URLs
│   ├── main.js
│   └── styles.css
├── public/                   # Static assets and third-party license notices
├── scripts/
│   ├── build.mjs             # Creates the distributable site in dist/
│   └── serve.mjs             # Local HTTP server for dist/
└── package.json
```

The existing modules are organized by responsibility, allowing further calculators to be added without redefining the entire repository as a channel-only project.

## Local development

**Requirement:** Node.js 24 or later (as specified for this project).

Build and serve the static application:

```sh
npm run build
node scripts/serve.mjs
```

Open <http://127.0.0.1:4173>. To serve on a different port:

```sh
PORT=8080 node scripts/serve.mjs
```

The site is built into `dist/`. Build output is ignored by Git in the source repository.

## GitHub Pages deployment

### GitHub Free: private source repository and public site repository

For a GitHub Free account, use two repositories:

1. **`astro-services` (private)** contains the source code, documentation, and project history.
2. **`astro-services-site` (public)** contains the contents of `dist/` and is published with GitHub Pages.

To publish manually, run `npm run build`, copy the **contents** of `dist/` to the root of `astro-services-site`, and configure **Settings → Pages → Deploy from a branch → `main` → `/(root)`** in the public repository.

For automatic publishing, add the provided `publish-astro-services-pages.yml` workflow to the private repository at `.github/workflows/publish-pages.yml`. Create a fine-grained personal access token with **Contents: Read and write** access limited to `astro-services-site`, then save it as the `PAGES_TOKEN` Actions secret in the private repository. Configure the public repository and secret before enabling the workflow.

After publication, the project-site URL is:

`https://USERNAME.github.io/astro-services-site/`

Replace `USERNAME` with the GitHub account name.

### GitHub Pro: GitHub Pages from a private repository

If your GitHub plan supports Pages for private repositories, the provided `deploy-astro-services-private-pages-pro.yml` workflow can deploy directly from `astro-services` via GitHub Actions. Select **Settings → Pages → Source: GitHub Actions** for this option.

**Privacy note:** the GitHub Pages website and its delivered HTML, CSS, and JavaScript are publicly accessible in either deployment setup. Keep credentials and private data out of browser-delivered assets.

## Third-party licenses

- **Swiss Ephemeris** is distributed under **GNU AGPL-3.0**. See [license details](public/NOTICE.html) and the [included license](public/LICENSES/Swiss-Ephemeris-AGPL-3.0.txt).
- **Zodiac Fonts** icons are distributed under the **SIL Open Font License 1.1**. See [the included font license](public/zodiacfonts/OFL.txt).

See [`public/NOTICE.html`](public/NOTICE.html) for the attribution notice included in the published site.
