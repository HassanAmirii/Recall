import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import LecturePage from './pages/LecturePage';
import AuthPage from './pages/AuthPage';
import UploadLecture from './components/UploadLecture';
import './styles/app.css';

function Icon({ name }) {
  const paths = {
    groups: 'M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5v-9Zm4 1.5h8M8 13h5',
    vault: 'M6 9V7a6 6 0 1 1 12 0v2M5 9h14v11H5V9Zm7 4v3',
    settings: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m13 0-1.4-1.4M6.9 6.9 5.5 5.5',
    plus: 'M12 5v14m-7-7h14',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Shell({ children }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const location = useLocation();
  if (location.pathname === '/auth') return children;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Lecture Notetaker home">
          <span className="brand-mark">L</span><span className="brand-copy">Lecture<br />Notetaker</span>
        </Link>
        <button className="new-recording" onClick={() => setUploadOpen(true)}><Icon name="plus" />New Recording</button>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link to="/"><Icon name="groups" />My Groups</Link>
          <Link to="/"><Icon name="vault" />Personal Vault</Link>
          <a href="#settings"><Icon name="settings" />Settings</a>
        </nav>
        <div className="profile-badge"><span>LN</span><div><strong>Student workspace</strong><small>Premium notes</small></div></div>
      </aside>
      <div className="content-frame">{children}</div>
      {uploadOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="New recording"><div className="modal-card"><button className="modal-close" onClick={() => setUploadOpen(false)}>×</button><UploadLecture onUploaded={() => setUploadOpen(false)} recordingMode /></div></div>}
    </div>
  );
}

function App() {
  return <BrowserRouter><Shell><Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<Home />} />
    <Route path="/groups/:groupId" element={<GroupPage />} />
    <Route path="/lectures/:lectureId" element={<LecturePage />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></Shell></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App />);
