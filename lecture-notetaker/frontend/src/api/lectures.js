import { api } from './client';

export const getPersonalLectures = () => api('/lectures/personal');
export const getLecture = (id) => api(`/lectures/${id}`);
export const submitLecture = (id, groupId) => api(`/lectures/${id}/submit`, { method: 'POST', body: JSON.stringify({ groupId }) });
export const approveLecture = (id) => api(`/lectures/${id}/approve`, { method: 'POST' });
export const askLecture = (id, question) => api(`/lectures/${id}/chat`, { method: 'POST', body: JSON.stringify({ question }) });
export const uploadLecture = (form) => api('/lectures', { method: 'POST', body: form });
