import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import LecturePage from './pages/LecturePage';
import AuthPage from './pages/AuthPage';
import './styles/app.css';

function App() {
  return <BrowserRouter><header><Link to="/"><h1>Lecture Notetaker</h1></Link></header><Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={<Home />} />
    <Route path="/groups/:groupId" element={<GroupPage />} />
    <Route path="/lectures/:lectureId" element={<LecturePage />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></BrowserRouter>;
}

createRoot(document.getElementById('root')).render(<App />);
