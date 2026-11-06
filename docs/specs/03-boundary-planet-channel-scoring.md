# Feature-03: Boundary Planet Channel Scoring (part 1)

**Feature Branch**: `[NEEDS CLARIFICATION: branch name]`
**Created**: 2026-11-04
**Status**: Draft; calculation decisions confirmed through 2026-11-05, with remaining implementation-specific clarifications

## Purpose and references

Extend channel scoring with optional additional sign/house memberships for planets near boundaries, with a separately configurable interaction with receptions. Preserve original natal positions and approved baseline/reception semantics when the new scoring option is off. Exact house-cusp assignment is a prerequisite correction.

- **[R1]** [Existing channel calculation](00-channel-calculation.md): baseline steps 1-8 and award identities.
- **[R2]** [Feature-02 reception scoring](02-reception-channel-impact.md): virtual exchanges, reception options and Step 9.
- **[R3]** [Reception detection](01-reception-detection.md): original-pair eligibility and exclusion.
- **[R4]** [Planet relationships](../models/PLANET-RELATIONS.md): canonical planets, channels, sign and house owners.
- **[R5]** [Calculation result contract](../models/CHANNEL-CALCULATION-RESULT.md): original baseline, reception score variants and rankings.
- **[R6]** [Reception contract](../models/RECEPTION-CONTRACT.md): existing pair IDs and identity.
- **[Part 2](03-boundary-planet-channel-scoring-part-2.md)**: detailed test fixtures and unresolved test outcomes for this feature.

## Use Case & Testing *(mandatory)*

### UC-01: Inspect boundaries and select optional channel scoring

**Actors:** User; Astro Services.
**Preconditions:** A chart calculation returns 12 planet positions and 12 Placidus cusps.

**Main Success Scenario:**
1. User calculates a chart; system produces the `Пограничности` list (FR-01).
2. System displays the original `Взаимные рецепции` list, followed by `Взаимные рецепции с пограничностью` (FR-02).
3. User opens `Настройки результатов` and activates `Учитывать пограничные планеты` (FR-03).
4. User selects its own suboptions, independently of reception controls (FR-04).
5. System selects the matching precomputed channel results and details (FR-05 to FR-07).
6. User disables the new mode and sees the appropriate non-boundary result again.

**Alternative Flows:**
- **Alt-01:** Empty lists display `Пограничные положения не обнаружены` and `Взаимные рецепции с пограничностью не обнаружены`, respectively. Both sections are always displayed when Feature-03 data is supplied.
- **Alt-02:** Either main switch is on alone; its other feature's additional awards remain disabled (BR-15). Defaults for the boundary suboptions are specified in FR-04.
- **Alt-03:** Both switches are on; combined scoring follows UC-03.

**Exception Flows:**
- **Ex-01:** Invalid longitude or cusp input uses the existing calculation error behavior.

**Acceptance Scenarios:**
- **AS-01:** Given any valid chart with the boundary main switch off, when toggled off again, the natal or reception-only numbers match [R1]/[R2] with no boundary awards.
- **AS-02:** Given any valid chart, when its result settings are changed repeatedly, original `positions` and cusp values remain unchanged.
- **AS-03:** Given a chart with qualifying boundaries, when settings are switched, the initial `Пограничности` list remains available.

### UC-02: Add boundary events to steps 1-8

**Actors:** User; Astro Services.
**Preconditions:** One or more boundary memberships qualify and boundary scoring is enabled.

**Main Success Scenario:**
1. System retains the full original award multiset (BR-01).
2. For each qualifying planet, it creates its permitted additional placement(s) (BR-02 to BR-07).
3. It calculates only new awards affected by those placements under steps 1-8 (BR-08 to BR-12).
4. It applies boundary-specific options and retains independent award provenance (BR-13 to BR-14).
5. User opens `Подробный расчёт`, sees `(погр)` in the corresponding original step, and inspects updated matrix rankings.

**Alternative Flows:**
- **Alt-01:** A planet qualifies by sign, house or both (BR-06).
- **Alt-02:** Multiple close cusps give several additional houses; count each new house independently, and each added sign once (BR-05 to BR-07).
- **Alt-03:** Several planets each create an independent additional conjunction (BR-11).
- **Alt-04:** The added sign or house belongs to the same channel (BR-13).
- **Alt-05:** Boundary wraps Pisces/Aries or houses 12/1 (BR-02 to BR-05).

**Exception Flows:**
- **Ex-01:** Exact cusp equality uses the cusp's starting house (BR-16); this case must not fail.

**Acceptance Scenarios:**
- **AS-04:** Given a planet at 3°00'00" or 27°00'00" within a sign, when evaluated, secondary membership qualifies; at 3°00'01" and 26°59'59" it does not.
- **AS-05:** Given a secondary sign with a conjunction partner, when its independent placement is evaluated, qualifying step-5/6 events and optional step-8 events appear.
- **AS-06:** Given two boundary planets in neighboring original signs, when each crosses separately, each independent newly qualified conjunction is retained; repeated physical pairs remain distinguishable by trigger.
- **AS-07:** Given a qualifying same-channel boundary, when its corresponding same-channel option is enabled, its award is counted again; steps 7-8 also require their separate option.
- **AS-08:** Given a planet exactly on cusp 2, when a natal chart is calculated, house 2 is assigned; a planet immediately before that cusp belongs to house 1.
- **AS-14:** Given Mars at 29° Aries and Jupiter at 28° Aries, when both qualify for and receive a combined alternate Taurus placement, the natal conjunction remains in the baseline and the unchanged conjunction produces no additional Step 5/6 award.

### UC-03: Combine boundaries and independent mutual receptions

**Actors:** User; Astro Services.
**Preconditions:** User has an eligible chart, both main settings, and independently configured suboptions.

**Main Success Scenario:**
1. System retains the unchanged baseline, then adds natal-boundary awards (BR-15).
2. System evaluates the eligible reception pairs/configurations, using independent swaps per pair (BR-17).
3. System adds the ordinary reception awards according to [R2] and reception suboptions.
4. System evaluates additional boundary placements at exchanged coordinates and adds their qualifying events (BR-18).
5. User inspects each group and its `(погр)` events inside Step 9 (FR-08).

**Alternative Flows:**
- **Alt-01:** A boundary membership creates a qualifying reception absent from the original list (BR-19).
- **Alt-02:** A pair qualifies under more than one sign arrangement; each qualifying reception configuration is calculated independently (BR-19).
- **Alt-03:** Exchanges create a new qualifying boundary house or sign or a new full-sign conjunction.

**Exception Flows:**
- **Ex-01:** Identical awards from distinct stages or eligible reception configurations remain separate and traceable (BR-20).

**Acceptance Scenarios:**
- **AS-09:** Given both modes enabled, when scoring, the execution phases occur in BR-15 order; phase-4 awards add to boundary (`п`) totals (BR-20).
- **AS-10:** Given a reception-exchanged position at 29° Aries, when boundary scoring is on, its additional Taurus membership can generate Step-9 sign and optional Step-8 events. Given Mercury 29° Aries, Mars in Gemini and Pluto in Virgo, both original reception pairs independently produce Mars/Pluto at 29° Aries with Taurus boundary awards.
- **AS-11:** Given overlapping valid pairs, when exchanges are processed in a different sequence, the final award multiset and matrix remain identical.

### UC-04: Refresh the computed chart and its options

**Actors:** User; Astro Services.
**Preconditions:** A chart may already be calculated.

**Main Success Scenario:**
1. User enters new birth data and recalculates; cached results and boundary/reception listings are replaced (FR-09).
2. Both primary options reset to off, following current reception behavior.
3. User clears the form; old chart and listed results disappear.

**Alternative Flows:**
- **Alt-01:** A birth-data-only shared URL reproduces the lists and cached scores; main scoring options start off.

**Exception Flows:**
- **Ex-01:** Failed astronomical calculation uses the existing failure-handling path; no false boundary results appear.

**Acceptance Scenarios:**
- **AS-12:** Given a chart with both modes on, when new birth data succeeds, both main switches are off and precomputed results reflect the new chart.
- **AS-13:** Given the same valid birth input manually and by shared URL, when calculated, boundary/reception lists and eligible result variants agree.

## Requirements *(mandatory)*

### Business Rules

- **BR-01:** Original natal step-1-to-8 events remain immutable. Additional memberships contribute independent `+1` events; unaffected natal events are never repeated merely because another placement is evaluated.
- **BR-02:** Sign distance is measured in unrounded ecliptic longitude, cyclically over 360°. Secondary sign membership exists in inclusive 27°00'00"-30°00'00" and 0°00'00"-3°00'00" zones of each sign; 0° belongs primarily to the starting sign and secondarily to the preceding sign. Exact 3° qualifies.
- **BR-03:** Every Placidus cusp uses an inclusive angular orb of 1.5° on each side. A cusp's flanking houses are house N-1 and house N; house 1 follows house 12.
- **BR-04:** Natal sign and natal house identities remain authoritative. Direction of motion, retrogradation and speed are irrelevant for all 12 objects; boundary eligibility uses longitudes and cusps only.
- **BR-05:** A planet qualifies for an additional house on the other side of every cusp within the house orb. Membership count has no fixed two-house cap; each distinct additional house generates its affected house awards separately.
- **BR-06:** A planet qualifying by both sign and house uses the combined altered-sign-and-altered-house position, not intermediate sign-only or house-only full placements. With multiple additional houses, it has one combined position per house; added sign facts are counted once across them. If only one kind of boundary qualifies, change that dimension alone.
- **BR-07:** Evaluate affected facts only. For a planet with multiple additional houses, count each distinct eligible house independently under BR-05, but each added sign and its sign-based conjunction effects only once; unchanged facts never repeat.
- **BR-08:** Steps 1 and 3 award the channel of each additional sign for the corresponding P1/P2; steps 2 and 4 do the same for each additional house, using original planet roles from [R4].
- **BR-09:** Step 7 awards the planet's owning channel from each newly eligible house of each source channel; step 8 does likewise for each newly eligible sign. Both are controlled by the boundary-specific steps-7-8 option.
- **BR-10:** Boundary step-5/6 eligibility is full-sign conjunction in each added sign position, including partners at unchanged natal signs. Each newly eligible unordered pair produces directed participant events according to [R1]/[R2]. This includes newly formed post-exchange conjunctions triggered only by a stationary partner’s additional sign; award the Mars-triggered conjunction in the approved Mars/Venus scenario.
- **BR-11:** When two boundary planets independently jump into each other's signs, count each newly created conjunction separately, identifying which planet's move caused it. An unordered pair already conjunct natally produces no additional conjunction award when it remains conjunct in a combined alternate placement; the conjunction fact did not change. Original conjunction awards remain in the baseline.
- **BR-12:** No step award can be generated solely because an unaffected position is traversed during evaluation. Repeating a source/target channel is permitted when qualifying reasons differ.
- **BR-13:** Same-channel sign and house awards, and new same-channel sign conjunctions, follow the respective boundary suboptions from FR-04; reception suboptions govern reception-origin awards only. Disabling the same-channel sign option also disables the dependent conjunction option.
- **BR-14:** Every boundary-specific step-7/8 award is suppressed when its own steps-7/8 suboption is off; primary steps 1-6 retain their independently permitted awards.
- **BR-15:** Scores use four additive phases: (1) original natal; (2) natal boundaries; (3) eligible receptions, including boundary-derived pairs where confirmed; (4) post-exchange boundary effects for each independent reception. Boundary phases require the boundary main switch; reception phases require the reception main switch. Phase 4 applies only with both switches enabled; any added awards preserve earlier phases.
- **BR-16:** Exactly on cusp N, natal house is N. Immediately preceding cusp N in zodiacal direction belongs to house N-1, and immediately following belongs to N, with cyclic house numbering. Exact-cusp rejection in the supplied code is an implementation defect to correct before Feature-03.
- **BR-17:** Each reception exchange starts from the original natal positions, never from a preceding pair's virtual map. Existing reception eligibility and same-sign exclusion from [R3] apply to each sign arrangement independently. When one physical pair qualifies under two sign configurations, count two reception instances and their complete eligible award sets separately, even if their virtual coordinate swaps coincide.
- **BR-18:** After a full-position exchange, evaluate boundaries at the received longitude and its house/cusp relationships. A stationary conjunction partner participates at its natal sign: an original-sign conjunction with the exchanged planet counts; if its alternate boundary sign removes that conjunction, no points are subtracted or repeated. If its added sign creates a new conjunction with the exchanged planet, count the new step-5/6 awards, including the award for the stationary planet, in phase 4 (`п`).
- **BR-19:** Secondary signs may establish additional mutual-reception eligibility; distinguish them from phase-4 boundary scoring on an already-valid natal pair. Keep original eligible configurations in `Взаимные рецепции` and list extra boundary-qualified configurations under `Взаимные рецепции с пограничностью`, even for the same physical pair. For example, Mercury 29° Aries with Mars in Gemini and Pluto in Virgo forms two original pairs, while Taurus is an added position of Mars or Pluto after the corresponding swap.
- **BR-20:** Every award has one origin phase and generating step, even for duplicate channel targets. Phases 2 and 4 contribute to the boundary (`п`) subtotal; phase 3 contributes to the reception (`р`) subtotal. For every score cell, `total = base + boundary + reception`. Independent reception pairs and boundary triggers retain separate event provenance.

### Functional Requirements

- **FR-01:** Render a `Пограничности` block beneath positions with all qualifying sign/house memberships, prepared at chart calculation, regardless of scoring-toggle state. Preserve the original positions table unchanged.
- **FR-02:** Retain the original `Взаимные рецепции` list and append `Взаимные рецепции с пограничностью` as a subsection under it; precompute both lists with the chart.
- **FR-03:** Add `Учитывать пограничные планеты` in `Настройки результатов`, initially off; enable and disable independently of `Учитывать рецепции`.
- **FR-04:** Present four boundary suboptions, independently of reception settings, in this order: `Учитывать шаги 7–8` (default off); `Учитывать переход между домами одного канала` (default on); `Учитывать переход между знаками одного канала` (default on); `Учитывать соединения при переходе между знаками одного канала` (default on). Switching the third off also turns the fourth off and disables it until the third is re-enabled, without rechecking it. Help follows the reception controls' accessible popover behavior and explains steps 7–8 and the fourth option's dependency, using the examples below.
  - `Начислять баллы за планеты в домах каналов (шаг 7) и знаках каналов (шаг 8) при пограничном переходе.`
  - `Начислять баллы за переход между домами одного канала: 4 → 5 (шаги 2, 4, 7). Шаг 7 зависит от настройки «Учитывать шаги 7–8».`
  - `Начислять баллы при переходе между знаками одного канала: Луна в Раке → Луна во Льве (шаги 1, 3, 8). Шаг 8 зависит от настройки «Учитывать шаги 7–8».`
  - `Начислять баллы за новые соединения при переходе между знаками одного канала (шаги 5–6). Например: Луна в Раке → Луна во Льве ☌ Солнце. Настройка зависит от переходов между знаками одного канала.`
- **FR-05:** Precompute all supported selected-result configurations on chart calculation using [R5]: preserve the 12 reception-only `variants`, add 12 `boundaryVariants`, and add 144 `combinedVariants`. A combined key is `${OptionKey}:${BoundaryOptionKey}`, with reception options first. Toggling either mode or suboptions selects prepared data without rerunning astronomy, scoring or ranking.
- **FR-06:** Update matrix cells, source row totals, highlights, leaders and rankings from the selected score variant, preserving [R1] ranking rules.
- **FR-07:** Render natal boundary events in their matching steps 1-8 of `Подробный расчёт`, with `(погр)` immediately after the changed sign/house reason; unchanged original entries remain visible.
- **FR-08:** In reception mode, retain Step 9's per-pair structure with separate groups for each eligible sign configuration of a pair. Display ordinary exchange events, then separately identify post-exchange boundary events with `(погр)` and their generating step. Stationary conjunction partners appear in award reasons, not as reception-list pairs merely because of a conjunction.
- **FR-09:** On new successful calculation, reset both primary modes to off and replace caches/lists while retaining current suboption values, following reception controls. On clear, remove results and reset boundary suboptions to the FR-04 defaults. Shared URLs serialize birth data only.
- **FR-10:** Positive score contributions use baseline/total and a same-size colored suffix: `5 / 10 (+2п, +3р)` when both sources contribute; `5 / 10 (+2 погр.)` or `5 / 10 (+3 рец.)` for a single source. Apply to matrix, row totals and summary score values; unchanged values remain plain. Use BR-20 attribution, including phase-4 (`п`) events.
- **FR-11:** Keep the static-site architecture and existing domain/UI boundaries; changes to share URLs, zodiac/house systems and source channel ownership are outside scope.

### Key Entities

- **BoundaryMembership:** Planet ID, unchanged natal sign/house, membership kind, added sign/house, triggering boundary/cusp and circular distance. Multiple cusp matches are representable.
- **BoundaryPlacement:** A planet's permitted additional sign/house configuration and trigger identity; origin of affected step evaluation, preserving natal object ownership.
- **BoundaryAward:** Existing award fields plus origin phase, generating step, trigger and conjunction partner where relevant; reception-linked events also link the relevant reception instance.
- **BoundaryReceptionInstance:** A pair of planets, qualifying sign arrangement, instance ID composed from pair plus sign configuration, and an independent swap and award set. The same physical pair can have multiple instances.
- **ExtendedResult:** [R5] owns the reception-only, boundary-only and combined caches and their key grammar. Feature-03 composite scores add the `boundary` subtotal from BR-20 and preserve independent reception and boundary options.

### Architecture Delta and Scope

- `src/astronomy/chart-calculator.js`: prerequisite exact-cusp house assignment and focused regression tests; retain full-precision coordinates.
- `src/domain/calculate-channels.js`, `src/domain/calculate-with-receptions.js`, `src/domain/find-receptions.js`: boundary placement evaluation, reception interaction and event provenance, preserving existing exports when boundary mode is off.
- `src/ui/app.js`, `src/ui/render.js`, `src/styles.css`, `index.html`: precomputed mode selection, new lists, settings, score suffixes, and event grouping.
- Implement and test unresolved calculation semantics only after clarification; no new server or astronomy system.
