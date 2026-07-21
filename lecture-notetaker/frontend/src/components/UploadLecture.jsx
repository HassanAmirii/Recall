import React, { useState } from "react";

import { uploadLecture } from "../api/lectures";

export default function UploadLecture({ groupId, onUploaded, compact = false, recordingMode = false }) {
  const [title, setTitle] = useState("");
  const [courseTag, setCourseTag] = useState("");
  const [audio, setAudio] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData();
    form.append("title", title);
    form.append("courseTag", courseTag);
    form.append("audio", audio);
    if (groupId) form.append("groupId", groupId);
    await uploadLecture(form);
    setTitle(""); setCourseTag(""); setAudio(null); onUploaded?.(); setBusy(false);
  }
  return (
    <form className={`upload-card ${compact ? "compact" : ""}`} onSubmit={submit}>
      <div className="recording-visual"><div className="pulse-ring"><span>{busy ? "•••" : "REC"}</span></div><div><p className="eyebrow">{groupId ? "Admin Upload" : "Personal Capture"}</p><h3>{recordingMode ? "New Recording" : groupId ? "Upload to group" : "Personal upload"}</h3></div></div>
      {busy && <div className="chunk-progress" aria-label="Processing audio chunks">{Array.from({ length: 8 }).map((_, i) => <span key={i} />)}</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" required />
      <input value={courseTag} onChange={(e) => setCourseTag(e.target.value)} placeholder="Course tag" />
      <label className="file-drop"><input type="file" accept="audio/mp3,audio/wav,audio/m4a,audio/*" onChange={(e) => setAudio(e.target.files[0])} required /> <span className="truncate">{audio?.name || "Drop or choose an audio file"}</span></label>
      <button disabled={busy}>{busy ? "Processing..." : "Upload"}</button>
    </form>
  );
}
