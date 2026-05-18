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
const COLORS = ["#22c55e", "#ef4444"];

const cardStyles = {
  backgroundColor: "#1e293b",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "16px",
  padding: "clamp(16px, 4vw, 20px) clamp(14px, 3vw, 18px)",
  width: "clamp(160px, 45vw, 220px)",
  minHeight: "clamp(280px, 70vw, 320px)",
  maxWidth: "100%",
  boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  transition: "all 0.2s ease",
  cursor: "pointer",
};

export default function Dashboard() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const simulations = Object.entries(grouped).flatMap(([location, disasters]) =>
    Object.entries(disasters)
      .map(([disaster, stats]) => {
        const total = stats.correct + stats.incorrect;
        return {
          location,
          disaster,
          correct: stats.correct,
          incorrect: stats.incorrect,
          total,
          accuracy: total ? stats.correct / total : 0,
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
    .sort((a, b) => b.incorrect - a.incorrect)
    .slice(0, 5);

  const topCorrectSimulations = [...simulations]
    .sort((a, b) => b.correct - a.correct)
    .slice(0, 5);

  if (loading) return <h1 style={{ textAlign: "center" }}>Loading...</h1>;

  return (
    <div style={pageStyles.wideContainer}>
      <h1 style={pageStyles.title}>Disaster Simulation Dashboard</h1>
      <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "24px" }}>
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
          <div style={pageStyles.card}>
            <p style={{ margin: 0, opacity: 0.75 }}>Total Correct</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalCorrect}
            </p>
          </div>
          <div style={pageStyles.card}>
            <p style={{ margin: 0, opacity: 0.75 }}>Total Incorrect</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalIncorrect}
            </p>
          </div>
          <div style={pageStyles.card}>
            <p style={{ margin: 0, opacity: 0.75 }}>Total Responses</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 700 }}>
              {totalResponses}
            </p>
          </div>
          <div style={pageStyles.card}>
            <p style={{ margin: 0, opacity: 0.75 }}>Average Accuracy</p>
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
            <p style={{ opacity: 0.75 }}>No simulations with errors yet.</p>
          ) : (
            topErrorSimulations.map((sim) => (
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
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {sim.location} / {sim.disaster}
                  </p>
                  <p style={{ margin: "6px 0 0", opacity: 0.75, fontSize: "14px" }}>
                    Incorrect: {sim.incorrect} • Total: {sim.total}
                  </p>
                </div>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#ef4444" }}>
                  {sim.incorrect}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={pageStyles.section}>
        <h2 style={pageStyles.sectionTitle}>Top Correct Simulations</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          {topCorrectSimulations.length === 0 ? (
            <p style={{ opacity: 0.75 }}>No correct simulation data yet.</p>
          ) : (
            topCorrectSimulations.map((sim) => (
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
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {sim.location} / {sim.disaster}
                  </p>
                  <p style={{ margin: "6px 0 0", opacity: 0.75, fontSize: "14px" }}>
                    Correct: {sim.correct} • Total: {sim.total}
                  </p>
                </div>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#22c55e" }}>
                  {sim.correct}
                </span>
              </div>
            ))
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

              return (
                <div
                  key={disaster}
                  style={cardStyles}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.04)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 18px rgba(0,0,0,0.25)";
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      marginBottom: "16px",
                    }}
                  >
                    {disaster}
                  </h3>

                  {total === 0 ? (
                    <p style={{ opacity: 0.5, fontStyle: "italic" }}>
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
