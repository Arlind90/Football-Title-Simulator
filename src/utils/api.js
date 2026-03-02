const API_KEY = import.meta.env.VITE_API_KEY || '';
const BASE_V1 = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const BASE_V2 = 'https://www.thesportsdb.com/api/v2/json';

export async function apiFetchV1(path) {
  const res = await fetch(`${BASE_V1}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiFetchV2(path) {
  const res = await fetch(`${BASE_V2}${path}`, {
    headers: { 'X-API-KEY': API_KEY },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
