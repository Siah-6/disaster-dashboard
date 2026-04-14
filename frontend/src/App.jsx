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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <h1>Loading...</h1>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Disaster Simulation Dashboard</h1>

      {Object.entries(grouped).map(([location, disasters]) => (
        <div key={location} style={styles.section}>
          <h2 style={styles.sectionTitle}>{location} Simulations</h2>

          <div style={styles.cardContainer}>
            {Object.entries(disasters).map(([disaster, stats]) => {
              const total = stats.correct + stats.incorrect;

              return (
                <div key={disaster} style={styles.card}>
                  <h3>{disaster}</h3>

                  {total === 0 ? (
                    <p>No available data</p>
                  ) : (
                    <>
                      <div style={{ width: "100%", height: 200 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Correct", value: stats.correct },
                                { name: "Incorrect", value: stats.incorrect },
                              ]}
                              dataKey="value"
                              outerRadius={60}
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
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    backgroundColor: "#0f172a",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "32px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    marginBottom: "16px",
    textAlign: "center",
  },
  cardContainer: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "16px",
    minWidth: "200px",
    minHeight: "300px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
};

export default App;