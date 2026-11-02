# Astro Services

Astro Services is an open-source collection of browser-based tools for natal-chart calculation and analysis. The repository can host multiple independent features over time.

**Currently available:** Natal Chart Channels, the first implemented feature. The user interface is in Russian.

## Natal Chart Channels

The calculator accepts a birth date, time, and city. It calculates planetary positions and Placidus houses, then computes six natal-chart channels and their interaction matrix. Users can specify a manual UTC offset or share a URL containing the selected birth details.

The browser loads `@kuntay/swisseph@0.2.2` from esm.sh and ephemeris files from jsDelivr. City search requests use Open-Meteo. An internet connection is required for these services. Shared URLs contain birth data and should be treated accordingly. Placidus houses can be unavailable for certain coordinates; no silent substitution is performed.

## Structure

- `src/astronomy/`: birth-time interpretation, location, and chart calculation.
- `src/domain/`: channels and calculation rules.
- `src/ui/`: interface, result rendering, shareable URLs.
- `src/main.js`, `src/styles.css`: current entry point and styling.
- `public/`: icons and third-party notices.
- `scripts/build.mjs`: produces `dist/` for deployment.
- `.github/workflows/deploy-pages.yml`: automatically publishes GitHub Pages from `main`.

## Run locally

Requires Node.js 22 or later. The current static build does not require installing npm dependencies:

```sh
npm run build
npm run start
```

Open `http://127.0.0.1:4173`.

## GitHub Pages

The public repository is [xyrnelis/astro-services](https://github.com/xyrnelis/astro-services). GitHub Actions builds `dist/` and publishes it when changes reach `main`, or when the workflow is run manually. Work on other branches does not trigger this deployment workflow.

To enable deployment, in repository **Settings → Pages → Build and deployment**, choose **Source: GitHub Actions**. The resulting site is:

https://xyrnelis.github.io/astro-services/

The former `astro-services-site` repository and its `PAGES_TOKEN` are unnecessary for this configuration.

## License and source code

The Astro Services application code is made available under the **GNU Affero General Public License, version 3 or later (AGPL-3.0-or-later)**. See the full [LICENSE](LICENSE) file. This statement applies to code for which this project's contributors hold the necessary licensing rights.

The running application includes a visible link to this source repository and license information. Build and deployment scripts are supplied here as part of the corresponding source.

**Third-party components retain their own copyright and licensing notices:**

- **Swiss Ephemeris**, by Dieter Koch and Alois Treindl / Astrodienst AG, used through [`@kuntay/swisseph@0.2.2`](https://github.com/kuntayerkus/swisseph-wasm): AGPL-3.0-or-later. [Swiss Ephemeris licensing](https://www.astro.com/swisseph/swephinfo_e.htm).
- **Zodiac Fonts** SVG symbols: SIL Open Font License 1.1, including reserved font name terms. See [`public/zodiacfonts/OFL.txt`](public/zodiacfonts/OFL.txt).

See [`public/NOTICE.html`](public/NOTICE.html) for the notice also shipped with the hosted application.

## Contributions

Before submitting code, ensure you are allowed to release it under AGPL-3.0-or-later and preserve notices for third-party assets. No license is granted to trademarks or third-party materials beyond their own terms.
