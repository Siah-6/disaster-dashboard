import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LOCATIONS = ["SCHOOL", "OFFICE", "HOUSE", "OUTDOOR"];
const DISASTERS = ["FIRE", "FLOOD", "EARTHQUAKE"];
const COLORS = ["#22c55e", "#ef4444"];

function App() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          "https://disastervr-backend.onrender.com/api/decisions"
        );
        const data = await res.json();
        const decisions = data.decisions || [];

        const result = {};

        // initialize all locations + all disasters
        LOCATIONS.forEach((location) => {
          result[location] = {};
          DISASTERS.forEach((disaster) => {
            result[location][disaster] = {
              correct: 0,
              incorrect: 0,
            };
          });
        });

        // fill real values
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

  if (loading) return <h1>Loading...</h1>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Disaster Simulation Dashboard</h1>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "24px" }}>
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
        </p>

      {Object.entries(grouped).map(([location, disasters]) => (
        <div key={location} style={styles.section}>
          <h2 style={styles.sectionTitle}>{location} Simulations</h2>

          <div style={styles.cardContainer}>
            {Object.entries(disasters).map(([disaster, stats]) => {
              const total = stats.correct + stats.incorrect;

              return (
                <div
                  key={disaster}
                  style={styles.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.04)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.25)";
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>
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
                          width: "100%",
                          height: 220,
                          display: "flex",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <ResponsiveContainer>
                          <PieChart>
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
                        </ResponsiveContainer>

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

                      <div style={{ marginTop: "8px", fontSize: "14px", lineHeight: "1.6" }}>
                        <p style={{ color: "#22c55e" }}>Correct: {stats.correct}</p>
                        <p style={{ color: "#ef4444" }}>Incorrect: {stats.incorrect}</p>
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
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(135deg, #0f172a, #020617)",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "40px",
    fontSize: "56px",
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  section: {
    marginBottom: "50px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "20px",
  },
  sectionTitle: {
    marginBottom: "18px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "700",
  },
  cardContainer: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "16px",
    padding: "20px 18px",
    width: "220px",
    minHeight: "320px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
};

export default App; 