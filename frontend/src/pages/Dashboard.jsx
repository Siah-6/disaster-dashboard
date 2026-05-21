import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL } from "../api/config";
import { pageStyles } from "../styles/shared";

const LOCATIONS = ["SCHOOL", "OFFICE", "HOUSE", "OUTDOOR"];
const DISASTERS = ["FIRE", "FLOOD", "EARTHQUAKE"];
const COLORS = ["#C3B0F9", "#5E4BAA"];

const cardStyles = {
  backgroundColor: "#26415E",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
  padding: "clamp(16px, 4vw, 20px) clamp(14px, 3vw, 18px)",
  width: "clamp(160px, 45vw, 220px)",
  minHeight: "clamp(280px, 70vw, 320px)",
  maxWidth: "100%",
  boxShadow: "0 10px 24px rgba(16, 28, 50, 0.12)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  transition: "all 0.2s ease",
  cursor: "pointer",
  color: "#fff",
};

export default function Dashboard() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [assessmentBreakdown, setAssessmentBreakdown] = useState({
    rows: [],
    summary: null,
  });
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [showIndividualBreakdown, setShowIndividualBreakdown] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/decisions`);
        const data = await res.json();
        const decisions = data.decisions || [];

        const result = {};

        LOCATIONS.forEach((location) => {
          result[location] = {};
          DISASTERS.forEach((disaster) => {
            result[location][disaster] = {
              correct: 0,
              incorrect: 0,
              reactionTimes: [],
            };
          });
        });

        decisions.forEach((d) => {
          const location = d.location?.toUpperCase();
          const disaster = d.disaster?.toUpperCase();

          if (!result[location] || !result[location][disaster]) return;

          if (d.isCorrect) {
            result[location][disaster].correct += 1;
          } else {
            result[location][disaster].incorrect += 1;
          }

          const reactionTime = d.reactionTime;
          if (typeof reactionTime === "number" && reactionTime > 0) {
            result[location][disaster].reactionTimes.push(reactionTime);
          }
        });

        setGrouped(result);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchAssessmentBreakdown() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assessments`);
        const data = await res.json();
        const answers = Array.isArray(data.answers) ? data.answers : [];

        const breakdownRows = answers
          .map((item) => {
            const username = item.username;
            const prePercentage = item.preAssessment?.percentage;
            const postPercentage = item.postAssessment?.percentage;
            const rawChange = item.percentageDifference;
            const changePercentage = typeof rawChange === "number"
              ? rawChange
              : typeof prePercentage === "number" && typeof postPercentage === "number"
              ? postPercentage - prePercentage
              : null;

            if (
              !username ||
              typeof prePercentage !== "number" ||
              typeof postPercentage !== "number"
            ) {
              return null;
            }

            return {
              username,
              prePercentage: Number(prePercentage),
              postPercentage: Number(postPercentage),
              changePercentage: changePercentage == null
                ? null
                : Math.round(changePercentage * 100) / 100,
            };
          })
          .filter((row) => row && row.changePercentage != null);

        const summary = breakdownRows.length
          ? {
              averagePrePercentage:
                Math.round(
                  (breakdownRows.reduce((sum, row) => sum + row.prePercentage, 0) /
                    breakdownRows.length) *
                    100
                ) / 100,
              averagePostPercentage:
                Math.round(
                  (breakdownRows.reduce((sum, row) => sum + row.postPercentage, 0) /
                    breakdownRows.length) *
                    100
                ) / 100,
              averageChangePercentage:
                Math.round(
                  (breakdownRows.reduce((sum, row) => sum + row.changePercentage, 0) /
                    breakdownRows.length) *
                    100
                ) / 100,
            }
          : null;

        setAssessmentBreakdown({ rows: breakdownRows, summary });
      } catch (err) {
        console.error(err);
        setAssessmentBreakdown({ rows: [], summary: null });
      } finally {
        setBreakdownLoading(false);
      }
    }

    fetchAssessmentBreakdown();
  }, []);

  const simulations = Object.entries(grouped).flatMap(([location, disasters]) =>
    Object.entries(disasters)
      .map(([disaster, stats]) => {
        const total = stats.correct + stats.incorrect;
        const accuracyPct = total ? Math.round((stats.correct / total) * 100) : 0;
        const errorPct = total ? Math.round((stats.incorrect / total) * 100) : 0;
        const validReactionTimes = Array.isArray(stats.reactionTimes)
          ? stats.reactionTimes.filter((rt) => typeof rt === "number" && rt > 0)
          : [];
        const averageReactionTime = validReactionTimes.length
          ? validReactionTimes.reduce((sum, rt) => sum + rt, 0) / validReactionTimes.length
          : null;

        return {
          location,
          disaster,
          correct: stats.correct,
          incorrect: stats.incorrect,
          total,
          accuracy: total ? stats.correct / total : 0,
          accuracyPct,
          errorPct,
          averageReactionTime,
        };
      })
      .filter((sim) => sim.total > 0)
  );

  const totalCorrect = simulations.reduce((sum, sim) => sum + sim.correct, 0);
  const totalIncorrect = simulations.reduce((sum, sim) => sum + sim.incorrect, 0);
  const totalResponses = totalCorrect + totalIncorrect;
  const averageAccuracy = totalResponses
    ? Math.round((totalCorrect / totalResponses) * 100)
    : 0;

  const topErrorSimulations = [...simulations]
    .sort((a, b) => b.errorPct - a.errorPct)
    .slice(0, 5);

  const topCorrectSimulations = [...simulations]
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 5);

  if (loading) return <h1 style={{ textAlign: "center" }}>Loading...</h1>;

  return (
    <div style={pageStyles.wideContainer}>
      <h1 style={pageStyles.title}>Disaster Simulation Dashboard</h1>
      <p style={{ textAlign: "center", color: "#E8E8E8", marginBottom: "24px" }}>
        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
      </p>

      <div style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>Overall Summary</h2>
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div style={pageStyles.summaryCard}>
            <p style={{ margin: 0, color: "#E8E8E8" }}>Total Correct</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalCorrect}
            </p>
          </div>
          <div style={pageStyles.summaryCard}>
            <p style={{ margin: 0, color: "#E8E8E8" }}>Total Incorrect</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalIncorrect}
            </p>
          </div>
          <div style={pageStyles.summaryCard}>
            <p style={{ margin: 0, color: "#E8E8E8" }}>Total Responses</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalResponses}
            </p>
          </div>
          <div style={pageStyles.summaryCard}>
            <p style={{ margin: 0, color: "#E8E8E8" }}>Average Accuracy</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {averageAccuracy}%
            </p>
          </div>
        </div>
      </div>

      <div style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>Top Simulations with Most Errors</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          {topErrorSimulations.length === 0 ? (
            <p style={{ color: "#E8E8E8" }}>No simulations with errors yet.</p>
          ) : (
            topErrorSimulations.map((sim, index) => (
              <div
                key={`${sim.location}-${sim.disaster}`}
                style={{
                  ...pageStyles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "48px", flexShrink: 0, textAlign: "left" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                      #{index + 1}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {sim.location} / {sim.disaster}
                    </p>
                    <p style={{ margin: "6px 0 0", color: "#E8E8E8", fontSize: "14px" }}>
                      Incorrect: {sim.incorrect} • Total: {sim.total}
                    </p>
                  </div>
                </div>
                <div style={{ minWidth: "70px", textAlign: "right" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444" }}>{sim.errorPct}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>Top Correct Simulations</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          {topCorrectSimulations.length === 0 ? (
            <p style={{ color: "#E8E8E8" }}>No correct simulation data yet.</p>
          ) : (
            topCorrectSimulations.map((sim, index) => (
              <div
                key={`${sim.location}-${sim.disaster}`}
                style={{
                  ...pageStyles.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "48px", flexShrink: 0, textAlign: "left" }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                      #{index + 1}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {sim.location} / {sim.disaster}
                    </p>
                    <p style={{ margin: "6px 0 0", color: "#E8E8E8", fontSize: "14px" }}>
                      Correct: {sim.correct} • Total: {sim.total}
                    </p>
                  </div>
                </div>
                <div style={{ minWidth: "70px", textAlign: "right" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#22c55e" }}>{sim.accuracyPct}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>Assessment Breakdown</h2>
        <div style={{ display: "grid", gap: "16px" }}>
          {breakdownLoading ? (
            <p style={{ color: "#E8E8E8" }}>Loading assessment breakdown...</p>
          ) : (
            <>
              <div
                style={{
                  ...pageStyles.card,
                  display: "grid",
                  gap: "16px",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  alignItems: "start",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: "#E8E8E8" }}>Average Pre-Assessment</p>
                  <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
                    {assessmentBreakdown.summary?.averagePrePercentage != null
                      ? `${assessmentBreakdown.summary.averagePrePercentage}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: "#E8E8E8" }}>Average Post-Assessment</p>
                  <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
                    {assessmentBreakdown.summary?.averagePostPercentage != null
                      ? `${assessmentBreakdown.summary.averagePostPercentage}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: "#E8E8E8" }}>Average Change</p>
                  <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
                    {assessmentBreakdown.summary?.averageChangePercentage != null
                      ? `${assessmentBreakdown.summary.averageChangePercentage > 0 ? "+" : ""}${assessmentBreakdown.summary.averageChangePercentage}%`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIndividualBreakdown((prev) => !prev)}
                style={{
                  ...pageStyles.button,
                  width: "fit-content",
                  margin: "0 0 0 auto",
                  alignSelf: "flex-end",
                }}
              >
                {showIndividualBreakdown ? "Hide Individual Results" : "Show Individual Results"}
              </button>

              {showIndividualBreakdown && (
                <>
                  {assessmentBreakdown.rows.length === 0 ? (
                    <p style={{ color: "#E8E8E8" }}>
                      No assessment breakdown available for users with both pre and post results.
                    </p>
                  ) : (
                    assessmentBreakdown.rows.map((row) => (
                      <div
                        key={row.username}
                        style={{
                          ...pageStyles.card,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>{row.username}</p>
                          <p style={{ margin: "8px 0 0", color: "#E8E8E8", fontSize: "14px" }}>
                            Pre: {row.prePercentage}% • Post: {row.postPercentage}%
                          </p>
                        </div>
                        <div style={{ minWidth: "70px", textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: 800,
                              color:
                                row.changePercentage > 0
                                  ? "#22c55e"
                                  : row.changePercentage < 0
                                  ? "#ef4444"
                                  : "#fff",
                            }}
                          >
                            {row.changePercentage > 0 ? "+" : ""}
                            {row.changePercentage}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {Object.entries(grouped).map(([location, disasters]) => (
        <div key={location} style={pageStyles.section}>
          <h2 style={{ ...pageStyles.sectionTitle, textAlign: "center" }}>
            {location} Simulations
          </h2>

          <div
            style={{
              display: "flex",
              gap: "clamp(12px, 3vw, 24px)",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Object.entries(disasters).map(([disaster, stats]) => {
              const total = stats.correct + stats.incorrect;
              const validReactionTimes = Array.isArray(stats.reactionTimes)
                ? stats.reactionTimes.filter((rt) => typeof rt === "number" && rt > 0)
                : [];
              const averageReactionTime = validReactionTimes.length
                ? validReactionTimes.reduce((sum, rt) => sum + rt, 0) / validReactionTimes.length
                : null;

              return (
                <div
                  key={disaster}
                  style={cardStyles}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 24px rgba(45,47,98,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 10px 24px rgba(45,47,98,0.12)";
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "16px",
                    }}
                  >
                    {disaster}
                  </h3>

                  {total === 0 ? (
                    <p style={{ color: "#E8E8E8", fontStyle: "italic" }}>
                      No data available
                    </p>
                  ) : (
                    <>
                      <div
                        style={{
                          width: "180px",
                          minWidth: "180px",
                          height: "180px",
                          minHeight: "180px",
                          display: "flex",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <PieChart width={180} height={180}>
                          <Pie
                            data={[
                              { name: "Correct", value: stats.correct },
                              { name: "Incorrect", value: stats.incorrect },
                            ]}
                            dataKey="value"
                            outerRadius={70}
                            innerRadius={45}
                            labelLine={false}
                          >
                            {[
                              { name: "Correct", value: stats.correct },
                              { name: "Incorrect", value: stats.incorrect },
                            ].map((entry, index) => (
                              <Cell key={index} fill={COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>

                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#fff",
                            fontSize: "18px",
                            fontWeight: "700",
                            pointerEvents: "none",
                          }}
                        >
                          {Math.round((stats.correct / total) * 100)}%
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "14px",
                          lineHeight: "1.6",
                        }}
                      >
                        <p style={{ color: "#22c55e" }}>
                          Correct: {stats.correct}
                        </p>
                        <p style={{ color: "#ef4444" }}>
                          Incorrect: {stats.incorrect}
                        </p>
                        <p>Total: {total}</p>
                        <p>
                          Avg. Reaction Time: {averageReactionTime != null ? `${averageReactionTime.toFixed(2)}s` : "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
