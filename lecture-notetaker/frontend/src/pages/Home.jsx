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
    <main>
      <section>
        <h2>My Groups</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createGroup(name);
            setName("");
            load();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New group name"
          />
          <button>Create Group</button>
        </form>
        <div className="grid">
          {groups.map((g) => (
            <Link className="card" key={g._id} to={`/groups/${g._id}`}>
              <h3>{g.name}</h3>
              <p>Role: {g.role}</p>
              {g.newCount > 0 && <b className="badge">{g.newCount} new</b>}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>Personal</h2>
        <UploadLecture onUploaded={load} />
        {personal.map((l) => (
          <div className="card" key={l._id}>
            <Link to={`/lectures/${l._id}`}>{l.title}</Link>
            <select
              onChange={(e) =>
                e.target.value &&
                submitLecture(l._id, e.target.value).then(load)
              }
            >
              <option value="">Submit to group...</option>
              {groups.map((g) => (
                <option value={g._id} key={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>
    </main>
  );
}
