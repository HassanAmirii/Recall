import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addUser, getGroup, getPending } from "../api/groups";
import { approveLecture } from "../api/lectures";
import UploadLecture from "../components/UploadLecture";

export default function GroupPage() {
  const { groupId } = useParams();
  const [data, setData] = useState(null);
  const [pending, setPending] = useState([]);
  const [username, setUsername] = useState("");
  async function load() { const group = await getGroup(groupId); setData(group); if (group.role === "admin") setPending(await getPending(groupId)); }
  useEffect(() => { load(); }, [groupId]);
  if (!data) return <main className="loading-state">Loading course...</main>;
  return (
    <main className="page-stack">
      <section className="hero-panel"><div><p className="eyebrow">Course Workspace</p><h1>{data.group.name}</h1><p className="hero-copy">Approved lectures, submissions, and member controls in one focused surface.</p></div></section>
      {data.role === "admin" && <section className="admin-grid">
        <UploadLecture groupId={groupId} onUploaded={load} />
        <div className="panel-card" id="settings"><div className="section-title"><p className="eyebrow">Settings</p><h2>Members</h2></div><input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} /><div className="button-row"><button onClick={() => addUser(groupId, username, "member").then(load)}>Add member</button><button className="secondary" onClick={() => addUser(groupId, username, "admin").then(load)}>Add admin</button></div></div>
        <div className="panel-card queue-card"><div className="section-title"><p className="eyebrow">Admin Queue</p><h2>Pending Submissions</h2></div>{pending.map((l) => <div className="queue-row" key={l._id}><div><strong className="truncate">{l.title}</strong><small>by {l.uploadedBy?.username}</small></div><div className="queue-actions"><button className="approve" onClick={() => approveLecture(l._id).then(load)}>✓</button><button className="reject">×</button></div></div>)}</div>
      </section>}
      <section className="panel-card"><div className="section-title"><p className="eyebrow">Library</p><h2>Approved Lectures</h2></div><div className="course-list">{data.lectures.map((l) => <Link className="course-row" key={l._id} to={`/lectures/${l._id}`}><span className="course-badge">{l.courseTag || "NOTE"}</span><div className="row-main"><strong className="truncate">{l.title}</strong><small>{new Date(l.createdAt).toLocaleString()}</small></div></Link>)}</div></section>
    </main>
  );
}
