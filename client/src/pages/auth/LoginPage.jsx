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
      nav("/"); // go to app
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
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
        <button type="submit">Sign in</button>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>
    </div>
  );
}
