import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { askLecture, getLecture } from "../api/lectures";

export default function LecturePage() {
  const { lectureId } = useParams();
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState("");
  async function load() { setData(await getLecture(lectureId)); }
  useEffect(() => { load(); }, [lectureId]);
  async function ask(e) { e.preventDefault(); const chatThread = await askLecture(lectureId, question); setData({ ...data, chatThread }); setQuestion(""); }
  if (!data) return <main className="loading-state">Loading workspace...</main>;
  const notes = data.lecture.structuredNotes?.headings || [];
  return (
    <main className="lecture-workspace">
      <section className="notes-doc">
        <p className="eyebrow">Structured Notes</p>
        <h1 className="truncate">{data.lecture.title}</h1>
        <div className="doc-meta"><span>{data.lecture.courseTag || "UNTAGGED"}</span><span>{data.lecture.createdAt && new Date(data.lecture.createdAt).toLocaleString()}</span></div>
        {notes.map((h, i) => (
          <article className="note-block" key={i}>
            <h2>{h.title}</h2>
            <ul>{h.keyPoints?.map((p, j) => <li key={j}>{p}</li>)}</ul>
            {h.examples?.length > 0 && <blockquote><strong>Examples</strong><span>{h.examples.join(", ")}</span></blockquote>}
          </article>
        ))}
      </section>
      <aside className="ai-panel">
        <div className="ai-header"><p className="eyebrow">Personal AI</p><h2>Chat Panel</h2></div>
        <div className="chat-thread">
          {data.chatThread.messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}><span>{m.role}</span><p>{m.content}</p></div>
          ))}
        </div>
        <form className="chat-input" onSubmit={ask}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a follow-up" required />
          <button disabled={!question.trim()}>Ask</button>
        </form>
      </aside>
    </main>
  );
}
