# MPLAD Sentinel — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                │
│  CitizenPortal · MPDash · MinistryDash · AgencyDash     │
│  AgencyTrustRegistry · AuditTrail · NexusDetector       │
│  MPScorecard · DoubleFunding                            │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (proxied via Vite dev server)
┌───────────────────────▼─────────────────────────────────┐
│                   Express API (Node.js)                  │
│  /api/citizen  /api/mp  /api/ministry  /api/agency      │
│  /api/ai       /api/audit                               │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼────────────────────┐
        ▼               ▼                    ▼
┌───────────────┐ ┌──────────────┐ ┌─────────────────┐
│  In-Memory    │ │  AI Services │ │  Audit Ledger   │
│  Data Store   │ │              │ │                 │
│  db.js        │ │ riskEngine   │ │ SHA-256 hash    │
│               │ │ duplicateDet │ │ chain           │
│ mps           │ │ agencyTrust  │ │                 │
│ agencies      │ │ forecastEng  │ │ Every write     │
│ projects      │ │ communityTr  │ │ auto-appended   │
│ proposals     │ │ nexusDet     │ │                 │
│ complaints    │ │ doubleFund   │ └─────────────────┘
│ communityRep  │ │ mpScorecard  │
│ externalSch   │ └──────────────┘
└───────────────┘
```

## Data Flow

### Write Path (Audited)
```
API Request → Route Handler → db.write() → store[table][id] = record
                                         ↓
                               auditLedger.append({
                                 action, actor, table, id, payload
                               })
                                         ↓
                               SHA256(prev_hash + timestamp + actor + action + payload)
                                         ↓
                               ledger.push({ index, hash, prev_hash, ... })
```

### Read Path (Analytical)
```
API Request → Route Handler → Service (reads from db.getAll / db.query)
                            → Computes score/graph/forecast
                            → Returns enriched JSON
```

## Key Design Decisions

### 1. In-Memory Store
No database dependency — enables zero-setup demo. The `db.js` module acts as an ORM facade: `getAll`, `getById`, `query`, `write`, `seed`. Switching to PostgreSQL would only require replacing these 5 functions.

### 2. Hash-Chained Audit Ledger
```
Entry 0: hash = SHA256("0000..." + ts + actor + action + payload)
Entry 1: hash = SHA256(entry0.hash + ts + actor + action + payload)
Entry N: hash = SHA256(entryN-1.hash + ts + actor + action + payload)
```
Tampering entry #5 changes its hash, which breaks entry #6's prev_hash check, which breaks all subsequent entries. The `verify()` function traverses the entire chain in O(n).

### 3. Silent Seed vs. Audited Write
`db.seed()` bypasses the audit ledger (used only for initial data loading). `db.write()` always appends to the ledger. This keeps the audit trail clean — only real runtime actions appear.

### 4. Statistical Risk Scoring
- **Cost anomaly**: z-score = (project_budget - mean) / stddev, using same-category projects
- **Timeline anomaly**: elapsed_days / total_days = expected_progress; actual vs. expected gap
- **Mismatch**: |fund_utilization_ratio - completion_ratio| > threshold
- No ML models — all interpretable statistics, explainable to a judge in 30 seconds

### 5. Nexus Graph
Built at request time from the in-memory store — no graph database. The D3 force simulation runs entirely in the browser. The backend returns plain `{nodes, edges, suspiciousPatterns}` JSON.

### 6. Frontend Design System
All UI uses CSS variables + vanilla Tailwind. No component library dependency. Dark glassmorphism base (`#0a0e1a` + `rgba(255,255,255,0.04)` cards) with electric indigo accent. Google Fonts loaded via `<link>` in `index.html`.

## Service Dependency Map

```
server.js
  ├── data/seed.js → store/db.js → services/auditLedger.js
  ├── routes/citizen.routes.js → store/db.js
  ├── routes/mp.routes.js → store/db.js, services/riskEngine.js, services/forecastEngine.js
  ├── routes/ministry.routes.js → store/db.js
  ├── routes/agency.routes.js → store/db.js, services/agencyTrust.js
  ├── routes/ai.routes.js
  │     ├── services/riskEngine.js → store/db.js
  │     ├── services/duplicateDetector.js → store/db.js, utils/similarity.js
  │     ├── services/forecastEngine.js → store/db.js
  │     ├── services/communityTrust.js → store/db.js
  │     ├── services/nexusDetector.js → store/db.js, utils/similarity.js
  │     ├── services/doubleFundingDetector.js → store/db.js, utils/similarity.js
  │     └── services/mpScorecard.js → store/db.js
  └── routes/audit.routes.js → services/auditLedger.js
```

## Scalability Path

| Current (Demo) | Production |
|----------------|------------|
| In-memory store | PostgreSQL / MongoDB |
| Hash-chain in memory | Append-only DB table / IPFS |
| Static seed data | Real MP/project API integration |
| Single process | Horizontally scaled with Redis session |
| No auth | OAuth2 with role-based JWT |
| Simulated satellite | ISRO Bhuvan API / Copernicus Sentinel-2 |
