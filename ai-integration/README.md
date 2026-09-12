# SMART CAMPUS AI — AI Integration Engine (Member 3)

> **"Never Miss an Opportunity"** — Converts unstructured college notices and circulars into personalized decisions, deterministic eligibility, prioritized actions, and natural-language assistance.

---

## 📁 Package Directory Structure

```
ai-integration/
├── src/
│   ├── types/                  # Canonical shared TypeScript data contracts
│   │   └── index.ts
│   ├── schemas/                # Zod runtime validation schemas
│   │   └── notice.schema.ts
│   ├── extractor/              # Notice understanding, entity & action extraction
│   │   ├── cleaner.ts          # OCR & text normalization layer
│   │   ├── classifier.ts       # 10-category classification engine
│   │   ├── ruleExtractor.ts    # Deterministic entity & date extractor
│   │   ├── actionExtractor.ts  # Discrete student action extractor
│   │   ├── summarizer.ts       # Student digest generator
│   │   ├── personalSummarizer.ts # Personalized summary card generator
│   │   └── extractor.ts        # Master extraction orchestrator
│   ├── engine/                 # Deterministic decision rule engines
│   │   ├── eligibility.ts      # Zero-hallucination eligibility engine
│   │   └── relevance.ts        # Explainable 100-point relevance & priority engine
│   ├── assistant/              # Grounded Smart Campus Assistant
│   │   ├── intentDetector.ts   # 9-intent query classifier
│   │   ├── retriever.ts        # Scoped context retrieval (zero DB dumping)
│   │   └── assistant.ts        # Grounded natural language answering engine
│   ├── service/                # Unified service facade for Backend (Member 2)
│   │   └── intelligenceService.ts
│   └── api/                    # Ready-to-mount REST API controllers
│       └── routes.ts
├── docs/
│   └── intelligence_architecture.md # Complete architectural specification
├── test/                       # 7 automated test suites (55+ tests)
│   ├── test_notice_intelligence.ts
│   ├── test_eligibility.ts
│   ├── test_relevance.ts
│   ├── test_phase5_summary_actions.ts
│   ├── test_assistant.ts
│   ├── test_end_to_end_integration.ts
│   └── test_reliability_hardening.ts
├── demo/
│   └── hackathon_demo.ts       # Full end-to-end runnable hackathon demonstration
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start & Verification

### 1. Install Dependencies
```bash
cd ai-integration
npm install
```

### 2. Run All Automated Test Suites (55 Tests)
```bash
npx tsc --noEmit
npx tsx test/test_notice_intelligence.ts
npx tsx test/test_eligibility.ts
npx tsx test/test_relevance.ts
npx tsx test/test_phase5_summary_actions.ts
npx tsx test/test_assistant.ts
npx tsx test/test_end_to_end_integration.ts
npx tsx test/test_reliability_hardening.ts
```

### 3. Run the Live Hackathon Demo
```bash
npx tsx demo/hackathon_demo.ts
```

---

## 🔌 Integration Guide for Teammates

### For Member 2 (Backend + Database):

You can import `intelligenceService` directly into your backend controllers:

```typescript
import { intelligenceService } from "./ai-integration/src/service/intelligenceService.js";

// 1. When an admin uploads a notice:
const structuredNotice = await intelligenceService.ingestNotice(rawText);

// 2. To evaluate a notice for a student:
const evaluation = intelligenceService.evaluateOpportunityForStudent(studentProfile, structuredNotice);

// 3. To fetch the complete student dashboard:
const dashboard = intelligenceService.evaluateStudentDashboard(studentProfile, notices);

// 4. When a student chats with the AI Assistant:
const reply = await intelligenceService.handleAssistantQuery(query, {
  student: studentProfile,
  notices: notices,
  activeTasks: tasks,
});
```

Alternatively, mount the pre-built REST routes from `ai-integration/src/api/routes.js` into your Express/Next.js router.

---

### For Member 1 (Frontend + UI/UX):

All API responses return structured, typed payloads ready to bind to React/Next.js components:

* **Dashboard View:** `StudentDashboardData` provides:
  * `highPriorityOpportunities`: Array of top cards with 100-pt score breakdown.
  * `actionableTasks`: Interactive to-do list with deadlines and priority badges (`HIGH`, `MEDIUM`, `LOW`).
  * `upcomingDeadlines`: Chronological timeline for calendar views.
* **AI Assistant Response:** `AssistantResponse` provides:
  * `answer`: Conversational text answer.
  * `intent`: Detected intent (`TASK_QUERY`, `PLACEMENT_QUERY`, etc.).
  * `opportunities`: Structured cards matching the query.
  * `tasks`: Contextual task widgets.
  * `deadlines`: Highlighted dates.
