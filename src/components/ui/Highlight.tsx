function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Render `text` with every search token wrapped in a soft-green mark. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp);

  if (tokens.length === 0) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${tokens.join("|")})`, "gi"));
  const matcher = new RegExp(`^(?:${tokens.join("|")})$`, "i");

  return (
    <>
      {parts.map((part, index) =>
        matcher.test(part) ? (
          <mark key={index} className="rounded-sm bg-accent-soft px-0.5 text-accent-deep">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
