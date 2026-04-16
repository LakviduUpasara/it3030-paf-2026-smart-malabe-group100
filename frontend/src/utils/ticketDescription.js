export const META_MARKER = "\n\n__META__\n";

const META_KEYS = /(?:location|priority|contactMethod|contactDetails)\s*:/i;

function applyMetaLine(parsed, line) {
  const idx = line.indexOf(":");
  if (idx < 0) return;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (key === "location") parsed.location = value;
  if (key === "priority") parsed.priority = value;
  if (key === "contactMethod") parsed.contactMethod = value;
  if (key === "contactDetails") parsed.contactDetails = value;
}

/** Parses key:value lines; also handles a single line with multiple space-separated fields. */
function parseMetaBlock(metaBlock) {
  const parsed = {
    location: "",
    priority: "Normal",
    contactMethod: "",
    contactDetails: "",
  };
  const text = (metaBlock || "").replace(/\r\n/g, "\n").trim();
  if (!text) return parsed;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (META_KEYS.test(trimmed) && /\s+\w+:/.test(trimmed)) {
      const segments = trimmed.split(/\s+(?=(?:location|priority|contactMethod|contactDetails)\s*:)/i);
      for (const seg of segments) {
        applyMetaLine(parsed, seg.trim());
      }
    } else {
      applyMetaLine(parsed, trimmed);
    }
  }
  return parsed;
}

export function parseTicketDescription(description) {
  const raw = description || "";
  let contentBlock;
  let metaBlock;

  if (raw.includes(META_MARKER)) {
    const parts = raw.split(META_MARKER);
    contentBlock = parts[0];
    metaBlock = parts.slice(1).join(META_MARKER);
  } else if (raw.includes("__META__")) {
    const parts = raw.split("__META__");
    contentBlock = parts[0];
    metaBlock = parts.slice(1).join("__META__");
  } else {
    return {
      content: raw.trim(),
      location: "",
      priority: "Normal",
      contactMethod: "",
      contactDetails: "",
    };
  }

  const parsed = parseMetaBlock(metaBlock);
  parsed.content = (contentBlock || "").trim();
  return parsed;
}
