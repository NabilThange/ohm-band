# Building a Claude-Style Elicitation Widget

---

## 1. The Goal

When Claude needs more context before answering, it doesn't just ask questions in plain text — it surfaces a **structured, interactive UI** directly in the chat. This is called an **elicitation widget** (or stepper/wizard UI).

The goal is to:

- Ask the user a **series of questions**, one at a time
- Let them pick from **predefined options** or **type a custom answer**
- Collect all answers and **submit them back** to Claude as a single structured message
- Make the experience feel native to the chat — not like a form opened in a new tab

This pattern is useful any time you need to gather preferences, constraints, or context before doing meaningful work. Examples: choosing a workout plan, configuring a code scaffold, planning a trip, onboarding a new user.

---

## 2. How Claude Does It (The Real Flow)

Under the hood, this is a **tool call**. Here's the full lifecycle:

```
1. User sends a message
2. Claude begins streaming a response
3. Claude decides it needs more info → emits a `tool_use` block
4. The tool is: ask_user_input_v0
5. Claude passes a JSON payload describing the questions + options
6. The frontend receives this and renders the stepper widget
7. User fills out the questions and hits Submit
8. The answers are injected back as a `tool_result` message
9. Claude reads the answers and continues its response
```

The **questions and options are not hardcoded** — Claude generates them dynamically based on what it needs to know. The tool schema enforces the JSON shape, and the frontend just renders whatever Claude produced.

The JSON Claude emits looks like this:

```json
{
  "questions": [
    {
      "question": "What are you primarily trying to accomplish?",
      "type": "single_select",
      "options": ["Writing", "Coding", "Research", "Brainstorm"]
    },
    {
      "question": "How much detail do you want?",
      "type": "single_select",
      "options": ["Brief", "Balanced", "Thorough", "Comprehensive"]
    }
  ]
}
```

The frontend is just a **dumb renderer** — it takes whatever JSON came in and builds the UI from it.

---

## 3. The Logic of the Widget

The stepper has three pieces of state:

| State | Type | Purpose |
|---|---|---|
| `questions` | `Array` | The list of question objects (text + options) |
| `current` | `number` | Index of the question currently shown |
| `answers` | `object` | Map of `{ questionId: { idx, text } }` |

### Navigation rules

- **Next** is disabled until the current question has an answer
- **Back** just decrements `current` — no validation needed
- On the **last question**, Next becomes Submit
- Submit fires `onSubmit(answers)` with the full answers map

### The "Other" option

Each question gets a free-text field as a final option. Its selection index is a sentinel value (`999`) so it doesn't collide with real option indices. The Next button stays disabled until the user types at least one character.

```
answers[qId] = { idx: 999, text: "whatever the user typed" }
```

### Re-render on every interaction

Every action — selecting an option, typing in the Other field, clicking Next/Back — updates state and calls `render()`. The entire card re-renders from scratch. This keeps the logic simple and predictable. In React, this is just `useState` + JSX re-rendering naturally.

---

## 4. Example Code (React)

### The data shape

```js
const questions = [
  {
    id: 1,
    text: "What are you trying to accomplish?",
    options: ["Writing", "Coding", "Research", "Brainstorm"],
  },
  {
    id: 2,
    text: "How much detail do you want?",
    options: ["Brief", "Balanced", "Thorough", "Comprehensive"],
  },
];
```

### The component

```jsx
import { useState } from "react";

const OTHER_IDX = 999;

export default function ElicitationWidget({ questions, onSubmit }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const ans = answers[q.id];
  const isOtherSelected = ans?.idx === OTHER_IDX;

  const isAnswered = (qId) => {
    const a = answers[qId];
    if (!a) return false;
    if (a.idx === OTHER_IDX) return a.text?.trim().length > 0;
    return true;
  };

  const selectOption = (idx, text) => {
    setAnswers((prev) => ({ ...prev, [q.id]: { idx, text } }));
  };

  const handleNext = () => {
    if (!isAnswered(q.id)) return;
    if (isLast) {
      setSubmitted(true);
      onSubmit(answers);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (submitted) {
    return <ResultView questions={questions} answers={answers} />;
  }

  return (
    <div className="card">
      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      <p className="step-label">
        Question {current + 1} of {questions.length}
      </p>
      <p className="question">{q.text}</p>

      {/* Predefined options */}
      <div className="options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`option-btn ${ans?.idx === i ? "selected" : ""}`}
            onClick={() => selectOption(i, opt)}
          >
            <Circle filled={ans?.idx === i} />
            {opt}
          </button>
        ))}

        {/* Free-text "Other" option */}
        <div
          className={`other-row ${isOtherSelected ? "selected" : ""}`}
          onClick={() => selectOption(OTHER_IDX, ans?.text || "")}
        >
          <Circle filled={isOtherSelected} />
          <input
            type="text"
            placeholder="Other — type your own answer…"
            value={isOtherSelected ? (ans?.text || "") : ""}
            onFocus={() => selectOption(OTHER_IDX, ans?.text || "")}
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                [q.id]: { idx: OTHER_IDX, text: e.target.value },
              }))
            }
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="nav">
        <button
          className="nav-btn"
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
        >
          ← Back
        </button>
        <button
          className="nav-btn primary"
          onClick={handleNext}
          disabled={!isAnswered(q.id)}
        >
          {isLast ? "Submit ✓" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function Circle({ filled }) {
  return (
    <div className={`circle ${filled ? "filled" : ""}`}>
      {filled && <div className="circle-dot" />}
    </div>
  );
}

function ResultView({ questions, answers }) {
  return (
    <div className="result">
      <h3>Your answers</h3>
      {questions.map((q) => (
        <div key={q.id} className="result-row">
          <span className="label">{q.text}</span>
          <span className="value">{answers[q.id]?.text || "—"}</span>
        </div>
      ))}
    </div>
  );
}
```

### Wiring it up in a parent

```jsx
function App() {
  const handleSubmit = (answers) => {
    // answers = { 1: { idx: 0, text: "Writing" }, 2: { idx: 999, text: "Whatever I typed" } }
    console.log("User answered:", answers);

    // In Claude.ai: this gets injected as a tool_result message back to Claude
    // In your app: send it to your API, set state, trigger the next step, etc.
  };

  return (
    <ElicitationWidget
      questions={questions}
      onSubmit={handleSubmit}
    />
  );
}
```

---

## 5. How to Generate Questions Dynamically with an LLM

If you want Claude (or any LLM) to generate the questions automatically based on a user's initial message, prompt the model to respond in JSON:

```js
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are a helpful assistant. When the user sends a request,
generate clarifying questions to gather the context you need.
Respond ONLY with a valid JSON object in this exact shape — no preamble, no markdown:
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C"]
    }
  ]
}
Limit to 3–5 questions. Each question gets 3–4 options.`,
    messages: [{ role: "user", content: userMessage }],
  }),
});

const data = await response.json();
const raw = data.content[0].text;
const { questions } = JSON.parse(raw); // feed directly into <ElicitationWidget />
```

The JSON goes straight into the `questions` prop — the widget renders it without any changes.

---

## Summary

| Piece | What it does |
|---|---|
| `questions` array | Defines what to ask — can be hardcoded or LLM-generated |
| `current` index | Controls which question is visible |
| `answers` map | Accumulates selections as the user moves through |
| `OTHER_IDX = 999` | Sentinel value to identify the free-text option |
| `isAnswered()` | Gates the Next button — also validates the Other field isn't empty |
| `onSubmit(answers)` | Your callback — send to API, inject as tool_result, set state, etc. |