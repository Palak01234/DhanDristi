const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export function apiUrl(path: string): string {
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl.replace(/\/$/, "")}${path}`;
}
