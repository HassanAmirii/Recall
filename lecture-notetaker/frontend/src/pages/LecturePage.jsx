import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { askLecture, getLecture } from "../api/lectures";

export default function LecturePage() {
  const { lectureId } = useParams();
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState("");
  async function load() {
    setData(await getLecture(lectureId));
  }
  useEffect(() => {
    load();
  }, [lectureId]);
  async function ask(e) {
    e.preventDefault();
    const chatThread = await askLecture(lectureId, question);
    setData({ ...data, chatThread });
    setQuestion("");
  }
  if (!data) return <main>Loading...</main>;
  const notes = data.lecture.structuredNotes?.headings || [];
  return (
    <main className="two-col">
      <section className="card">
        <h2>{data.lecture.title}</h2>
        {notes.map((h, i) => (
          <article key={i}>
            <h3>{h.title}</h3>
            <ul>
              {h.keyPoints?.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
            <p>
              <b>Examples:</b> {h.examples?.join(", ")}
            </p>
          </article>
        ))}
      </section>
      <aside className="card">
        <h2>Personal AI Chat</h2>
        <div className="chat">
          {data.chatThread.messages.map((m, i) => (
            <p key={i} className={m.role}>
              <b>{m.role}:</b> {m.content}
            </p>
          ))}
        </div>
        <form onSubmit={ask}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a follow-up"
            required
          />
          <button>Ask</button>
        </form>
      </aside>
    </main>
  );
}
