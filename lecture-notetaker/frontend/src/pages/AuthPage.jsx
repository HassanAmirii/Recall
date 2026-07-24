import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setToken, setUser } from "../api/client";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => setMode(initialMode), [initialMode]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = mode === "register" ? form : { email: form.email, password: form.password };
      const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify(payload) });
      setToken(data.token);
      setUser(data.user);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-value">
        <Link to="/" className="brand" aria-label="Recall home">
          <span className="brand-mark">R</span>
          <span className="brand-copy">Recall<span>Lecture notes that stay useful</span></span>
        </Link>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Study from your real lectures.</h1>
          <p>Record or upload class audio, keep structured notes, chat through confusing parts, and share lecture material with your groups.</p>
        </div>
      </section>
      <section className="auth-panel">
        <form className="card" onSubmit={submit}>
          <h2>{mode === "login" ? "Login" : "Create your account"}</h2>
          {mode === "register" && (
            <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></label>
          )}
          <label>Email<input value={form.email} placeholder="you@example.com" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input value={form.password} type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}</button>
          <button className="secondary" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account? Register" : "Already have an account? Login"}</button>
        </form>
      </section>
    </main>
  );
}
