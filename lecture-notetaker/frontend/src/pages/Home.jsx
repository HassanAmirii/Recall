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
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Command Center</p>
          <h1>Your lecture intelligence, organized.</h1>
          <p className="hero-copy">Review approved group lectures, upload private drafts, and submit polished notes to course workspaces.</p>
        </div>
        <form className="inline-create" onSubmit={async (e) => { e.preventDefault(); await createGroup(name); setName(""); load(); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name" />
          <button>Create Group</button>
        </form>
      </section>

      <section className="tabs-shell">
        <div className="tabs-header"><span className="tab-active">Enrolled Courses</span><span>Drafts & Personal Notes</span></div>
        <div className="split-grid">
          <div className="panel-card">
            <div className="section-title"><p className="eyebrow">Groups</p><h2>Enrolled Courses</h2></div>
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
    </main>
  );
}
