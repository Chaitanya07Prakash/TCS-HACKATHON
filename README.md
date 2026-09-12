# TCS-HACKATHON — SMART CAMPUS AI

> **"Never Miss an Opportunity"** — An intelligent campus decision engine that converts unstructured college announcements into personalized opportunities, deterministic eligibility decisions, prioritized tasks, and grounded AI assistant answers.

---

## 👥 Three-Member Team Structure

* **Member 1 (Frontend + UI/UX):** Next.js / React application, Student Dashboard, Opportunity feed, Task checklist, and AI Assistant UI.
* **Member 2 (Backend + Database):** PostgreSQL database models, Authentication, CRUD APIs, and pipeline orchestration.
* **Member 3 (AI + Intelligence Layer):** Notice understanding, deterministic eligibility, explainable 100-point relevance scoring, action extraction, personalized summaries, and grounded AI assistant.

---

## 📁 Repository Structure

```
TCS-HACKATHON/
├── ai-integration/             # Member 3: AI & Intelligence Engine Package
│   ├── src/                    # Types, schemas, extraction, rule engines, assistant, API routes
│   ├── docs/                   # Architecture and pipeline documentation
│   ├── test/                   # 7 automated test suites (55+ tests)
│   ├── demo/                   # End-to-end runnable hackathon demonstration
│   ├── package.json
│   └── README.md               # Detailed AI integration documentation
├── .gitignore
└── README.md                   # Project overview
```

---

## ⚡ Live Hackathon Demo (AI Layer)

To run the live hackathon story:

```bash
cd ai-integration
npm install
npx tsx demo/hackathon_demo.ts
```
