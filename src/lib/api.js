import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const setToken = (t) => {
  if (t) {
    localStorage.setItem("amici_token", t);
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  } else {
    localStorage.removeItem("amici_token");
    delete api.defaults.headers.common["Authorization"];
  }
};

const saved = localStorage.getItem("amici_token");
if (saved) api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;

export const mediaUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http") || u.startsWith("data:")) return u;
  return `${BACKEND_URL}${u}`;
};

export const getContent = () =>
  fetch(`${API}/content`).then((r) => r.json());
export const saveContent = (data) => api.put("/content", data).then((r) => r.data);
export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);
export const sendChat = (message, session_id) =>
  fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id }),
  }).then((r) => r.json());
export const uploadFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
