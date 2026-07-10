/**
 * Download a (possibly cross-origin) file to the user's machine. Fetches to a
 * blob first so the browser saves it instead of navigating, and falls back to
 * opening in a new tab when the fetch is blocked (e.g. CORS on remote CDNs).
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

/** Sanitize an asset name into a safe filename (keeps the extension separate). */
export function safeFilename(name: string, ext = "png"): string {
  const base = name.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "asset";
  return `${base}.${ext}`;
}
