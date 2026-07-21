import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api/client';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();
  async function submit(e) { e.preventDefault(); const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) }); setToken(data.token); navigate('/'); }
  return <main className="narrow"><form className="card" onSubmit={submit}><h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>
    {mode === 'register' && <input placeholder="Username" onChange={(e) => setForm({ ...form, username: e.target.value })} required />}
    <input placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
    <input placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
    <button>{mode}</button><button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>Switch mode</button>
  </form></main>;
}
