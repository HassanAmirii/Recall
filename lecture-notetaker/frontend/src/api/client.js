const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("lecture-token");
}
export function setToken(token) {
  localStorage.setItem("lecture-token", token);
}
export function clearToken() {
  localStorage.removeItem("lecture-token");
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok)
    throw new Error((await response.json()).message || "Request failed");
  if (response.status === 204) return null;
  return response.json();
}
