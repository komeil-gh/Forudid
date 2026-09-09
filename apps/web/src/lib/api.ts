export const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${url}`, { priority: 'high', ...options })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<T>
}
