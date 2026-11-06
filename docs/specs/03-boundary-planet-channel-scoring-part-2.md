# Feature-03: Boundary Planet Channel Scoring (part 2)

**Status**: Draft; acceptance fixtures for [part 1](03-boundary-planet-channel-scoring.md), decisions confirmed through 2026-11-05.
This part continues the UC-01 through UC-04 acceptance scenarios. Each scenario records input and verifiable output; unresolved outcomes are marked explicitly. Planet and channel mappings, step ownership, and score structures remain owned by [part 1 references](03-boundary-planet-channel-scoring.md#purpose-and-references).

## Use Case & Testing

### UC-01: Inspect boundaries and select optional channel scoring (fixtures)

#### TC-01: Exact sign thresholds

**Given:** A planet with longitude measured inside Aries at each independent position below.
**When:** Build sign memberships.
**Then:**
- Aries 03°00'01": Aries only.
- Aries 03°00'00": Aries and Pisces.
- Aries 00°00'00": Aries and Pisces.
- Aries 26°59'59": Aries only.
- Aries 27°00'00": Aries and Taurus.
- Aries 29°59'59": Aries and Taurus.
- Pisces 29°59'59": Pisces and Aries.
- Longitude 360°00'00": identical to 0° Aries with Pisces secondary.

**Covers:** BR-02, BR-04; AS-03 to AS-04.

#### TC-02: Exact house cusp ownership and preliminary fix

**Given:** Placidus cusp 2 at Aries 03°04'11", and no coincident adjacent cusp.
**When:** Calculate primary house for planets immediately around this longitude.
**Then:**
- Longitude 03°04'10": house 1.
- Longitude 03°04'11": house 2.
- Longitude 03°04'12": house 2.
- No `cusp-boundary` error is thrown.
- Cusp 1 at 0° similarly assigns 0° to house 1 and 359°59'59" to house 12.

**Covers:** BR-16; UC-02 AS-08.

#### TC-03: House boundary thresholds

**Given:** Cusp 8 at longitude 100°00'00", and a planet on either side, with no other nearby cusps.
**When:** Build house memberships using the approved 1.5° inclusive orb.
**Then:**
- At 98°30'00" or 101°30'00": houses 7 and 8.
- At 98°29'59" or 101°30'01": no additional membership from this cusp.
- At exactly 100°00'00": primary house 8, secondary house 7.

**Covers:** BR-03, BR-16. **Status:** Confirmed.

#### TC-04: Multiple nearby cusps

**Given:** Cusp 5 at 100°, cusp 6 at 102°, and planet at 101° with primary house 5.
**When:** Determine qualifying neighboring houses at a 1.5° orb.
**Then:** House memberships contain houses 4, 5 and 6; each additional house is scored separately. If the planet is also sign-boundary, its added sign and conjunction reasons are scored once across both added houses.

**Covers:** UC-02 Alt-02; BR-05.

### UC-02: Add boundary events to steps 1-8 (fixtures)

#### TC-05: Mars enters Taurus near end of Aries

**Given:** Mars at 29° Aries and Venus at 5° Taurus, with no other planet in Taurus and no qualifying extra house for Mars. Mars owns the primary position of its channel, Venus owns the primary position of hers.
**When:** Apply the Mars-to-Taurus additional placement with the boundary steps-7/8 option enabled.
**Then:** The additional sign-triggered awards attributable to Mars are:

```text
Mars source channel: Step 1 -> Venus +1 [Mars in Taurus (погр)]
Mars source channel: Step 5 -> Venus +1 [Mars conjunction Venus in Taurus (погр)]
Venus source channel: Step 5 -> Mars +1 [Venus conjunction Mars in Taurus (погр)]
Venus source channel: Step 8 -> Mars +1 [Mars in Taurus (погр)]
```

**Expected:** Four additional `+1` events from this trigger; with boundary step-7/8 disabled, three. Contributions from any other planet placements are outside this fixture.

**Covers:** BR-08 to BR-10, BR-14; AS-05.

#### TC-06: Both planets independently cross into each other's signs

**Given:** Mars 29° Aries, Venus 1° Taurus; original signs differ.
**When:** Evaluate two independent sign jumps, Mars-to-Taurus and Venus-to-Aries.
**Then:** The Mars-to-Taurus placement creates a Taurus conjunction; the Venus-to-Aries placement creates an Aries conjunction. Each newly created conjunction has a directed Step 5 or Step 6 event from each planet's owning source channel. The two triggers remain distinct.

**Expected:** Four directed conjunction awards attributable to these two additional conjunctions, separate from sign and step-8 awards.

**Covers:** BR-10 to BR-11; AS-06.

#### TC-07: Existing conjunction remains

**Given:** Mars at 29° Aries, Jupiter at 15° Aries, and Venus at 5° Taurus.
**When:** Evaluate Mars-to-Taurus placement.
**Then:** The Mars-Jupiter natal Aries conjunction stays in the baseline. The additional Mars-Venus Taurus conjunction contributes its new pair-directed events. Existing Mars-Jupiter events are not copied into the boundary phase just because Mars was evaluated again.

**Covers:** BR-01, BR-11 to BR-12.

#### TC-08: Same-channel sign transition

**Given:** Moon at 29° Cancer; Cancer and Leo belong to Luminaries.
**When:** Evaluate the Moon-to-Leo placement with its same-channel sign option enabled.
**Then:** Luminaries receive an extra Step 3 award; with boundary steps-7/8 also enabled, the Luminaries source channel gets an extra Step 8 award toward Luminaries. Either award is absent when its respective controlling option is off.

**Covers:** BR-08, BR-13 to BR-14; AS-07. **Default:** Same-channel signs on, steps 7–8 off; dependent conjunction option on until the sign option is switched off.

#### TC-09: Same-channel house transition

**Given:** Mars in house 4, within the approved orb before cusp 5; houses 4 and 5 belong to Luminaries.
**When:** Evaluate Mars entering house 5 with its same-channel house option on.
**Then:** Mars source channel receives Step 2 -> Luminaries +1; Luminaries source receives Step 7 -> Mars +1 if boundary steps-7/8 is on.

**Covers:** BR-08 to BR-09, BR-13 to BR-14. **Default:** Same-channel houses on, steps 7–8 off.

#### TC-10: Combined sign and house transition

**Given:** Mars at 29° Aries in house 7, and within the approved cusp orb before cusp 8.
**When:** Boundary scoring evaluates this planet.
**Then:** Its additional full placement is Taurus, house 8; the engine does not add independent full-position placements Taurus/7 and Aries/8. Changed sign facts affect steps 1, 5 and 8, and changed house facts affect steps 2 and 7, with relevant options. Other qualifying planet partners may add further step-5/6 awards.

**Covers:** BR-06 to BR-10. With multiple qualifying cusps, add each distinct house but the secondary Taurus sign only once.

#### TC-11: Optional gates and additive counts

**Given:** A same-channel sign or house jump and the corresponding source step-7/8 eligibility.
**When:** Each boundary suboption is changed independently.
**Then:** An unrelated reception suboption does not change boundary awards. Boundary steps 7–8 default off; same-channel sign, house and conjunction options default on. Disabling same-channel sign also unchecks and disables its dependent conjunction option; re-enabling sign permits the user to enable conjunction again.

**Covers:** BR-13 to BR-15; UC-01 AS-01.

### UC-03: Combine boundaries and receptions (fixtures)

#### TC-12: Boundary creates a reception pair

**Given:** Mercury at 29° Aries (secondary Taurus) and Venus at 10° Gemini. The original Aries/Gemini arrangement fails reciprocal rulership, while Taurus/Gemini meets it.
**When:** Detect receptions including secondary sign configurations.
**Then:** The secondary Taurus/Gemini arrangement qualifies as a boundary-derived pair and appears under `Взаимные рецепции с пограничностью` with its triggering sign. Its exchange must preserve natal positions and follow BR-15/BR-17.

**Covers:** BR-17, BR-19; UC-03 Alt-01.

#### TC-13: Reception swap produces a boundary

**Given:** Venus at 29° Aries and Mars at 5° Taurus, a valid original mutual domicile reception; use otherwise noninterfering houses.
**When:** Independently exchange the two original position objects and evaluate boundaries of the exchanged coordinates.
**Then:** Mars is virtually at 29° Aries with secondary Taurus. Its new Taurus placement may contribute Step 1 (and Step 8 if enabled) in the reception's Step-9 details, marked `(погр)`. These phase-4 points belong to `п`, not `р`.

**Covers:** BR-15, BR-18, BR-20; UC-03 AS-10.

#### TC-14: Pair identity and multiple eligibility

**Given:** Sun at 29° Capricorn (secondary Aquarius), Saturn at 10° Leo. Saturn rules both Capricorn and Aquarius; Sun rules Leo, so the same physical pair qualifies under two sign configurations.
**When:** Compute pair lists, virtual exchanges and extra awards.
**Then:** Count two independently qualifying reception instances and two complete eligible award sets, one from Capricorn/Leo and one from Aquarius/Leo. Keep the original instance in `Взаимные рецепции` and the additional Aquarius/Leo instance in `Взаимные рецепции с пограничностью`; group their Step-9 contributions separately. Both virtual swaps start from the natal positions, even if their received coordinates coincide.

**Covers:** BR-17, BR-19; UC-03 Alt-02.

#### TC-15: Score provenance and formatting

**Given:** One score cell has base 5, boundary bonus 2 (one natal and one post-exchange) and reception bonus 3.
**When:** Both modes are on.
**Then:** Render `5 / 10 (+2п, +3р)` with distinct colors for `п` and `р` at normal font size. If a single additional source is active, use its approved expanded suffix; if no additional score is present, display `5`. Include all phase-4 awards in the `п` subtotal.

**Covers:** FR-10.

#### TC-16: Two natal reception pairs sharing a boundary planet

**Given:** Mercury at 29° Aries in house 2, Mars in Gemini in house 5 and Pluto in Virgo in house 7; secondary Mercury sign is Taurus.
**When:** Independently exchange Mercury/Mars and Mercury/Pluto, then apply the post-exchange boundary phase.
**Then:** Mars receives Mercury's 29° Aries coordinate in the first exchange and additionally qualifies in Taurus; Pluto does the same in the second. Both remain distinct original reception pairs; each qualifying post-exchange boundary event counts toward `п`, with no chained swaps.

**Covers:** BR-15, BR-17 to BR-20; UC-03 AS-10.

#### TC-17: Stationary boundary partner loses an existing conjunction

**Given:** Mercury at 5° Taurus, Venus at 5° Gemini (valid natal reception), stationary Mars at 29° Taurus (secondary Gemini).
**When:** Exchange Mercury/Venus, giving Venus 5° Taurus, then consider Mars's secondary Gemini placement.
**Then:** Venus/Mars conjunction in Taurus contributes reception Step-9 conjunction events; Mars's alternative Gemini placement cannot cancel them. Mars appears in `Пограничности` and is not listed as a reception pair solely because of this conjunction.

**Covers:** BR-18, FR-01, FR-02 and FR-08.

#### TC-18: Stationary boundary creates an additional post-exchange conjunction
**Given:** Mercury 5° Taurus, Venus 5° Gemini (a reception), stationary Mars 29° Aries (secondary Taurus).
**When:** Exchange Mercury/Venus; Venus becomes 5° Taurus and Mars independently also qualifies in Taurus.
**Then:** Count the new Taurus conjunction caused by Mars’s added sign. In particular, the Mars-targeted Step-5/6 award is credited according to the existing source/target channel rule, and any other directed participant award follows the same conjunction rule. Put the generated events in Step 9 marked `(погр)` and in the `п` subtotal; do not classify Mars as a reception pair solely because of the conjunction.
**Covers:** BR-10, BR-18.

### UC-04: Refresh the computed chart and its options (fixtures)

#### TC-19: Reset and URL restoration

**Given:** Both main switches active and an existing cached result.
**When:** User recalculates, clears the form, or restores the same birth data through a URL.
**Then:** Main switches reset to off on recalculation; clearing removes old lists and scores and restores boundary defaults `off/on/on/on`; restored birth data reproduces the same boundary/reception lists while selection remains off.

**Covers:** FR-09; UC-04 AS-12 to AS-13.

## Test implementation handoff

- Use numeric input longitudes, not display-rounded degree-minute-second strings, for every threshold fixture.
- Assert exact award provenance and counts per trigger and phase; compare multisets independently of iteration order.
- Assert baseline-only and reception-only backward compatibility for all 12 existing reception `OptionKey` values, all 12 `BoundaryOptionKey` values, and all 144 ordered `CombinedOptionKey` pairings from [R5].
- Verify cached result selection executes no astronomy, scoring or ranking computation on toggle changes.
- Verify `Пограничности`, original and boundary reception lists are populated during chart calculation; main options do not mutate those lists.
- Add mobile and keyboard accessibility checks for independent boundary settings and help text once approved.
