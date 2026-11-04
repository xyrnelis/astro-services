# Feature-02: Option-Dependent Reception Scoring (part 3)

**Status**: Implemented and verified by focused domain and UI tests, full test suite, and production build (2026-11-04).

Continues **UC-01 Acceptance Scenarios (AS-03)** from [part 1](02-reception-channel-impact.md). This part owns the exact option-dependent inputs and events for TC-05–TC-08; the shared test handoff is in [part 2](02-reception-channel-impact-part-2.md).

## Use Case & Testing

### UC-01: Select reception-adjusted channel results (acceptance scenarios continued)

#### TC-05: Identical house after same-channel reception

**Covers:** BR-05, BR-07, BR-14–BR-15; UC-01 Alt-02–Alt-03; AS-03.

**Given:** Mars in Aries, house 7 ↔ Pluto in Scorpio, house 7; option 1 on, option 2 on, options 3–4 off.
**When:** Exchange Mars and Pluto, producing Mars in Scorpio, house 7 and Pluto in Aries, house 7.
**Then:** The complete house-related reception event multiset is:

Mars channel:

```text
Step 2 (P1 in house): Venus +1 [Mars]
Step 4 (P2 in house): Venus +1 [Pluto]
```

Venus channel:

```text
Step 7 (planets in channel houses): Mars +1 [Mars]
Step 7 (planets in channel houses): Mars +1 [Pluto]
```

**Expected:** +4 house events; turning option 1 off gives +2, and turning option 2 off gives +0 (house events only).

#### TC-06: Different houses in one channel

**Covers:** BR-05, BR-07, BR-14–BR-15; UC-01 Alt-02–Alt-03; AS-03.

**Given:** Mars in Aries, house 4 ↔ Pluto in Scorpio, house 5; option 1 on, option 2 on, options 3–4 off.
**When:** Exchange Mars and Pluto, producing Mars in Scorpio, house 5 and Pluto in Aries, house 4.
**Then:** The complete house-related reception event multiset is:

Mars channel:

```text
Step 2 (P1 in house): Luminaries +1 [Mars]
Step 4 (P2 in house): Luminaries +1 [Pluto]
```

Luminaries channel:

```text
Step 7 (planets in channel houses): Mars +1 [Mars]
Step 7 (planets in channel houses): Mars +1 [Pluto]
```

**Expected:** +4 house events; turning option 1 off gives +2, and turning option 2 off gives +0 (house events only).

#### TC-07: Different signs in one channel

**Covers:** BR-04, BR-08, BR-14, BR-16; UC-01 Alt-02, Alt-04; AS-03.

**Given:** Mars in Aries, house 7 ↔ Pluto in Scorpio, house 7; options 1 and 3 on, options 2 and 4 off.
**When:** Exchange Mars and Pluto, producing Mars in Scorpio, house 7 and Pluto in Aries, house 7.
**Then:** The complete sign-related reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 3 (P2 in sign): Mars +1 [Pluto]
Step 8 (planets in channel signs): Mars +1 [Mars]
Step 8 (planets in channel signs): Mars +1 [Pluto]
```

**Expected:** +4 sign events; option 1 off gives +2, and option 3 off gives +0 (sign events only).

#### TC-08: New conjunctions after same-channel sign exchange

**Covers:** BR-04, BR-06, BR-08, BR-14, BR-16–BR-17; UC-01 Alt-04–Alt-06; AS-03.

**Given:** Pluto in Aries, house 7 with Jupiter in Aries, house 7 ↔ Mars in Scorpio, house 7 with Venus in Scorpio, house 7; options 1, 3, and 4 on, option 2 off.
**When:** Exchange Pluto and Mars: Pluto joins Venus in Scorpio, Mars joins Jupiter in Aries, and houses remain unchanged.
**Then:** The complete reception event multiset is:

Mars channel:

```text
Step 1 (P1 in sign): Mars +1 [Mars]
Step 3 (P2 in sign): Mars +1 [Pluto]
Step 5 (conjunction with P1): Jupiter +1 [Mars; Jupiter]
Step 6 (conjunction with P2): Venus +1 [Pluto; Venus]
Step 8 (planets in channel signs): Mars +1 [Mars]
Step 8 (planets in channel signs): Mars +1 [Pluto]
```

Venus channel:

```text
Step 5 (conjunction with P1): Mars +1 [Venus; Pluto]
```

Jupiter channel:

```text
Step 5 (conjunction with P1): Mars +1 [Jupiter; Mars]
```

**Expected:** +8 total (+4 sign events, +4 conjunction events). Switching option 4 off yields +4. Switching option 3 off must also reset option 4 to off (FR-04).
