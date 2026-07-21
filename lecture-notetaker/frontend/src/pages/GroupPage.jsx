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
  async function load() {
    const group = await getGroup(groupId);
    setData(group);
    if (group.role === "admin") setPending(await getPending(groupId));
  }
  useEffect(() => {
    load();
  }, [groupId]);
  if (!data) return <main>Loading...</main>;
  return (
    <main>
      <h2>{data.group.name}</h2>
      {data.role === "admin" && (
        <section className="grid">
          <UploadLecture groupId={groupId} onUploaded={load} />
          <div className="card">
            <h3>Settings</h3>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={() => addUser(groupId, username, "member").then(load)}
            >
              Add member
            </button>
            <button
              onClick={() => addUser(groupId, username, "admin").then(load)}
            >
              Add admin
            </button>
          </div>
          <div className="card">
            <h3>Pending submissions</h3>
            {pending.map((l) => (
              <p key={l._id}>
                {l.title} by {l.uploadedBy?.username}
                <button onClick={() => approveLecture(l._id).then(load)}>
                  Approve
                </button>
              </p>
            ))}
          </div>
        </section>
      )}
      <h3>Approved Lectures</h3>
      {data.lectures.map((l) => (
        <Link className="card" key={l._id} to={`/lectures/${l._id}`}>
          <h3>{l.title}</h3>
          <p>
            {l.courseTag} • {new Date(l.createdAt).toLocaleString()}
          </p>
        </Link>
      ))}
    </main>
  );
}
