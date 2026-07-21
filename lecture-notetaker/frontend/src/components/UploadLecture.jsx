import { useState } from 'react';
import { uploadLecture } from '../api/lectures';

export default function UploadLecture({ groupId, onUploaded }) {
  const [title, setTitle] = useState('');
  const [courseTag, setCourseTag] = useState('');
  const [audio, setAudio] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    const form = new FormData();
    form.append('title', title); form.append('courseTag', courseTag); form.append('audio', audio);
    if (groupId) form.append('groupId', groupId);
    await uploadLecture(form); setTitle(''); setCourseTag(''); setAudio(null); onUploaded?.(); setBusy(false);
  }
  return <form className="card" onSubmit={submit}>
    <h3>{groupId ? 'Admin upload to group' : 'Personal upload'}</h3>
    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" required />
    <input value={courseTag} onChange={(e) => setCourseTag(e.target.value)} placeholder="Course tag" />
    <input type="file" accept="audio/mp3,audio/wav,audio/m4a,audio/*" onChange={(e) => setAudio(e.target.files[0])} required />
    <button disabled={busy}>{busy ? 'Processing...' : 'Upload'}</button>
  </form>;
}
