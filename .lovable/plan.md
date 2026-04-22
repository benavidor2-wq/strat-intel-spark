
## Approved plan update: Anomaly & Risk redesign with Claud cookie details

### Goal

Redesign the Anomaly & Risk page into a clearer investigation workspace, while adding cookie-themed details throughout for Claud so the experience feels more personalized and memorable.

---

## What will change

### 1. Replace the current alert list with an investigation dashboard

The Anomaly & Risk page will become a two-column command center:

```text
┌──────────────────────────────┬────────────────────────────────┐
│ Risk Queue                   │ Investigation Detail            │
│                              │                                │
│ Critical alert               │ Selected risk details           │
│ High alert                   │ Evidence checklist              │
│ Medium alert                 │ Recommended action              │
│                              │ Claud cookie insight            │
└──────────────────────────────┴────────────────────────────────┘
```

The left side lets the user select an anomaly.  
The right side shows all details for the selected anomaly.

---

### 2. Add a risk summary header

At the top of the page, add summary cards for:

- Total flagged exposure
- Critical alerts
- High-risk alerts
- Total anomalies
- Latest detection date

Example:

```text
Anomaly & Risk
AI-detected invoice, vendor, and payment integrity risks

[$241,600 Exposure] [2 Critical] [2 High Risk] [5 Alerts]
```

---

### 3. Add severity filtering

Add filter pills above the risk queue:

```text
All | Critical | High | Medium
```

Clicking a filter updates the visible alert list.

---

### 4. Add a clickable Risk Queue

Each alert becomes a compact clickable card showing:

- Severity badge
- Vendor name
- Risk amount
- Anomaly type
- Short description
- Detection date

The selected alert will be highlighted.

---

### 5. Add a full Investigation Detail panel

When an alert is selected, the detail panel will show:

- Vendor name
- Risk amount
- Severity
- Detection date
- Full description
- Why it was flagged
- Evidence checklist
- Recommended next action
- Action buttons

Example actions:

- Mark for Review
- Export Evidence
- Contact Vendor
- Dismiss Risk

These can be visual-only for now unless functionality is requested later.

---

## Cookie details for Claud

### 6. Add cookie-themed UI accents throughout the Anomaly & Risk experience

To personalize the page for Claud, add subtle cookie references across the redesigned page.

This will be visual and UX-focused, not browser tracking cookies.

Examples:

- A small cookie icon or cookie badge in the page header
- “Claud’s Risk Cookie Jar” as a friendly label for the risk queue
- “Cookie crumb trail” section in the investigation detail panel to show evidence steps
- Cookie-themed empty state copy if filters return no results
- Small cookie-style circular markers in the evidence checklist
- A “Claud’s recommendation” callout in the detail panel

Example detail panel section:

```text
Cookie crumb trail
• Invoice pattern detected
• Vendor/payment behavior checked
• Approval threshold reviewed
• Recommended next action generated
```

The cookie theme will stay subtle so the page still feels professional.

---

## Technical implementation

### Main file to update

- `src/components/designs/Glassmorphism.tsx`

The existing `IntegrityReport` component will be redesigned.

### Existing data source

Use the current mock data:

- `integrityAlerts` from `src/data/mockData.ts`

No database changes are required.

### State to add

Add state for selected alert and severity filter:

```ts
const [selectedAlertId, setSelectedAlertId] = useState(integrityAlerts[0]?.id);
const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "medium">("all");
```

### Helper functions to add

Add helper functions to keep the component clean:

```ts
getSeverityStyles(severity)
getAnomalyLabel(type)
getRiskExplanation(type)
getRecommendedAction(type)
getEvidenceItems(alert)
getCookieCrumbTrail(alert)
```

### Layout approach

Use responsive Tailwind grid classes:

```tsx
grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr]
```

Desktop:

```text
Risk Queue | Investigation Detail
```

Mobile:

```text
Summary cards
Risk Queue
Investigation Detail
```

### Styling approach

Keep the current glassmorphism style but make the investigation content solid and readable:

- Solid detail cards
- High-contrast text
- Clear severity colors
- Subtle borders
- No pop-up overlays
- No clipped content

Severity colors:

- Critical: red
- High: amber/orange
- Medium: purple/indigo

Cookie accents should use warm amber/brown tones sparingly so they do not conflict with severity colors.

---

## Final experience

After implementation:

1. User opens Anomaly & Risk
2. They see total exposure and risk counts immediately
3. They scan Claud’s cookie-themed risk queue
4. They filter by severity if needed
5. They click an alert
6. The detail panel updates with full investigation information
7. The user can follow the “cookie crumb trail” to understand why the anomaly was flagged
8. The user sees a clear recommended next action
