import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Checking backend...");
  const [error, setError] = useState("");

  useEffect(() => {
    // Call your backend API
    fetch("http://localhost:4000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message || "Backend responded, but no message field");
      })
      .catch((err) => {
        console.error(err);
        setError("Could not reach backend. Is it running?");
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f4ff"
      }}
    >
      <div
        style={{
          background: "white",
          padding: "2rem 2.5rem",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
          maxWidth: "420px"
        }}
      >
        <h1 style={{ marginBottom: "1rem", color: "#7b2cbf" }}>
          OwanbePal – Test Dashboard
        </h1>
        <p style={{ fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Frontend is talking to the backend.
        </p>

        {error ? (
          <div
            style={{
              background: "#ffe5e5",
              color: "#b00020",
              padding: "0.75rem",
              borderRadius: "8px",
              fontSize: "0.9rem"
            }}
          >
            {error}
          </div>
        ) : (
          <div
            style={{
              background: "#e5f9f0",
              color: "#004d40",
              padding: "0.75rem",
              borderRadius: "8px",
              fontSize: "0.95rem"
            }}
          >
            {message}
          </div>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#666" }}>
          Backend URL: <code>http://localhost:4000/api/health</code>
        </p>
      </div>
    </div>
  );
}

export default App;
