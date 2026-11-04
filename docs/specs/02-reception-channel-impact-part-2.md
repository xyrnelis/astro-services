# Feature-02: Default Reception Scoring (part 2)

**Status**: Implemented and verified by focused domain and UI tests, full test suite, and production build (2026-11-04).

Continues the **UC-01 Acceptance Scenarios (AS-03)** in [part 1](02-reception-channel-impact.md). This part owns exact option-key `1000` inputs and expected score events for TC-01–TC-04.

## Use Case & Testing

### UC-01: Select reception-adjusted channel results (acceptance scenarios continued)

#### TC-01: Signs change, houses stay the same

**Covers:** BR-02, BR-04, BR-08, BR-13; AS-03.

**Given:** Mars in Libra, house 7 ↔ Chiron in Scorpio, house 7; option key `1000`.
**When:** Evaluate the independent exchange: Mars in Scorpio, house 7; Chiron in Libra, house 7.
**Then:** The complete reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 8 (planets in channel signs): Mars +1 [Mars]
```

Venus channel:

```text
Step 3 (P2 in sign): Venus +1 [Chiron]
Step 8 (planets in channel signs): Venus +1 [Chiron]
```

**Expected:** +4 overall; no extra house or conjunction events.

#### TC-02: Signs and houses both change

**Covers:** BR-02, BR-04–BR-05, BR-07–BR-08; AS-03.

**Given:** Mars in Libra, house 6 ↔ Chiron in Scorpio, house 7; option key `1000`.
**When:** Evaluate the exchange: Mars in Scorpio, house 7; Chiron in Libra, house 6.
**Then:** The complete reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 2 (P1 in house): Venus +1 [Mars]
Step 8 (planets in channel signs): Mars +1 [Mars]
```

Venus channel:

```text
Step 3 (P2 in sign): Venus +1 [Chiron]
Step 4 (P2 in house): Mercury +1 [Chiron]
Step 7 (planets in channel houses): Mars +1 [Mars]
Step 8 (planets in channel signs): Venus +1 [Chiron]
```

Mercury channel:

```text
Step 7 (planets in channel houses): Venus +1 [Chiron]
```

**Expected:** +8 overall; four sign and four house events.

#### TC-03: One new conjunction

**Covers:** BR-06, BR-07, BR-10, BR-13; AS-03.

**Given:** Mars in Libra, house 7 ↔ Chiron in Scorpio, house 7; Jupiter in Scorpio, house 7; option key `1000`. Initially Chiron/Jupiter share a sign.
**When:** Exchange Mars and Chiron; Jupiter stays fixed; Mars/Jupiter now share a sign.
**Then:** The complete reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 5 (conjunction with P1): Jupiter +1 [Mars; Jupiter]
Step 8 (planets in channel signs): Mars +1 [Mars]
```

Venus channel:

```text
Step 3 (P2 in sign): Venus +1 [Chiron]
Step 8 (planets in channel signs): Venus +1 [Chiron]
```

Jupiter channel:

```text
Step 5 (conjunction with P1): Mars +1 [Jupiter; Mars]
```

**Expected:** +6 overall; exactly two new conjunction events; Jupiter's unchanged house adds no step-7 event.

#### TC-04: Two new conjunctions

**Covers:** BR-06, BR-07, BR-10, BR-13; AS-03.

**Given:** Mars in Libra, house 7 ↔ Chiron in Scorpio, house 7; Jupiter in Scorpio, house 7; Saturn in Libra, house 7; option key `1000`. Existing same-sign pairs: Mars/Saturn and Chiron/Jupiter.
**When:** Exchange Mars and Chiron; Jupiter and Saturn remain fixed; new pairs are Mars/Jupiter and Chiron/Saturn.
**Then:** The complete reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 5 (conjunction with P1): Jupiter +1 [Mars; Jupiter]
Step 8 (planets in channel signs): Mars +1 [Mars]
```

Venus channel:

```text
Step 3 (P2 in sign): Venus +1 [Chiron]
Step 6 (conjunction with P2): Saturn +1 [Chiron; Saturn]
Step 8 (planets in channel signs): Venus +1 [Chiron]
```

Jupiter channel:

```text
Step 5 (conjunction with P1): Mars +1 [Jupiter; Mars]
```

Saturn channel:

```text
Step 5 (conjunction with P1): Venus +1 [Saturn; Chiron]
```

**Expected:** +8 overall; exactly four new conjunction events; original conjunction awards remain in `base`.

## Test implementation handoff

For TC-01–TC-08 across this part and [part 3](02-reception-channel-impact-part-3.md), assign stable positions to all other natal objects to avoid unintended conjunctions. Compare the full **pair-scoped score-event multiset** (source, step, target, subject, conjunction partner if relevant, and pair ID); validate score totals separately. Add focused overlap, option-selection, lifecycle, and UI tests for AS-04–AS-08 in part 1, plus the static-site build check in AS-10.
