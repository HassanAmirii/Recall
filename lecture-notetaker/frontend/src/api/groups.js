import { api } from './client';
export const getGroups = () => api('/groups');
export const createGroup = (name) => api('/groups', { method: 'POST', body: JSON.stringify({ name }) });
export const getGroup = (id) => api(`/groups/${id}`);
export const addUser = (groupId, username, role) => api(`/groups/${groupId}/users`, { method: 'POST', body: JSON.stringify({ username, role }) });
export const getPending = (groupId) => api(`/groups/${groupId}/pending`);
