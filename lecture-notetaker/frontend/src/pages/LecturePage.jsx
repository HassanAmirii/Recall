import React from "react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import html2pdf from "html2pdf.js";
import { askLecture, getLecture } from "../api/lectures";

export default function LecturePage() {
  const { lectureId } = useParams();
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const notesRef = useRef(null);

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

  // PDF Download Function
  const downloadPDF = async () => {
    if (!notesRef.current) return;

    setIsDownloading(true);
    try {
      const element = notesRef.current;
      const opt = {
        margin: 10,
        filename: `${data?.lecture?.title || "lecture-notes"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!data) return <main className="loading-state">Loading workspace...</main>;

  const notes = data.lecture.structuredNotes?.headings || [];
  const structuredNotes = data.lecture.structuredNotes || {};

  return (
    <main className="lecture-workspace">
      {/* PDF Content - Hidden but used for download */}
      <div ref={notesRef} style={{ display: "none" }}>
        <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
          <h1 style={{ fontSize: "24px", color: "#1e293b" }}>
            {data.lecture.title || "Lecture Notes"}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            {data.lecture.courseTag || "Untagged"} |{" "}
            {new Date(data.lecture.createdAt).toLocaleDateString()}
          </p>

          {structuredNotes.summary && (
            <div style={{ marginTop: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#2563eb" }}>📚 Summary</h2>
              <p>{structuredNotes.summary}</p>
            </div>
          )}

          {structuredNotes.learningObjectives?.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#2563eb" }}>
                🎯 Learning Objectives
              </h2>
              <ul>
                {structuredNotes.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {notes.map((h, i) => (
            <div key={i} style={{ marginTop: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#1e293b" }}>{h.title}</h2>
              <ul>
                {h.keyPoints?.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
              {h.examples?.length > 0 && (
                <div>
                  <strong>Examples:</strong>
                  <ul>
                    {h.examples.map((ex, k) => (
                      <li key={k}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
              {h.definitions?.length > 0 && (
                <div>
                  <strong>Key Terms:</strong>
                  <ul>
                    {h.definitions.map((d, k) => (
                      <li key={k}>
                        <strong>{d.term}:</strong> {d.definition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {structuredNotes.actionItems?.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#2563eb" }}>
                ✅ Action Items
              </h2>
              <ul>
                {structuredNotes.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="notes-doc">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p className="eyebrow">Structured Notes</p>
            <h1 className="truncate">{data.lecture.title}</h1>
          </div>
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isDownloading ? "⏳ Downloading..." : "📄 Download PDF"}
          </button>
        </div>

        <div className="doc-meta">
          <span>{data.lecture.courseTag || "UNTAGGED"}</span>
          <span>
            {data.lecture.createdAt &&
              new Date(data.lecture.createdAt).toLocaleString()}
          </span>
        </div>

        {data.lecture.lectureContext && (
          <div className="context-note">
            <strong>Parser context</strong>
            <p>{data.lecture.lectureContext}</p>
          </div>
        )}

        {structuredNotes.summary && (
          <div className="context-note">
            <strong>📚 Summary</strong>
            <p>{structuredNotes.summary}</p>
          </div>
        )}

        {structuredNotes.learningObjectives?.length > 0 && (
          <article className="note-block">
            <h2>🎯 Learning Objectives</h2>
            <ul>
              {structuredNotes.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </article>
        )}

        {structuredNotes.actionItems?.length > 0 && (
          <article className="note-block">
            <h2>✅ Action Items</h2>
            <ul>
              {structuredNotes.actionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </article>
        )}

        {notes.map((h, i) => (
          <article className="note-block" key={i}>
            <h2>{h.title}</h2>
            <ul>
              {h.keyPoints?.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
            {h.examples?.length > 0 && (
              <blockquote>
                <strong>Examples</strong>
                <span>{h.examples.join(", ")}</span>
              </blockquote>
            )}
            {h.definitions?.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <strong>Key Terms:</strong>
                {h.definitions.map((d, k) => (
                  <p key={k}>
                    <strong>{d.term}:</strong> {d.definition}
                  </p>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <aside className="ai-panel">
        <div className="ai-header">
          <p className="eyebrow">Personal AI</p>
          <h2>Chat Panel</h2>
        </div>

        <div className="chat-thread">
          {data.chatThread.messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <span>{m.role}</span>
              {m.role === "user" ? (
                <p>{m.content}</p>
              ) : (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              )}
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={ask}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a follow-up"
            required
          />
          <button disabled={!question.trim()}>Ask</button>
        </form>
      </aside>
    </main>
  );
}
