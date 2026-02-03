# MoeMath - Design Philosophy & Implementation Guide

> A comprehensive document detailing the design choices, pedagogical approach, and implementation patterns used in the MoeMath learning modules. This guide (using simplify fraction module) is intended to help future developers replicate or adapt this approach for other mathematical topics.

---

## Table of Contents

1. [Core Design Philosophy](#1-core-design-philosophy)
2. [Pedagogical Framework](#2-pedagogical-framework)
3. [Visual Design Principles](#3-visual-design-principles)
4. [Interaction Design](#4-interaction-design)
5. [Cognitive Load Management](#5-cognitive-load-management)
6. [Feedback System Design](#6-feedback-system-design)
7. [Progressive Disclosure](#7-progressive-disclosure)
8. [Technical Implementation Patterns](#8-technical-implementation-patterns)
9. [Accessibility & UX Considerations](#9-accessibility--ux-considerations)
10. [Replication Guidelines for Other Topics](#10-replication-guidelines-for-other-topics)

---

## 1. Core Design Philosophy

### 1.1 "Direct to Action" Principle

The most critical design decision is getting students **solving problems immediately**. The interface prioritizes:

- **Problem-first layout**: The fraction problem (`Simplify: 10/15`) is the FIRST thing visible
- **Above-the-fold action**: All essential elements for solving are visible without scrolling
- **No preliminary tutorials**: Learning happens BY doing, not before doing
- **Immediate engagement**: A problem is generated automatically on page load

```javascript
// On page load, immediately present a problem
document.addEventListener('DOMContentLoaded', function() {
    generateProblem();  // First action: give them something to solve
    setupEventListeners();
});
```

### 1.2 Minimalist Complexity

The design deliberately avoids overwhelming students:

| What's Included | What's Excluded |
|-----------------|-----------------|
| One problem at a time (primary view) | Multiple simultaneous problems competing for attention |
| Three clear steps | Complex multi-step algorithms |
| Visual + numeric representation | Abstract mathematical notation only |
| Simple yes/no feedback | Grading percentages or scores |
| Hint button (optional) | Forced tutorials or walkthroughs |

### 1.3 Dual Representation Philosophy

Every problem is presented in TWO complementary ways:

1. **Symbolic/Numeric**: Traditional fraction notation (`10/15`)
2. **Visual/Concrete**: Grid of clickable squares showing shaded portions

This addresses different learning styles and reinforces that fractions represent **real quantities**, not just abstract numbers.

---

## 2. Pedagogical Framework

### 2.1 The "LOOK → FIND → DIVIDE" Pattern

The module reduces simplifying fractions to a memorable 3-step process:

```
Step 1: LOOK   → Examine both numerator and denominator
Step 2: FIND   → Identify a common factor
Step 3: DIVIDE → Divide both by that factor
```

This is implemented as visual "step boxes" that persist during problem-solving:

```html
<div class="steps-guide">
    <div class="step-box">Step 1: Look at the fraction</div>
    <div class="step-box">Step 2: Find common factor</div>
    <div class="step-box">Step 3: Divide by factor</div>
</div>
```

### 2.2 Scaffolded Learning Approach

The learning progresses through layers:

| Layer | Implementation |
|-------|----------------|
| **Core Activity** | Solve the problem through clicking + typing |
| **Visual Reinforcement** | See "before and after" grids side-by-side |
| **On-Demand Help** | Hint button reveals common factor |
| **Deep Explanation** | Collapsible "Tips & Steps" section |

Students never wait; they can always try. Help is available but never forced.

### 2.3 Problem Generation Strategy

Problems are carefully curated, not purely random:

```javascript
const simpleFractions = [
    {n: 1, d: 2}, {n: 1, d: 3}, {n: 2, d: 3}, {n: 1, d: 4},
    {n: 3, d: 4}, {n: 2, d: 5}, {n: 3, d: 5}, {n: 4, d: 5},
    // ... more base fractions
];

// Multiply by a factor (2-6) to create the unsimplified version
const factor = Math.floor(Math.random() * 5) + 2;
```

**Key Decisions:**
- Start with fractions that reduce to "friendly" small numbers
- Factors are 2-6 (manageable mental math)
- Denominators capped at 24 (keeps visual grids reasonable)
- All problems are GUARANTEED to be reducible (no frustrating "already simplified" cases)

### 2.4 Concrete-Representational-Abstract (CRA) Model

This is a well-established math education framework implemented here:

| Stage | Implementation |
|-------|----------------|
| **Concrete** | Clickable grid squares that students manipulate |
| **Representational** | Side-by-side visual comparison of original vs. simplified |
| **Abstract** | Numeric input of the final answer (numerator/denominator) |

---

## 3. Visual Design Principles

### 3.1 Visual Hierarchy Through Size & Weight

The problem is visually dominant:

```css
.fraction-problem {
    font-size: 3rem;      /* Large, commanding presence */
    font-weight: bold;
    padding: 25px 40px;
}
```

Supporting elements are progressively smaller:
- Step boxes: `1.1rem` font, secondary colors
- Tips section: Collapsed by default, normal font weight
- Feedback: Prominent but after the action area

### 3.2 Color Psychology

| Element | Color | Psychological Purpose |
|---------|-------|----------------------|
| Main accent | `#3498db` (blue) | Trust, clarity, calmness |
| Success | `#2ecc71` (green) | Achievement, "go" signal |
| Error | `#e74c3c` (red) | Warning, but not aggressive |
| Filled squares | `#f59e0b` (warm orange) | Energy, attention, "active" state |
| Hints | `#fff3cd` (soft yellow) | Caution, "pay attention" |
| Background | `#f4f7f6` (neutral gray) | Reduces eye strain, focuses attention on content |

### 3.3 The "Breathable" Layout

Generous spacing prevents cognitive crowding:

```css
.problem-container {
    padding: 25px;
    margin-bottom: 30px;
}

.answer-section {
    margin: 25px 0;
    padding: 20px;
}

button {
    padding: 14px 30px;
    margin: 0 10px;
}
```

**Principle**: Every interactive element has "room to breathe" — visually and functionally.

### 3.4 Visual Animation Philosophy

Animations serve learning, not decoration:

```css
/* Subtle floating animation draws eye without distracting */
@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
}

/* Cross-out animation teaches cancellation visually */
@keyframes crossOut {
    0% { width: 0%; opacity: 0; }
    100% { width: 100%; opacity: 1; }
}
```

**Rules for animation:**
1. Duration < 1 second for micro-interactions
2. No infinite loops (except subtle idle states)
3. Animations reinforce mathematical concepts (e.g., "cancellation" shown as cross-out)
4. Hover effects signal interactivity without being flashy

---

## 4. Interaction Design

### 4.1 "Click to Learn" Grid System

The grid of squares is the heart of the interaction:

```javascript
function createGrid(total, shadedCount, interactive, onToggle) {
    for (let i = 0; i < total; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        
        if (interactive) {
            cell.addEventListener("click", () => {
                cell.classList.toggle("active");
                if (onToggle) onToggle();
            });
        }
        grid.appendChild(cell);
    }
}
```

**Design Decisions:**
- **Left grid (original)**: Fixed, non-interactive → Shows "the problem"
- **Right grid (simplified)**: Interactive, clickable → Student's workspace
- **Toggle behavior**: Click to fill, click again to unfill → Low commitment, easy experimentation
- **Visual feedback on hover**: `transform: scale(1.05)` → Confirms interactivity

### 4.2 Multi-Modal Input

Students complete the answer in TWO ways:

1. **Visual**: Clicking squares
2. **Numeric**: Typing in input boxes

Both must match for correctness — this validates understanding, not lucky guessing.

```javascript
const visualOk = (activeSquares === userN);
const matchesReduced = (userN === reducedN && userD === reducedD);

if (equivalent && simplest && matchesReduced && visualOk) {
    // Only fully correct when ALL representations align
}
```

### 4.3 Keyboard Support

Efficiency for repeated practice:

```javascript
document.getElementById('num-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});
```

Students can:
- Tab between fields
- Press Enter to check
- Immediately retry without mouse

---

## 5. Cognitive Load Management

### 5.1 Working Memory Limits

The design respects the ~4 chunk limit of working memory:

| Chunk 1 | Chunk 2 | Chunk 3 | Chunk 4 |
|---------|---------|---------|---------|
| Original fraction | Simplified fraction (goal) | Common factor | Current input |

No more than 4 pieces of information required simultaneously.

### 5.2 Offloading to the Interface

Instead of requiring students to hold information in memory:

- **The original fraction** stays visible (no need to remember it)
- **The 3 steps** are always visible as reference
- **Visual grids** show quantities (no mental calculation of "how many squares")
- **Labels update dynamically** to show progress

### 5.3 Problem Scope Limiting

```javascript
// Cap total squares so it stays clickable
if (d > 24) return makeReducibleFraction(difficulty);
```

Large denominators would:
- Make grids unwieldy
- Increase cognitive load
- Slow down interaction

By capping at 24, we keep every problem "holdable" in the mind.

---

## 6. Feedback System Design

### 6.1 Immediate Feedback Categories

```javascript
if (equivalent && simplest && matchesReduced && visualOk) {
    qfb.textContent = "✅ Correct";
    qfb.style.color = "#27ae60";
} else {
    if (!equivalent) qfb.textContent = "Not equal";
    else if (!simplest) qfb.textContent = "Not simplest";
    else if (!visualOk) qfb.textContent = "Shading does not match";
    else qfb.textContent = "Try again";
}
```

**Feedback Hierarchy:**
1. **Correct** — Celebration, move on
2. **Not equal** — Fundamental error, need to reconsider
3. **Not simplest** — Right direction, keep going
4. **Shading mismatch** — Understanding disconnect, check visual
5. **Generic "try again"** — Minimal nudge, let them discover

### 6.2 Constructive Error Messages

Incorrect feedback includes scaffolded hints:

```javascript
feedback.innerHTML = `Not quite. You entered ${userNum}/${userDen}, but the correct simplified fraction is ${currentProblem.simplifiedNumerator}/${currentProblem.simplifiedDenominator}.`;

// Give a hint
if (userNum === currentProblem.simplifiedNumerator) {
    feedback.innerHTML += `<br>The numerator is correct, but check the denominator.`;
} else if (userDen === currentProblem.simplifiedDenominator) {
    feedback.innerHTML += `<br>The denominator is correct, but check the numerator.`;
} else {
    feedback.innerHTML += `<br>Try finding a common factor of ${currentProblem.numerator} and ${currentProblem.denominator}.`;
}
```

**Philosophy**: Never just say "wrong." Always give a next step.

### 6.3 Visual Feedback Styling

Different colors AND different shapes for feedback:

```css
.correct {
    background: linear-gradient(to right, #d5edda, #c3e6cb);
    border: 2px solid #b1dfbb;
    animation: pulse 1.5s infinite;  /* Celebratory pulse */
}

.incorrect {
    background: linear-gradient(to right, #f8d7da, #f5c6cb);
    border: 2px solid #f1b0b7;
}

.hint {
    background: linear-gradient(to right, #fff3cd, #ffeaa7);
    border: 2px solid #ffdf7e;
}
```

Color-blind accessible: shapes (borders) and text content distinguish states, not color alone.

---

## 7. Progressive Disclosure

### 7.1 The Collapsible Tips Section

Advanced content is hidden by default:

```html
<details>
    <summary>📚 Simplification Tips & Steps</summary>
    <div class="tips-content">
        <!-- Deep content here -->
    </div>
</details>
```

**Why `<details>` element:**
- Native, accessible collapse/expand
- No JavaScript required
- Clear affordance (triangle indicator)
- State persists across interactions

### 7.2 Layered Help System

| Level | Trigger | Content |
|-------|---------|---------|
| 0 | Always visible | 3 step boxes |
| 1 | Click "Hint" button | Common factor revealed |
| 2 | Click "Show Answer" | Full solution with explanation |
| 3 | Open "Tips & Steps" | Examples, divisibility rules, etc. |

Students choose their level of support. No one is stuck, no one is bored.

### 7.3 Example Design in Tips

Examples use the same visual language as problems:

```html
<div class="fraction-example">
    <div class="fraction">
        <div class="numerator">6</div>
        <div class="denominator">10</div>
    </div>
    <span>→</span>
    <div class="fraction">
        <div class="numerator">3 × 
            <div class="cross-out-container">
                <span class="cross-out-number">2</span>
                <div class="cross-out"></div>  <!-- Animated line -->
            </div>
        </div>
        <div class="denominator">5 × 
            <div class="cross-out-container">
                <span class="cross-out-number">2</span>
                <div class="cross-out"></div>
            </div>
        </div>
    </div>
    <span>→</span>
    <div class="fraction simplify-animation">
        <div class="numerator">3</div>
        <div class="denominator">5</div>
    </div>
</div>
```

The "cross-out" animation:
- Shows cancellation visually
- Matches written paper technique
- Reinforces the mental model of "removing" common factors

---

## 8. Technical Implementation Patterns

### 8.1 State Management

Single source of truth for the current problem:

```javascript
let currentProblem = {
    numerator: 10,
    denominator: 15,
    simplifiedNumerator: 2,
    simplifiedDenominator: 3,
    gcd: 5
};
```

All display and validation functions reference this single object.

### 8.2 Separation of Concerns

The codebase has two distinct implementations:

1. **`index.html`** (standalone version):
   - Single-file, self-contained
   - Inline CSS and JavaScript
   - Focus on single-problem practice

2. **`app.js` + `syles.css`** (modular version):
   - Multiple problems per page
   - Batch checking
   - More structured code

**Design Insight**: The standalone version is better for learning/teaching the concept; the modular version is better for assessment/practice.

### 8.3 Grid Layout Algorithm

Smart grid proportions:

```javascript
function chooseGridCols(total) {
    // Make the grid look like a neat rectangle.
    // Prefer factors; otherwise choose something close to sqrt(total).
    let best = 1;
    for (let c = 1; c <= total; c++) {
        if (total % c === 0) {
            const r = total / c;
            if (Math.abs(c - r) < Math.abs(best - (total / best))) best = c;
        }
    }
    // Keep it from getting too skinny
    if (best > 10) best = 10;
    return best;
}
```

This ensures grids are always "square-ish" — never awkward 1×12 strips.

### 8.4 Pure Function Utilities

Reusable, testable functions:

```javascript
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function reduceFraction(n, d) {
    const g = gcd(n, d);
    return { n: n / g, d: d / g, g };
}

function parseIntSafe(text) {
    const t = String(text).trim();
    if (!/^\d+$/.test(t)) return null;
    return parseInt(t, 10);
}
```

These can be reused across math topics.

---

## 9. Accessibility & UX Considerations

### 9.1 Input Guardrails

```html
<input type="number" min="1" max="99" placeholder="Num">
```

- `type="number"` triggers numeric keyboard on mobile
- `min/max` prevents obviously wrong values
- `placeholder` provides hints without cluttering label

### 9.2 Focus States

```css
.num-input:focus, .den-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}
```

Clear visual indication of focus without disabling default outlines entirely.

### 9.3 Responsive Design

```css
@media (max-width: 768px) {
    .visual-area {
        flex-direction: column;
    }
    
    .equals-sign {
        transform: rotate(90deg);  /* Equals sign rotates with layout! */
    }
    
    .controls {
        flex-direction: column;
    }
}
```

On mobile:
- Grids stack vertically
- Buttons become full-width
- The equals sign rotates to show vertical relationship

### 9.4 Touch-Friendly Targets

```css
.cell {
    width: 20px;
    height: 20px;
    border: 2px solid #333;
}
```

At 20px, cells are at minimum touchable size. For younger students, consider 32px+.

---

## 10. Replication Guidelines for Other Topics

### 10.1 Pattern Extraction

When building for a new topic (e.g., adding fractions, decimals, percentages):

| Element | This Module | Your Topic |
|---------|-------------|------------|
| **Core Action** | Simplify to lowest terms | [Define the one action] |
| **Visual Representation** | Shaded grids | [Pie charts? Number lines? Area models?] |
| **Steps** | LOOK → FIND → DIVIDE | [3-5 memorable steps] |
| **Input Type** | Two numbers (num/den) | [What must they enter?] |
| **Validation** | Match reduced form + visual | [How do you know it's correct?] |

### 10.2 Checklist for New Modules

Before launch, verify:

- [ ] Problem appears on load (no click required)
- [ ] All essential actions above the fold
- [ ] Visual representation matches numeric representation
- [ ] Feedback is immediate and constructive
- [ ] Help is available but optional
- [ ] Works on mobile without scrolling to solve
- [ ] Incorrect answers give hints, not just "wrong"
- [ ] Color alone does not convey meaning (accessibility)
- [ ] Practice can continue indefinitely (generated, not fixed problems)

### 10.3 Visual Balance Guidelines

**Recommended Proportions:**

```
+------------------------------------------+
|              Title (5%)                  |
+------------------------------------------+
|                                          |
|         Problem Display (25%)            |
|                                          |
+------------------------------------------+
|                                          |
|     Visual Representation (30%)          |
|                                          |
+------------------------------------------+
|         Answer Input (20%)               |
+------------------------------------------+
|   Buttons / Controls (10%)               |
+------------------------------------------+
|         Feedback Area (10%)              |
+------------------------------------------+
```

Keep tips/help BELOW the main interaction area.

### 10.4 Avoiding Common Mistakes

❌ **Don't:**
- Show scores prominently (creates anxiety)
- Require login to practice (friction)
- Lock content behind "complete tutorial first"
- Use complex math notation (prefer `10/15` over `\frac{10}{15}`)
- Play sounds on correct/incorrect (annoying in classrooms)

✅ **Do:**
- Generate problems that are always solvable
- Let students attempt before explaining
- Provide visual confirmation of every action
- Save complex explanations for expandable sections
- Test with actual students in your target age group

---

## Conclusion

The Simplifying Fractions module succeeds because it:

1. **Respects students' time** — Problems appear instantly
2. **Provides multiple representations** — Visual AND numeric
3. **Follows the 3-step rule** — Never more than 3 steps visible at once
4. **Makes help optional** — Available but not required
5. **Uses progressive disclosure** — Complexity is layered, not dumped
6. **Gives constructive feedback** — Always says what to try next
7. **Maintains visual clarity** — Generous whitespace, clear hierarchy
8. **Works on any device** — Responsive from phone to desktop

Future developers should use this as a template: start with the problem, add visual scaffolding, layer in help, and always prioritize **doing over reading**.

---

*Document Version: 1.0*  
*Last Updated: February 2026*  
*Purpose: Guide for replicating pedagogical UI patterns across math learning modules*
