import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="public-page">
      <header className="public-nav">
        <Link to="/" className="brand" aria-label="Recall home">
          <span className="brand-mark">R</span>
          <span className="brand-copy">Recall<span>Lecture notes that stay useful</span></span>
        </Link>
        <nav className="auth-links" aria-label="Account actions">
          <Link className="button-like secondary" to="/login">Login</Link>
          <Link className="button-like" to="/login?mode=register">Sign Up</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">AI study workspace</p>
          <h1>Turn lectures into shared understanding.</h1>
          <p>
            Recall helps students record or upload lectures, transform them into structured notes,
            ask follow-up questions when something is unclear, and share approved material with
            study groups so everyone can review from the same source.
          </p>
          <div className="hero-actions">
            <Link className="button-like" to="/login?mode=register">Create an account</Link>
            <Link className="button-like secondary" to="/login">Login</Link>
          </div>
        </div>
        <div className="flow-card" aria-label="Recall app workflow">
          <div className="flow-step"><span>Record or upload</span><p>Capture lecture audio from class or add an existing file.</p></div>
          <div className="flow-arrow" aria-hidden="true">→</div>
          <div className="flow-step"><span>Structured notes</span><p>Review organized sections, key points, and study-ready summaries.</p></div>
          <div className="flow-arrow" aria-hidden="true">→</div>
          <div className="flow-step"><span>Chat and share</span><p>Ask questions and submit useful notes to your study groups.</p></div>
        </div>
      </section>
    </main>
  );
}
