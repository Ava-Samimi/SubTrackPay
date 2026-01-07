import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 380, padding: "32px 28px" }}>
        <h2 style={{ marginBottom: 24, textAlign: "center" }}>Sign in</h2>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="submit">Login</button>

          {err && <div style={{ color: "crimson", textAlign: "center" }}>{err}</div>}
        </form>
      </div>
    </div>
  );
}
