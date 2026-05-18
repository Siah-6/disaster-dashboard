import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api/config";
import Toast from "../components/Toast";
import { pageStyles, SCENARIO_SECTIONS } from "../styles/shared";

function answerKey(scenarioId, questionId) {
  return `${scenarioId}:${questionId}`;
}

export default function PreAssessment() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/pre`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load questions");
        }
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  const questionsByScenario = useMemo(() => {
    const grouped = { fire: [], flood: [], earthquake: [] };
    for (const q of questions) {
      if (grouped[q.scenarioId]) {
        grouped[q.scenarioId].push(q);
      }
    }
    for (const id of Object.keys(grouped)) {
      grouped[id].sort((a, b) => a.id - b.id);
    }
    return grouped;
  }, [questions]);

  const orderedQuestions = useMemo(
    () => SCENARIO_SECTIONS.flatMap(({ id }) => questionsByScenario[id]),
    [questionsByScenario]
  );

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  function handleSelect(scenarioId, questionId, option) {
    setAnswers((prev) => ({
      ...prev,
      [answerKey(scenarioId, questionId)]: option,
    }));
    setSubmitResult(null);
    setToast(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setToast(null);
    setSubmitResult(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Please enter a username before submitting.");
      return;
    }

    const firstMissingIndex = orderedQuestions.findIndex(
      (q) => !answers[answerKey(q.scenarioId, q.id)]
    );
    if (firstMissingIndex !== -1) {
      const missing = orderedQuestions[firstMissingIndex];
      setToast(`Please answer Question #${firstMissingIndex + 1}`);
      document
        .getElementById(answerKey(missing.scenarioId, missing.id))
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const submittedAnswers = orderedQuestions.map((q) => ({
      scenarioId: q.scenarioId,
      questionId: q.id,
      answer: answers[answerKey(q.scenarioId, q.id)],
    }));

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assessments/pre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, submittedAnswers }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const message =
          data.errors?.join(", ") || data.message || "Submission failed";
        throw new Error(message);
      }

      const { score, percentage } = data.assessmentAnswer?.preAssessment ?? {};
      setSubmitResult({ score, percentage, username: trimmedUsername });
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <h1 style={{ textAlign: "center" }}>Loading questions...</h1>;
  }

  if (error && questions.length === 0) {
    return (
      <p style={{ ...pageStyles.error, textAlign: "center" }}>{error}</p>
    );
  }

  return (
    <div style={pageStyles.container}>
      <Toast message={toast} onClose={dismissToast} />
      <h1 style={pageStyles.title}>Pre-Assessment</h1>
      <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "24px" }}>
        Answer all questions in order: Fire, then Flood, then Earthquake.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ ...pageStyles.card, marginBottom: "24px" }}>
          <label
            htmlFor="username"
            style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSubmitResult(null);
            }}
            placeholder="Enter your username"
            style={pageStyles.input}
            disabled={submitting || !!submitResult}
          />
          <p style={{ marginTop: "12px", opacity: 0.6, fontSize: "14px" }}>
            Progress: {answeredCount} / {totalQuestions} answered
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          {SCENARIO_SECTIONS.map(({ id, label }, sectionIndex) => (
            <div key={id}>
              <h2
                style={{
                  ...pageStyles.dividerHeader,
                  ...(sectionIndex === 0 ? { marginTop: 0 } : {}),
                }}
              >
                <span>{label} Questions</span>
                <span style={pageStyles.dividerLine} />
              </h2>

              {questionsByScenario[id].map((q) => (
                <div
                  key={answerKey(q.scenarioId, q.id)}
                  id={answerKey(q.scenarioId, q.id)}
                  style={pageStyles.card}
                >
                  <p style={{ fontWeight: "600", marginBottom: "12px" }}>
                    {q.id}. {q.question}
                  </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(q.options).map(([letter, text]) => {
                  const selected =
                    answers[answerKey(q.scenarioId, q.id)] === letter;
                  return (
                    <label
                      key={letter}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        backgroundColor: selected
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(255,255,255,0.03)",
                        border: selected
                          ? "1px solid #3b82f6"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <input
                        type="radio"
                        name={answerKey(q.scenarioId, q.id)}
                        value={letter}
                        checked={selected}
                        onChange={() =>
                          handleSelect(q.scenarioId, q.id, letter)
                        }
                        disabled={submitting || !!submitResult}
                        style={{ marginTop: "3px" }}
                      />
                      <span>
                        <strong>{letter}.</strong> {text}
                      </span>
                    </label>
                  );
                })}
              </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {error && questions.length > 0 && (
          <p style={{ ...pageStyles.error, textAlign: "center" }}>{error}</p>
        )}

        {submitResult && (
          <p style={{ ...pageStyles.success, textAlign: "center" }}>
            Submitted successfully as &quot;{submitResult.username}&quot; — Score:{" "}
            {submitResult.score} ({submitResult.percentage?.toFixed(1)}%)
          </p>
        )}

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            type="submit"
            style={{
              ...pageStyles.button,
              ...(submitting || !!submitResult ? pageStyles.buttonDisabled : {}),
            }}
            disabled={submitting || !!submitResult}
          >
            {submitting ? "Saving..." : "Save Answers"}
          </button>
        </div>
      </form>
    </div>
  );
}
