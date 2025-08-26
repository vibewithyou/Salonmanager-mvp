// Minimaler Fetch-Layer mit JSON-Fehlern
async function handle<T>(r: Response): Promise<T> {
  const text = await r.text();
  if (!r.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(data?.message ?? text);
    } catch {
      throw new Error(text || `HTTP ${r.status}`);
    }
  }
  return text ? (JSON.parse(text) as T) : ((undefined as unknown) as T);
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  return handle<T>(r);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle<T>(r);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle<T>(r);
}
