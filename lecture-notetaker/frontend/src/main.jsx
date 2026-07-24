import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import GroupPage from './pages/GroupPage';
import LecturePage from './pages/LecturePage';
import AuthPage from './pages/AuthPage';
import UploadLecture from './components/UploadLecture';
import { clearToken, getToken } from './api/client';
import './styles/app.css';

function Icon({ name }) {
  const paths = {
    groups: 'M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 16.5v-9Zm4 1.5h8M8 13h5',
    vault: 'M6 9V7a6 6 0 1 1 12 0v2M5 9h14v11H5V9Zm7 4v3',
    plus: 'M12 5v14m-7-7h14',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function Shell({ children }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isPublic = location.pathname === '/' || location.pathname === '/login';

  if (isPublic) return <div className="theme-light public-shell">{children}</div>;

  function logout() {
    clearToken();
    navigate('/');
  }

  return (
    <div className="app-shell theme-light">
      <header className="topbar">
        <Link to="/home" className="brand" aria-label="Recall home">
          <span className="brand-mark">R</span><span className="brand-copy">Recall<span>AI study companion</span></span>
        </Link>
        <nav className="side-nav" aria-label="Primary navigation">
          <Link to="/home"><Icon name="groups" />My Groups</Link>
          <Link to="/home"><Icon name="vault" />Personal</Link>
        </nav>
        <div className="top-actions">
          <button className="secondary" onClick={logout}>Logout</button>
          <button className="new-recording" onClick={() => setUploadOpen(true)}><Icon name="plus" />New Recording</button>
        </div>
      </header>
      <div className="content-frame">{children}</div>
      {uploadOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="New recording"><div className="modal-card"><button className="modal-close" onClick={() => setUploadOpen(false)}>×</button><UploadLecture onUploaded={() => setUploadOpen(false)} recordingMode /></div></div>}
    </div>
  );
}

function App() {
  return <BrowserRouter><Shell><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
    <Route path="/groups/:groupId" element={<RequireAuth><GroupPage /></RequireAuth>} />
    <Route path="/lectures/:lectureId" element={<RequireAuth><LecturePage /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Shell></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App />);
