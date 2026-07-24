import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUser } from "../api/client";
import { createGroup, getGroups } from "../api/groups";
import { getPersonalLectures, submitLecture } from "../api/lectures";
import UploadLecture from "../components/UploadLecture";

export default function Home() {
  const [groups, setGroups] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const user = getUser();

  async function load() {
    setError("");
    try {
      const [groupData, lectureData] = await Promise.all([getGroups(), getPersonalLectures()]);
      setGroups(groupData);
      setPersonal(lectureData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await createGroup(name.trim());
    setName("");
    load();
  }

  return (
    <main className="page-stack dashboard-page">
      <section className="panel-card dashboard-welcome">
        <p className="eyebrow">Home</p>
        <h1>Welcome{user?.username ? `, ${user.username}` : ""}.</h1>
        <p>Manage your study groups and personal lecture uploads from real saved data.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>

      <section className="split-grid">
        <div className="panel-card">
          <div className="section-title"><p className="eyebrow">My Groups</p><h2>Study groups</h2></div>
          <form className="inline-create" onSubmit={handleCreateGroup}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create a group" />
            <button>Create Group</button>
          </form>
          <div className="course-list">
            {groups.length === 0 ? <div className="empty-state">No groups yet — create one.</div> : groups.map((g) => (
              <Link className="course-row" key={g._id} to={`/groups/${g._id}`}>
                <span className="course-badge">Group</span>
                <div className="row-main"><strong className="truncate">{g.name}</strong><small>Role: {g.role}</small></div>
                {g.newCount > 0 && <span className="new-dot" aria-label="New approved lectures" />}
              </Link>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="section-title"><p className="eyebrow">Personal</p><h2>Personal uploads</h2></div>
          <UploadLecture onUploaded={load} compact />
          <div className="draft-list">
            {personal.length === 0 ? <div className="empty-state">No personal uploads yet — record or upload a lecture.</div> : personal.map((l) => (
              <div className="draft-row" key={l._id}>
                <Link className="truncate" to={`/lectures/${l._id}`}>{l.title}</Link>
                <select defaultValue="" onChange={(e) => e.target.value && submitLecture(l._id, e.target.value).then(load)}>
                  <option value="">Submit to group...</option>
                  {groups.map((g) => <option value={g._id} key={g._id}>{g.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
