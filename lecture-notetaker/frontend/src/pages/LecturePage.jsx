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

  // PDF Download Function - Captures real visible DOM
  const downloadPDF = async () => {
    if (!data || !notesRef.current) return;

    setIsDownloading(true);

    try {
      console.log("📊 PDF Generation - Capturing visible DOM...");
      console.log(
        "📊 Notes ref content length:",
        notesRef.current.innerHTML.length,
      );

      const opt = {
        margin: 10,
        filename: `${data.lecture.title || "lecture-notes"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      };

      await html2pdf().set(opt).from(notesRef.current).save();
      console.log("✅ PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!data) return <main className="loading-state">Loading workspace...</main>;

  const notes = data.lecture.structuredNotes?.headings || [];
  const structuredNotes = data.lecture.structuredNotes || {};

  return (
    <main className="lecture-workspace">
      <section className="notes-doc">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <p className="eyebrow">Structured Notes</p>
            <h1 className="truncate">{data.lecture.title}</h1>
          </div>
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className="download-pdf-btn"
          >
            {isDownloading ? "⏳ Generating..." : "📄 Download PDF"}
          </button>
        </div>

        {/* PDF Content - Everything inside this div gets captured */}
        <div ref={notesRef}>
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
                  <strong>💡 Examples</strong>
                  <ul style={{ marginTop: "4px", paddingLeft: "20px" }}>
                    {h.examples.map((ex, k) => (
                      <li key={k}>{ex}</li>
                    ))}
                  </ul>
                </blockquote>
              )}
              {h.definitions?.length > 0 && (
                <div className="definition-list">
                  <strong>📖 Key Terms</strong>
                  {h.definitions.map((d, k) => (
                    <p key={k}>
                      <strong>{d.term}:</strong> {d.definition}
                    </p>
                  ))}
                </div>
              )}
            </article>
          ))}

          {structuredNotes.keyTerms?.length > 0 && (
            <article
              className="note-block"
              style={{ borderTop: "2px solid #e2e8f0", paddingTop: "16px" }}
            >
              <h2>📖 Key Terms</h2>
              {structuredNotes.keyTerms.map((kt, i) => (
                <p key={i}>
                  <strong>{kt.term}:</strong> {kt.definition}
                </p>
              ))}
            </article>
          )}
        </div>
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
