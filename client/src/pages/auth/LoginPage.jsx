import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      nav("/");
    } catch (e2) {
      setErr(e2?.message || "Action failed");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>

        <form onSubmit={onSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          <button type="submit" style={styles.button}>
            {mode === "login" ? "Login" : "Create account"}
          </button>

          <div style={styles.divider} />

          <button
            type="button"
            onClick={() => {
              setErr("");
              setMsg("");
              setMode(mode === "login" ? "signup" : "login");
            }}
            style={styles.secondaryBtn}
          >
            {mode === "login" ? "Create an account" : "Back to login"}
          </button>

          {msg && <div style={styles.success}>{msg}</div>}
          {err && <div style={styles.error}>{err}</div>}
        </form>
      </div>
    </div>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 380,
    background: "#e5e5e5",
    borderRadius: 24,
    padding: "32px 28px",
    boxShadow: "0 0 0 2px #39ff14",
  },
  title: {
    marginBottom: 24,
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    color: "#000",
  },
  form: {
    display: "grid",
    gap: 14,
  },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #bbb",
    fontSize: 15,
    outline: "none",
  },
  button: {
    marginTop: 10,
    padding: "14px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    background: "#000",
    color: "#39ff14",
    cursor: "pointer",
  },
  error: {
    marginTop: 10,
    color: "crimson",
    fontSize: 14,
    textAlign: "center",
  },
};
