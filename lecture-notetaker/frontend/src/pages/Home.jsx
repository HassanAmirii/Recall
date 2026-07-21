import React from "react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getToken } from "../api/client";
import { createGroup, getGroups } from "../api/groups";
import { getPersonalLectures, submitLecture } from "../api/lectures";
import UploadLecture from "../components/UploadLecture";

export default function Home() {
  const [groups, setGroups] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [name, setName] = useState("");
  async function load() {
    setGroups(await getGroups());
    setPersonal(await getPersonalLectures());
  }
  useEffect(() => {
    if (getToken()) load();
  }, []);
  if (!getToken()) return <Navigate to="/auth" />;
  return (
    <main className="page-stack">
      <section className="hero-panel study-hero">
        <div className="hero-copy-card">
          <p className="eyebrow">AI-powered study companion</p>
          <h1>Practice calmly.<span>Review smarter.</span></h1>
          <p className="hero-copy">Turn lectures into structured study sessions, submit polished notes, and get quick feedback that helps you improve without the last-minute stress spiral.</p>
          <div className="hero-actions">
            <a className="button-like cta-glow" href="#vault">Start practice</a>
            <a className="button-like secondary" href="#workflow">See workflow</a>
          </div>
          <div className="stat-strip">
            <div><strong>4-step</strong><span>practice flow</span></div>
            <div><strong>92%</strong><span>ready score</span></div>
            <div><strong>12m</strong><span>review sprint</span></div>
          </div>
        </div>
        <div className="demo-card" aria-label="Practice review improve demo">
          <div className="demo-cursor" />
          <div className="demo-topline"><span className="status-dot" />Live study sprint</div>
          <div className="quiz-card active"><span>01</span><div><strong>Practice</strong><p>Choose your lecture and answer focused recall prompts.</p></div></div>
          <div className="progress-wrap"><div className="progress-fill" /></div>
          <div className="review-grid">
            <div className="mini-card cyan"><small>Submit</small><strong>5 answers</strong></div>
            <div className="mini-card emerald"><small>Review</small><strong>Ready</strong></div>
          </div>
          <div className="next-card"><small>Next step</small><strong>Improve weak topics in a 10 minute session</strong></div>
        </div>
      </section>

      <section className="workflow-grid" id="workflow">
        {["Practice", "Submit", "Review", "Improve"].map((step, i) => <article className="workflow-card" key={step}><span>{`0${i + 1}`}</span><h3>{step}</h3><p>{["Recall key ideas with less friction.", "Move drafts into course workspaces.", "Spot strengths and gaps instantly.", "Plan the next focused sprint."][i]}</p></article>)}
      </section>

      <section className="tabs-shell" id="vault">
        <div className="tabs-header"><span className="tab-active">Enrolled Courses</span><span>Drafts & Personal Notes</span></div>
        <div className="split-grid">
          <div className="panel-card">
            <div className="section-title"><p className="eyebrow">Groups</p><h2>Enrolled Courses</h2></div>
            <form className="inline-create" onSubmit={async (e) => { e.preventDefault(); await createGroup(name); setName(""); load(); }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New course workspace" />
              <button className="cta-glow">Create Group</button>
            </form>
            <div className="course-list">
              {groups.map((g) => (
                <Link className="course-row" key={g._id} to={`/groups/${g._id}`}>
                  <span className="course-badge">{g.name?.slice(0, 6) || "COURSE"}</span>
                  <div className="row-main"><strong className="truncate">{g.name}</strong><small>Role: {g.role}</small></div>
                  {g.newCount > 0 && <span className="new-dot" aria-label={`${g.newCount} new lectures`} />}
                </Link>
              ))}
            </div>
          </div>
          <div className="panel-card">
            <div className="section-title"><p className="eyebrow">Vault</p><h2>Drafts & Personal Notes</h2></div>
            <UploadLecture onUploaded={load} compact />
            <div className="draft-list">
              {personal.map((l) => (
                <div className="draft-row" key={l._id}>
                  <Link className="truncate" to={`/lectures/${l._id}`}>{l.title}</Link>
                  <select onChange={(e) => e.target.value && submitLecture(l._id, e.target.value).then(load)}>
                    <option value="">Submit to group...</option>
                    {groups.map((g) => <option value={g._id} key={g._id}>{g.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="social-grid">
        <article className="testimonial-card"><p>“Recall makes review feel manageable. I know what to practice next instead of rereading everything.”</p><strong>Amira · Biology student</strong></article>
        <article className="faq-card"><details open><summary>How does Recall reduce study stress?</summary><p>It keeps the loop simple: capture lectures, practice active recall, review feedback, then improve one topic at a time.</p></details><details><summary>Can I use it with course groups?</summary><p>Yes. Submit personal notes into groups and keep approved lectures organized for classmates.</p></details></article>
      </section>
    </main>
  );
}
