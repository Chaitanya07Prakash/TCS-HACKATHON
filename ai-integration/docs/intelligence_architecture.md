# SMART CAMPUS AI — Intelligence Layer Architecture & Contracts

**Role:** Member 3 (AI + Intelligence Engineer)  
**System Mission:** Convert unstructured circulars into personalized decisions, deterministic eligibility, prioritized actions, and grounded natural language answers.

---

## 1. End-to-End AI Pipeline

```
[ Raw College Notice / Circular ]
              │
              ▼
    1. Text Cleaning & Normalization
       • Component: `src/extractor/cleaner.ts` (`cleanNoticeText`)
       • Strips noise, OCR artifacts, header junk, normalized whitespace
              │
              ▼
    2. Notice Classification
       • Component: `src/extractor/classifier.ts` (`classifyNotice`)
       • Determines primary category (e.g. PLACEMENT, SCHOLARSHIP) & secondary tags
              │
              ▼
    3. Information Extraction
       • Component: `src/extractor/extractor.ts` (`extractNoticeDetails`)
       • Extracts title, organization, dates, location, link, documents
              │
              ▼
    4. Requirement & Eligibility Extraction
       • Component: `src/extractor/requirementExtractor.ts` (`extractEligibilityCriteria`)
       • Extracts eligible branches, minimum CGPA, graduation years, allowed semesters
              │
              ▼
    5. Action Extraction
       • Component: `src/extractor/actionExtractor.ts` (`extractRequiredActions`)
       • Extracts discrete steps (e.g. "Register", "Upload Resume") + deadlines
              │
              ▼
    6. Summary Generation
       • Component: `src/extractor/summarizer.ts` (`generateStudentSummary`)
       • Student-friendly structured digest ("Who can apply", "Deadlines", "Actions")
              │
              ▼
    7. Deterministic Eligibility Evaluation
       • Component: `src/engine/eligibility.ts` (`evaluateEligibility`)
       • Pure deterministic TypeScript rules (branch match, CGPA >= threshold, graduation year)
       • Explains WHY eligible or lists exact missing criteria
              │
              ▼
    8. 100-Point Relevance Scoring & Priority
       • Component: `src/engine/relevance.ts` (`calculateRelevance`)
       • Weighted rubric: Branch (30) + Grad Year (20) + CGPA (15) + Interest (15) + Skill (10) + Urgency (10)
       • Maps to Priority: HIGH (>=80), MEDIUM (50-79), LOW (<50)
              │
              ▼
    9. Actionable Task Recommendation
       • Component: `src/engine/taskRecommender.ts` (`generateTasksForStudent`)
       • Generates personalized student tasks with due dates linked to the notice
              │
              ▼
   10. Grounded AI Assistant
       • Component: `src/assistant/assistant.ts` (`answerStudentQuery`)
       • In-context QA strictly bounded by student's active tasks and eligible opportunities
```

---

## 2. Strict Division: LLM vs Deterministic Code

| Domain | Handled By | Responsibility |
| :--- | :--- | :--- |
| **Notice Understanding** | **LLM** | Parsing unformatted sentences, noisy formatting, identifying intents |
| **Information Extraction**| **LLM + Schema** | Pulling out strings, dates, branch names, cutoff numbers into JSON |
| **Summarization** | **LLM** | Simplifying complex circular text into bite-sized bullets |
| **Natural Language QA** | **LLM** | Conversational responses grounded in student context |
| **Eligibility Decisions** | **Deterministic Code** | Comparing numbers (`student.cgpa >= cutoff`), matching arrays (`branches.includes()`) |
| **Graduation Year Match** | **Deterministic Code** | Exact equality or set inclusion check |
| **Relevance Calculation** | **Deterministic Code** | 100-point formula, priority bucket assignment |
| **Urgency / Due Dates** | **Deterministic Code** | Date math (`deadline - now <= 3 days`) |
| **Anti-Hallucination** | **Deterministic Code & Strict System Prompt** | Verifying facts exist in payload before responding |

---

## 3. Failure Behavior Matrix

| Failure Scenario | Fallback / System Behavior | Student & System Impact |
| :--- | :--- | :--- |
| **Missing Deadline** | Sets `deadline: null`. Urgency score receives 0 pts. | Summary explicitly shows *"Deadline: Not specified in notice"*. |
| **Missing Eligibility** | Sets all criteria to empty / null. | Treated as open to all students (`eligible: true`, *"No specific eligibility restrictions specified"*). |
| **Malformed / Incomplete Notice** | Extractor sets `confidence < 0.5`, keeps cleaned text. | Flagged for manual review; returns generic notice category. |
| **Poor OCR Quality** | Pre-processing regex normalizes broken words; if illegible, returns error with message. | Dashboard warns: *"Notice text could not be fully parsed. Please view original document."* |
| **AI Returns Invalid JSON** | Zod validation rejects payload $\rightarrow$ triggers local regex fallback extractor. | Zero runtime crashes; guarantees valid TypeScript object returned. |
| **Incomplete Student Profile** | Missing student fields (e.g. CGPA missing) flagged in `EligibilityResult`. | `eligible: false`, `missingRequirements: ["Profile incomplete: Please update your CGPA"]`. |
| **No Opportunities Match** | Feeds empty array to AI Assistant and Dashboard. | Assistant responds: *"You currently have no matching placement opportunities. Check general circulars."* |
| **AI Service Down / Rate Limited** | Activates local deterministic rule-based extractor & mock cache. | 100% demo resilience during live hackathon presentations. |

---

## 4. Integration Points with Member 2 (Backend)

The intelligence layer exposes three clean async functions in `src/service/intelligenceService.ts`:

1. `processRawNotice(rawNoticeText: string): Promise<StructuredNotice>`
   * Called by Member 2 when an admin or student uploads a notice.
2. `evaluateForStudent(student: StudentProfile, notice: StructuredNotice): OpportunityEvaluation`
   * Called by Member 2 to compute eligibility, relevance, and tasks for a specific student.
3. `queryAssistant(question: string, context: AssistantContext): Promise<string>`
   * Called by Member 2 when the student types in the chat window.
