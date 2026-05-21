import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api/config";
import Toast from "../components/Toast";
import { pageStyles, SCENARIO_SECTIONS } from "../styles/shared";

function answerKey(scenarioId, questionId) {
  return `${scenarioId}:${questionId}`;
}

export default function PostAssessment() {
  const [questions, setQuestions] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [answers, setAnswers] = useState({});
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function fetchInit() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments/post`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load post-assessment");
        }
        setQuestions(data.questions || []);
        setUsernames(data.usernames || []);
      } catch (err) {
        setError(err.message || "Failed to load post-assessment");
      } finally {
        setLoading(false);
      }
    }

    fetchInit();
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
  const canAnswer = Boolean(username) && !submitResult;

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

    if (!username) {
      setToast("Please select a username");
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
      const res = await fetch(`${API_BASE_URL}/api/assessments/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, submittedAnswers }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const message =
          data.errors?.join(", ") || data.message || "Submission failed";
        throw new Error(message);
      }

      const { score, percentage } = data.assessmentAnswer?.postAssessment ?? {};
      const percentageDifference = data.assessmentAnswer?.percentageDifference;
      setSubmitResult({
        score,
        percentage,
        percentageDifference,
        username,
      });
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
      <h1 style={pageStyles.title}>Post-Assessment</h1>
      <p style={{ textAlign: "center", color: "#E8E8E8", marginBottom: "24px" }}>
        Select your username, then answer all questions in order: Fire, Flood,
        then Earthquake.
      </p>

      {usernames.length === 0 ? (
        <p style={{ textAlign: "center", color: "#E8E8E8" }}>
          No users are eligible for the post-assessment. Complete a
          pre-assessment first.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ ...pageStyles.card, marginBottom: "24px" }}>
            <label
              htmlFor="username"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Username
            </label>
            <select
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setAnswers({});
                setSubmitResult(null);
                setError(null);
              }}
              style={pageStyles.select}
              disabled={submitting || !!submitResult}
            >
              <option value="">Select your username</option>
              {usernames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {username && (
              <p style={{ marginTop: "12px", color: "#E8E8E8", fontSize: "14px" }}>
                Progress: {answeredCount} / {totalQuestions} answered
              </p>
            )}
          </div>

          {username && (
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
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
                                padding: "12px 14px",
                                borderRadius: "14px",
                                cursor: canAnswer ? "pointer" : "default",
                                opacity: canAnswer ? 1 : 0.6,
                                color: "#fff",
                                backgroundColor: "#5E4D6F",
                                border: selected
                                  ? "1px solid #8A6A92"
                                  : "1px solid rgba(255,255,255,0.12)",
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
                                disabled={!canAnswer || submitting}
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
          )}

          {error && (
            <p style={{ ...pageStyles.error, textAlign: "center" }}>{error}</p>
          )}

          {submitResult && (
            <p style={{ ...pageStyles.success, textAlign: "center" }}>
              Submitted successfully as &quot;{submitResult.username}&quot; —
              Score: {submitResult.score} (
              {submitResult.percentage?.toFixed(1)}%)
              {submitResult.percentageDifference != null && (
                <>
                  {" "}
                  — Change from pre-assessment:{" "}
                  {submitResult.percentageDifference > 0 ? "+" : ""}
                  {submitResult.percentageDifference.toFixed(1)}%
                </>
              )}
            </p>
          )}

          {username && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button
                type="submit"
                style={{
                  ...pageStyles.button,
                  ...(submitting || !!submitResult
                    ? pageStyles.buttonDisabled
                    : {}),
                }}
                disabled={submitting || !!submitResult}
              >
                {submitting ? "Saving..." : "Save Answers"}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
