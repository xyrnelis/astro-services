# Feature-02: Mutual Reception Channel Scores (part 1)

**Feature Branch**: Not specified
**Created**: 2026-11-03
**Status**: Approved target behavior; implementation conformance not verified.

## Purpose and references

Add reception-specific channel scores for independently exchanged detected pairs, preserving the natal eight-step calculation. This part owns the feature's BR, FR, UC, and core acceptance scenarios; detailed UC-01 acceptance fixtures continue in parts 2 and 3.

- **[R1]** [Existing channel calculation](00-channel-calculation.md): scoring steps, source/target roles, base matrix, ranking, and highlight rules.
- **[R2]** [Reception detection](01-reception-detection.md): eligible pairs and the original positions-panel list.
- **[R3]** [Planet relationships](../models/PLANET-RELATIONS.md): planet roles and sign, house, and channel ownership.
- **[R4]** [Reception contract](../models/RECEPTION-CONTRACT.md): positions, pair IDs, shape, and ordering.
- **[R5]** [Channel calculation result contract](../models/CHANNEL-CALCULATION-RESULT.md): score, event, reception contribution, and ranking data structures.

## Use Case & Testing *(mandatory)*

### UC-01: Select reception-adjusted channel results

**Actors:** User; Astro Services.
**Preconditions:** A natal calculation succeeds with all 12 original positions and a pair list from [R2].

**Main Success Scenario:**
1. The system prepares the channel results (FR-01).
2. The user views the original results and reception controls (FR-03, FR-06–FR-10).
3. The user turns on `Учитывать рецепции`.
4. The system presents the selected cached result (FR-02, FR-07–FR-10).
5. The user changes any enabled suboption and reviews the updated result (FR-04).

**Alternative Flows:**
- **Alt-01 (main switch):** At step 3 or 5, the user turns reception mode off. Display and control state follow FR-03; return to step 3 to turn it on again.
- **Alt-02 (option 1):** At step 5, the user changes `Учитывать шаги 7–8`. Apply BR-14; continue at step 4.
- **Alt-03 (option 2):** At step 5, the user enables or disables `Учитывать обмен домами одного канала`. Apply BR-15; continue at step 4.
- **Alt-04 (option 3):** At step 5, the user enables or disables `Учитывать обмен знаками одного канала`. Apply BR-16 and the dependency in FR-04; continue at step 4.
- **Alt-05 (option 4):** With option 3 enabled, at step 5 the user changes `Учитывать соединения при обмене знаками одного канала`. Apply BR-17; continue at step 4.
- **Alt-06 (dependent reset):** With options 3 and 4 enabled, at step 5 the user turns option 3 off. Follow FR-04 and continue at step 4.
- **Alt-07 (combined options):** The user changes multiple enabled suboptions in any valid order. Each change follows FR-02; the resulting state selects a key defined by [R5].
- **Alt-08 (no pairs):** The completed chart contains no detected pairs. The user may still activate reception mode; the selected output follows BR-12 and FR-10.

**Exception Flows:**
- **Ex-01:** When the main switch is off, suboption inputs cannot be changed (FR-03); help remains accessible (FR-11).
- **Ex-02:** Attempting to activate option 4 while option 3 is off leaves it disabled (FR-04).

**Acceptance Scenarios:**
- **AS-01:** **Given** valid original positions, **when** scores are computed, **then** `base` matches [R1], each exchange preserves the input map, and each reception event can be traced to [R4] (BR-01–BR-03, BR-09–BR-11).
- **AS-02:** **Given** a completed chart and default suboptions, **when** the user enables reception mode, **then** the UI uses `variants['1000']`; switching reception mode off uses `base`, and selecting another valid suboption state uses its matching key (FR-02–FR-04, FR-07–FR-10; [R5]).
- **AS-03:** **Given** the cases [TC-01–TC-04 in part 2](02-reception-channel-impact-part-2.md) or [TC-05–TC-08 in part 3](02-reception-channel-impact-part-3.md), **when** their exchanges and settings are applied, **then** the exact event multisets and expected totals match those cases.
- **AS-04:** **Given** overlapping reception pairs or no pairs, **when** scoring runs with reversed pair order or an empty list, **then** the events and totals satisfy BR-09–BR-12.

### UC-02: Inspect scores, reception evidence, and settings help

**Actors:** User; Astro Services.
**Preconditions:** A calculated chart is displayed.

**Main Success Scenario:**
1. The user inspects the matrix and three summaries (FR-07–FR-08).
2. The user expands a channel's detailed calculation (FR-09–FR-10).
3. The user opens an option's information icon and reads the help (FR-05, FR-11).

**Alternative Flows:**
- **Alt-01:** The user inspects the detailed calculation with reception mode off (FR-09).
- **Alt-02:** The selected channel contains no reception events (FR-10).
- **Alt-03:** The user opens help by hover, touch, or keyboard, including on a narrow screen or a disabled checkbox (FR-11).

**Exception Flows:**
- **Ex-01:** The user presses Escape or interacts outside the help popover; dismissal follows FR-11.

**Acceptance Scenarios:**
- **AS-05:** **Given** reception mode on and a source channel with reception events, **when** its details open, **then** the correct pair groups and separate events appear in Step 9 (FR-09–FR-10).
- **AS-06:** **Given** any main-switch state, **when** the user accesses help by mouse, touch, or keyboard, **then** the exact texts, disabled-control access, exclusive popover behavior, and dismissal match FR-05 and FR-11.

### UC-03: Recalculate, restore, or clear a chart

**Actors:** User; Astro Services.
**Preconditions:** A chart may already be present.

**Main Success Scenario:**
1. The user calculates a new valid chart (FR-01, FR-12).
2. The user inspects the selected reception view (FR-02).
3. The user clears the form (FR-12).

**Alternative Flows:**
- **Alt-01:** The user restores the same birth input through a shared URL instead of submitting it manually (FR-12).
- **Alt-02:** The user repeatedly changes the main switch or suboptions following one successful calculation (FR-02).

**Exception Flows:**
- **Ex-01:** An invalid or incomplete position input follows [R1] validation; no synthetic default positions are introduced.

**Acceptance Scenarios:**
- **AS-07:** **Given** an existing chart, **when** the user recalculates, clears, or restores equivalent input from a shared URL, **then** cache and reception-list lifecycle match FR-12.
- **AS-08:** **Given** a completed result containing every key specified in [R5], **when** each key is selected repeatedly, **then** its scores, ranking, and Step 9 events stay consistent, with no calculator or ranking builder invoked during selection (FR-01–FR-02).
- **AS-09:** **Given** valid natal positions, **when** an extended result is generated, **then** `base` and all `variants` meet [R5], including key coverage, event provenance, score invariants, and independent ranking snapshots (FR-01).
- **AS-10:** **Given** the implementation, **when** focused domain and UI/integration tests and the static-site build run, **then** they pass with no new required runtime server dependency.

## Requirements *(mandatory)*

### Business Rules

- **BR-01:** Original natal awards constitute immutable `base`; never subtract them when a virtual condition ceases to hold.
- **BR-02:** Exchange the complete position objects of each [R2] pair in a separate virtual map. Retain planet IDs, P1/P2 roles, original channel membership, and the unmodified natal positions.
- **BR-03:** Evaluate only conditions affected by the exchanged planets. Do not rerun all eight steps or add entire virtual rows. Each reception event is identifiable by pair ID, source channel, generating step, subject planet, target channel, and conjunction partner when relevant.
- **BR-04:** Steps 1 and 3: each exchanged P1/P2 planet generates an event in its original source channel toward its new sign-owning channel when that owner differs from the original sign owner. See BR-16 for same-channel signs.
- **BR-05:** Steps 2 and 4: use the equivalent comparison of original and new house-owning channels. See BR-15 for identical houses and same-channel houses.
- **BR-06:** Steps 5 and 6: compare unordered same-sign pairs before and after the exchange. Each newly formed pair involving an exchanged planet creates two events, one in each participant's P1/P2 step and source channel toward the partner's channel. Existing pairs contribute no new conjunction events. See BR-17 for same-channel sign exchanges.
- **BR-07:** Step 7: compare the exchanged planets' membership in each source channel's two houses by planet identity. Newly entered memberships generate events toward the planet's channel. Stationary conjunction partners cannot create house-membership changes. See BR-14–BR-15.
- **BR-08:** Step 8: compare the exchanged planets' membership in each source channel's two signs by planet identity. Newly entered memberships generate events toward the planet's channel. See BR-14 and BR-16.
- **BR-09:** Preserve independent +1 events for distinct subjects, steps, conjunction partners, or pair IDs, even in the same matrix cell. Aggregate their scores per source and target according to [R5].
- **BR-10:** For each reception pair, construct candidate source channels from the original and independently exchanged positions: (1) for steps 1–6, the planet-owning channels of both exchanged planets; (2) for step 7, the house-owning channels of each exchanged planet's original and virtual houses; (3) for step 8, the sign-owning channels of each exchanged planet's original and virtual signs; and (4) for steps 5–6, the planet-owning channel of every stationary participant in a newly formed conjunction. Deduplicate candidates by channel ID and evaluate only their affected scoring conditions under BR-03–BR-08 and BR-13–BR-17. Candidate inclusion does not itself create a score event: each event must satisfy its corresponding scoring rule. “Original” means the position before the pair's independent full-object exchange; “virtual” means that same planet's position after it. Houses and signs are compared by value, while planet ownership is determined by the relevant channel definition.
- **BR-11:** Evaluate overlapping pairs separately from the same natal map; never chain exchanges. Summed event results must be independent of pair-processing order.
- **BR-12:** When no pair qualifies, reception contributions are zero and `total` equals `base`.
- **BR-13:** Original score conditions qualify as reception awards only if newly satisfied or explicitly permitted as repeat events by BR-15–BR-16.
- **BR-14:** Option 1 gates every reception event at steps 7–8, including optional BR-15–BR-16 events. It does not affect steps 1–6 or natal awards.
- **BR-15:** Option 2 permits one step-2/4 event per exchanged planet when its old and new houses share a channel, including 7→7 and 4↔5. Award that house channel. With option 1 on, permit one corresponding step-7 event in the house channel toward the planet's channel. Different house-channel owners follow BR-05 and BR-07.
- **BR-16:** Option 3 permits one step-1/3 event per exchanged planet changing between signs in one channel. Award that sign channel. With option 1 on, permit one corresponding step-8 event in the sign channel toward the planet's channel. Different sign-channel owners follow BR-04 and BR-08.
- **BR-17:** Option 4 permits step-5/6 events for new same-sign pairs produced by BR-16 sign exchanges. Every new unordered pair creates one event per participant, while original pairs add none. New conjunctions from exchanges between different sign channels follow BR-06 regardless of option 4.

### Functional Requirements

- **FR-01:** On each successful chart calculation, the system MUST compute the original `calculateChannels(positions)` result once and build a `base` ranking snapshot. It MUST precompute one reception result, score matrix, totals, event groups, and ranking snapshot per valid option key defined by [R5], using the ranking and tie rules from [R1].
- **FR-02:** The system MUST select `base` with reception mode off or `variants[key]` with it on, using the key derived from the four suboptions. Selection MUST only read cached data, with no astronomy, scoring, aggregation, or ranking recomputation.
- **FR-03:** The system MUST display one `Учитывать рецепции` switch in the separate results-settings panel above the results, initially off. Off disables suboption inputs while retaining their values; the displayed result follows FR-02.
- **FR-04:** After the permanently visible primary description, the system MUST display four suboptions in this exact order:
  1. `Учитывать шаги 7–8` (default on).
  2. `Учитывать обмен домами одного канала` (default off).
  3. `Учитывать обмен знаками одного канала` (default off).
  4. `Учитывать соединения при обмене знаками одного канала` (default off).
  Options 1–3 are independent. Indent option 4 beneath option 3; disable it while option 3 is off and reset it to off whenever option 3 is turned off.
- **FR-05:** The system MUST keep the exact primary description permanently visible directly below the main switch. Each suboption label remains visible; its adjacent information-icon popover MUST contain the corresponding exact help text:
  - Primary: `Добавляет к исходным баллам начисления за обмен положениями планет во взаимной рецепции. Исходные баллы сохраняются.`
  - Option 1: `Начислять баллы за планеты в домах каналов (шаг 7) и знаках каналов (шаг 8) после рецепции.`
  - Option 2: `Начислять баллы за обмен домами одного канала: один дом (7 → 7) или два дома (4 ↔ 5), шаги 2, 4, 7. Шаг 7 зависит от настройки «Учитывать шаги 7–8».`
  - Option 3: `Начислять баллы при обмене знаками одного канала: Марс в Овне ↔ Плутон в Скорпионе → Марс в Скорпионе, Плутон в Овне (шаги 1, 3, 8). Шаг 8 зависит от настройки «Учитывать шаги 7–8».`
  - Option 4: `Начислять баллы за новые соединения при обмене знаками одного канала (шаги 5–6). До: Плутон в Овне ☌ Юпитер ↔ Марс в Скорпионе ☌ Венера. После: Плутон в Скорпионе ☌ Венера ↔ Марс в Овне ☌ Юпитер.`
- **FR-06:** The system MUST retain the [R2] positions-panel reception list regardless of score-view selection.
- **FR-07:** The system MUST not display an overall score. With reception mode off, it MUST show baseline matrix cells, row totals, leaders, and highlights. With reception mode on, each matrix cell and row total with a positive reception contribution MUST show `base / total (+N рец)` with `(+N рец)` visually distinguished; values with zero contribution remain plain baseline numbers. Highlights use the selected ranking snapshot.
- **FR-08:** The system MUST show one selected set of `Верхние значения по каналам`, `Глобальный максимум`, and `Ранжирование по сумме`. A reception-mode summary value with a positive contribution shows the same breakdown as FR-07; a zero-contribution value remains a plain baseline number.
- **FR-09:** The system MUST keep the original steps 1–8 in both modes and append `Шаг 9. Взаимные рецепции` within each source channel only in reception mode.
- **FR-10:** In Step 9, the system MUST group events by detected pair with original planet/sign labels, displaying a pair only in source channels receiving events. Render each event separately as `Шаг N (краткий смысл шага): Целевой канал +1` with its virtual-position reason; retain duplicates. When a source has none, show `0 значений`.
- **FR-11:** Information icons MUST remain available with disabled checkboxes. Desktop hover opens help; touch tap toggles it; keyboard focus and Enter/Space open it. Escape or outside interaction closes it; icon activation never toggles the checkbox. Only one popover may open at once, and it must wrap on narrow screens.
- **FR-12:** Successful recalculation MUST replace cached results and the detected pair list; clearing the form MUST remove both. Equivalent manual input and shared-URL restoration MUST produce equivalent results and pair lists.

### Key Entities

- **Original positions / ReceptionPair:** Owned by [R1], [R2], and [R4]; pair records contain IDs rather than copied position labels.
- **ExtendedResult / BaseResult / ScoreVariant / OptionKey / AwardEvent / ReceptionContribution / Score / RankingSnapshot:** Owned by [R5]. The existing `calculateChannels(positions)` export and result contract from [R1] remain unchanged.
- **Option configuration:** The four selections in FR-04 map to `OptionKey` as defined in [R5].

### Architecture Delta and Scope

- `src/domain/calculate-with-receptions.js`: replace obsolete full-row reruns and original-owner-only source selection with targeted events, independent swaps, option gates, and cached variants.
- `src/domain/calculate-channels.js`: preserve baseline behavior and reuse ranking construction across variants.
- `src/ui/app.js`: coordinate controls and stored-result selection.
- `src/ui/render.js`, `src/styles.css`: render option controls and help, selected score views, and Step 9.
- Preserve reception detection and positions display [R2], original steps and rankings [R1], and astronomy. Exclude aspects, orbs, and chained multi-pair exchanges.
