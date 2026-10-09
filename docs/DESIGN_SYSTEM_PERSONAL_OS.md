# Personal OS — Visual Design System

Version: 1.0  
Target: Personal OS web application  
Reference: supplied light fintech/property dashboard screenshot  
Scope: visual redesign only; preserve current business logic, routing, data model and backend.

> Important: the original reference image does not expose its source CSS, so its literal production values cannot be recovered. The tokens below are a **normalized, fixed target design system** derived from the screenshot. Treat these values as the canonical design code for Personal OS.

---

## 1. Design direction

Personal OS should feel like a calm premium productivity/finance dashboard:

- light warm-gray application background;
- white modular cards;
- restrained desaturated green as the primary accent;
- black/graphite typography;
- soft, almost invisible borders and shadows;
- generous negative space;
- compact left navigation rail;
- dense information presented through clean cards rather than large tables;
- rounded geometry throughout;
- minimal iconography;
- no visual noise, glossy gradients, neon colors, heavy shadows or excessive separators.

Keywords: **calm, premium, quiet, precise, modern, compact, soft, structured, trustworthy**.

The UI must not imitate the reference content. It should reuse its **visual language** while preserving Personal OS information architecture and functions.

---

## 2. Canonical color tokens

### Base surfaces

| Token | Hex | Usage |
|---|---:|---|
| `--bg-app` | `#EAE9E5` | Main page background |
| `--bg-shell` | `#EFEEEA` | Optional outer shell / section background |
| `--surface` | `#FFFFFF` | Main cards, panels, modal surfaces |
| `--surface-soft` | `#F7F6F3` | Secondary cards, input backgrounds, muted blocks |
| `--surface-hover` | `#F2F1ED` | Hover on neutral cards/rows |
| `--surface-selected` | `#E9EFEB` | Selected neutral/green-tinted state |

### Text

| Token | Hex | Usage |
|---|---:|---|
| `--text-primary` | `#181A18` | Main headings, values, important text |
| `--text-secondary` | `#6F746F` | Supporting text |
| `--text-tertiary` | `#A2A6A1` | Hints, metadata, quiet labels |
| `--text-on-accent` | `#FFFFFF` | Text on dark green surfaces |

### Accent green

| Token | Hex | Usage |
|---|---:|---|
| `--accent-500` | `#738D80` | Primary accent, key card, active chart area |
| `--accent-600` | `#637E70` | Hover / stronger accent |
| `--accent-700` | `#536D60` | Pressed / dark accent |
| `--accent-100` | `#E7EEE9` | Accent tint backgrounds |
| `--accent-050` | `#F1F5F2` | Very light green tint |

### Neutral dark

| Token | Hex | Usage |
|---|---:|---|
| `--ink` | `#171817` | Active nav circle, dark icon buttons |
| `--ink-hover` | `#262826` | Hover dark control |

### Borders

| Token | Hex | Usage |
|---|---:|---|
| `--border-soft` | `#E7E5E1` | Card/input border when required |
| `--border-strong` | `#D9D7D2` | Selected/structural border |

### Semantic colors

Semantic colors must be muted and never dominate the interface.

| Token | Hex | Usage |
|---|---:|---|
| `--success` | `#6F8D7B` | Success / healthy |
| `--success-bg` | `#EDF3EF` | Success chip background |
| `--warning` | `#A18D57` | Warning |
| `--warning-bg` | `#F5F1E6` | Warning chip background |
| `--danger` | `#A66D68` | Error / overdue |
| `--danger-bg` | `#F7ECEA` | Error chip background |
| `--info` | `#71828B` | Informational state |
| `--info-bg` | `#EDF1F3` | Informational chip background |

Avoid bright red/yellow/blue except where required for accessibility or existing semantic meaning.

---

## 3. CSS variables

Use these as the canonical foundation. Map them to Tailwind/shadcn tokens where appropriate rather than duplicating arbitrary colors across components.

```css
:root {
  --bg-app: #eae9e5;
  --bg-shell: #efeeea;
  --surface: #ffffff;
  --surface-soft: #f7f6f3;
  --surface-hover: #f2f1ed;
  --surface-selected: #e9efeb;

  --text-primary: #181a18;
  --text-secondary: #6f746f;
  --text-tertiary: #a2a6a1;
  --text-on-accent: #ffffff;

  --accent-050: #f1f5f2;
  --accent-100: #e7eee9;
  --accent-500: #738d80;
  --accent-600: #637e70;
  --accent-700: #536d60;

  --ink: #171817;
  --ink-hover: #262826;

  --border-soft: #e7e5e1;
  --border-strong: #d9d7d2;

  --success: #6f8d7b;
  --success-bg: #edf3ef;
  --warning: #a18d57;
  --warning-bg: #f5f1e6;
  --danger: #a66d68;
  --danger-bg: #f7ecea;
  --info: #71828b;
  --info-bg: #edf1f3;
}
```

---

## 4. Typography

Preferred font: **Inter**.  
Fallback: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

Do not use decorative fonts.

### Type scale

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Page title | 28 px | 34 px | 600 |
| Section title | 18 px | 24 px | 600 |
| Card title | 14 px | 20 px | 600 |
| KPI large | 28–32 px | 34–38 px | 600–700 |
| KPI medium | 20–24 px | 26–30 px | 600 |
| Body | 14 px | 20 px | 400–500 |
| Small | 12 px | 17 px | 400–500 |
| Micro/meta | 11 px | 15 px | 500 |

Rules:
- prefer medium/semibold over extra-bold;
- use weight and whitespace for hierarchy before using color;
- never use all caps for normal headings;
- metadata may use slightly increased letter spacing: `0.01em–0.02em`;
- avoid oversized hero typography inside the application.

---

## 5. Spacing system

Base unit: **4 px**.

Canonical spacing:
- `4` — micro gap;
- `8` — icon/text, tight elements;
- `12` — card-internal small gap;
- `16` — default card padding / component gap;
- `20` — medium card padding;
- `24` — major gap;
- `28` — desktop page inset;
- `32` — large section separation;
- `40` — rare major separation.

Default desktop grid gap: **12 px** or **16 px**.

Avoid 24–32 px gaps between every component; the reference is airy but still compact.

---

## 6. Radius and geometry

| Element | Radius |
|---|---:|
| Main app shell | 20 px |
| Large card | 14 px |
| Standard card | 12 px |
| Input/search | 18–22 px or pill when compact |
| Button | 10–12 px |
| Chip/tag | 999 px |
| Circular icon button | 999 px |
| Sidebar rail | 20–24 px |

Use rounded rectangles, not exaggerated bubbly UI.

---

## 7. Shadows and borders

Cards should feel separated mostly by surface contrast, not shadow.

### Standard card

```css
border: 1px solid rgba(24, 26, 24, 0.035);
box-shadow:
  0 1px 2px rgba(24, 26, 24, 0.025),
  0 8px 24px rgba(24, 26, 24, 0.025);
```

### Floating/overlay card

```css
box-shadow:
  0 8px 24px rgba(24, 26, 24, 0.08),
  0 2px 6px rgba(24, 26, 24, 0.04);
```

Do not use strong black shadows.

---

## 8. Application shell

### Desktop

- app background: `--bg-app`;
- page padding: `20–28 px`;
- left navigation: narrow vertical rail, approximately `56–64 px` wide;
- content begins after `16–20 px` gap from rail;
- content should feel like a single calm workspace, not a collection of unrelated pages;
- top header height approximately `64–72 px`;
- content grid uses 12-column logic or CSS grid with modular card spans.

### Left navigation

Reference language:
- white rail;
- vertically centered main icons;
- active item = dark graphite circular/rounded button with white icon;
- inactive icons = muted dark gray without large backgrounds;
- settings/logout at bottom;
- tooltips on icon hover;
- no permanent text labels on wide desktop unless necessary for usability.

Recommended dimensions:
- rail width: `60 px`;
- icon button: `36–40 px`;
- icon size: `17–19 px`;
- item gap: `8–10 px`.

If the current app's labeled sidebar is materially better for navigation, keep a compact labeled variant; do not sacrifice usability just to imitate the screenshot.

---

## 9. Header

Header should be quiet and functional.

Left:
- page greeting/title;
- small supporting line if useful.

Right:
- search field;
- compact icon actions;
- future agent/notifications can live here.

Search:
- white or soft surface;
- height `38–42 px`;
- pill/rounded shape;
- minimal border;
- search icon can be placed in a dark circular submit/action button similar to the reference.

Do not create a large marketing-style top navigation.

---

## 10. Cards

Cards are the primary composition primitive.

### Standard card anatomy

1. optional eyebrow / label;
2. title;
3. primary value or content;
4. secondary metadata;
5. optional chart/status/action.

Default:
- white background;
- radius `12–14 px`;
- padding `16–20 px`;
- no visible border unless necessary;
- quiet shadow;
- title in `14 px / 600`;
- metadata in `11–12 px` secondary color.

### Accent card

Use sparingly, ideally one prominent card in a group.

```css
background: #738d80;
color: #ffffff;
```

Optional subtle tonal variation is allowed, but no glossy gradient.

Use for:
- key daily progress;
- main status/metric;
- one primary summary card.

Do not make every card green.

---

## 11. Dashboard composition

The Dashboard should eventually behave as the operational home screen, but this redesign phase must **not implement new business logic**.

Visual hierarchy to prepare for:

### Tier 1 — Today / daily focus

Reserve the strongest visual priority for the future `Сегодня` block (GitHub issue #14):
- today's tasks;
- processes;
- meetings;
- reminders;
- progress of the day;
- future “Завершить день”.

If the block does not yet exist in current code, do not fake data or implement its logic during pure redesign. Build reusable card/list/progress components that can support it later.

### Tier 2 — Current operating state

Examples:
- active projects;
- project health;
- deadlines;
- overdue work;
- weekly Fact / activity.

### Tier 3 — Analytics

Charts and trends should be lower priority than today's work and current project state.

---

## 12. KPI cards

KPI cards should be compact, similar in proportion to the reference.

Recommended:
- height `84–104 px`;
- label `11–12 px`;
- main number `22–28 px`, semibold;
- optional small trend indicator;
- icon in `32–36 px` tinted circular background;
- minimal sparkline allowed.

No giant dashboard numbers occupying half the viewport.

---

## 13. Tables and lists

Personal OS contains operational records, so tables must remain usable.

Do not turn every table row into an oversized card.

### Table container
- white card;
- radius `12–14 px`;
- optional toolbar in the card header;
- horizontal separators `#EEEDEA` or none when row spacing is sufficient.

### Row
- desktop height: `44–52 px`;
- hover: `--surface-hover`;
- selected: `--surface-selected`;
- primary cell `13–14 px`;
- metadata `11–12 px`.

### Filters
- compact controls;
- soft-gray or white surface;
- pill/chip style for active filters;
- avoid heavy select borders.

---

## 14. Status chips

Height: `24–28 px`.  
Padding: `8–10 px` horizontal.  
Radius: pill.

Use tinted backgrounds and muted text.

Examples:
- healthy / done → green tint;
- waiting / caution → warm sand tint;
- blocked / overdue → muted rose tint;
- neutral → soft gray.

Avoid saturated traffic-light colors.

---

## 15. Buttons

### Primary
- dark graphite or accent green;
- white text;
- height `36–40 px`;
- radius `10–12 px`;
- semibold 13–14 px.

### Secondary
- white/soft background;
- subtle border;
- primary text.

### Ghost
- transparent;
- hover soft gray.

### Icon buttons
- `34–40 px` square/circle;
- dark active variant mirrors the reference.

Do not use large CTA buttons unless the workflow genuinely requires them.

---

## 16. Inputs

- height `38–42 px`;
- white/soft background;
- radius `10–12 px` or pill for search;
- border `--border-soft` at most;
- focus ring = subtle green halo, not bright browser blue.

```css
box-shadow: 0 0 0 3px rgba(115, 141, 128, 0.15);
```

---

## 17. Charts

Charts must match the calm dashboard aesthetic.

Rules:
- thin strokes: `1.5–2 px`;
- primary line: `#738D80` or `#59675F`;
- secondary line: `#B8BFBA`;
- grid: very faint `#ECEAE6`;
- axes labels: `11 px`, `--text-tertiary`;
- avoid strong fills;
- optional area fill opacity `0.06–0.12`;
- no rainbow series unless semantics absolutely demand it;
- tooltips use white floating cards with soft shadow.

Recharts should use shared design tokens, not one-off colors.

---

## 18. Icons

Use the existing Lucide icon set.

- stroke width: approximately `1.6–1.8`;
- default size: `17–19 px`;
- metadata icons: `14–16 px`;
- never mix multiple icon families;
- avoid decorative icons with no function.

---

## 19. Motion

Motion should be subtle.

- hover transition: `140–180 ms`;
- panel open/close: `180–240 ms`;
- easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`;
- small hover translate only when useful: max `-1 px`;
- no bouncing, spring-heavy effects or excessive entrance animations.

Respect `prefers-reduced-motion`.

---

## 20. Responsive behavior

### Desktop ≥ 1200 px
- narrow left rail;
- multi-column card grid;
- dashboard visible without excessive scrolling;
- main priority content above the fold.

### Tablet 768–1199 px
- sidebar may collapse;
- 2-column card grid;
- tables horizontally scroll only if unavoidable.

### Mobile < 768 px
- single-column cards;
- navigation becomes compact bottom nav / drawer if current architecture supports it;
- 16 px page inset;
- card padding 14–16 px;
- all tap targets minimum ~40–44 px;
- key daily summary first.

Do not simply shrink the desktop UI.

---

## 21. Information density

The target is **compact but calm**.

Rules:
- one screen should expose more useful state than the current typical SaaS “huge card” layout;
- reduce decorative blank space inside cards;
- use whitespace between logical groups;
- place secondary metadata close to its parent value;
- avoid repeating labels already obvious from context.

---

## 22. Accessibility

- text contrast should meet WCAG AA where practical;
- all interactive elements keyboard accessible;
- visible focus states;
- semantic colors never used as the only signal;
- icon-only buttons require accessible labels/tooltips;
- minimum interactive target around 40 px, preferably 44 px on touch.

---

## 23. Component design targets

Create/reuse a coherent component layer rather than styling page-by-page independently.

Recommended primitives:
- `AppShell`
- `SidebarNav`
- `TopHeader`
- `PageHeader`
- `Card`
- `MetricCard`
- `AccentMetricCard`
- `SectionCard`
- `StatusChip`
- `ProjectHealthChip`
- `CompactList`
- `DataTable`
- `EmptyState`
- `SearchField`
- `IconButton`
- `ProgressBar`
- `MiniSparkline`
- `ChartTooltip`

Use existing shadcn primitives where appropriate; customize tokens centrally.

---

## 24. Page-specific guidance

### Dashboard
- strongest visual hierarchy;
- compact KPI strip;
- operational cards before analytics;
- prepare visual space/components for future `Сегодня` block;
- avoid making Dashboard look like a finance clone.

### Projects
- project health/status should be scannable in 1–2 seconds;
- progress is clear but not visually oversized;
- active/blocked/deadline context visible without opening each project.

### Project detail
- clear current point → next point progression;
- milestones visually structured;
- related tasks compact;
- use cards/sections rather than a flat wall of text.

### Tasks
- list remains dense and practical;
- priority/status/date easily scannable;
- filters compact;
- leave room for future List/Kanban toggle.

### Processes
- recurring cadence and next run are visually prominent;
- active/inactive state easy to scan.

### Plan / Fact
- dates/times are first-class information;
- planned vs actual distinction visually clear but restrained;
- calendar-like temporal hierarchy without turning it into a full calendar yet.

### Analytics
- sparse charts;
- single accent family;
- large data-ink ratio;
- no dashboard decoration for decoration's sake.

### Settings
- simple grouped sections;
- no oversized cards;
- readable form layout.

---

## 25. Do / Don't

### Do
- use warm neutral background;
- use white cards;
- use one restrained green accent family;
- use small modular cards;
- keep navigation compact;
- keep operational data dense;
- create reusable design tokens;
- preserve Personal OS business logic exactly;
- maintain responsive behavior;
- verify every redesigned page visually.

### Don't
- copy the reference content or branding;
- introduce neon green;
- use glassmorphism;
- use glossy gradients;
- use huge shadows;
- use black outlines around every card;
- make all cards green;
- add fake data;
- change statuses, data model, CRUD or backend in a redesign task;
- implement backlog roadmap features unless explicitly requested;
- rewrite working application logic solely to achieve styling.

---

## 26. Acceptance criteria for the redesign

The redesign is accepted when:

1. Every current Personal OS page uses the same visual language.
2. The app immediately resembles the supplied reference in tone, density, surfaces, radius and accent usage without copying its content.
3. Current routes and functionality remain intact.
4. Existing CRUD behavior remains intact.
5. No backend/data-schema changes are required for the visual redesign.
6. Formula/data semantics remain untouched.
7. Desktop and mobile are both usable.
8. Colors and spacing come from shared tokens, not scattered hard-coded values.
9. Tables remain practical and compact.
10. Dashboard has a clear hierarchy that can later accommodate the `Сегодня` block without another visual-system rewrite.
11. Lint, typecheck, tests and build pass.
12. Final implementation is visually checked page-by-page against the reference screenshot.

---

## 27. Visual north star

The target is not “green SaaS”.

The target is:

> **A quiet premium personal operating system: warm neutral canvas, crisp white cards, graphite typography, muted eucalyptus-green accents, compact high-signal information and almost no decorative noise.**
