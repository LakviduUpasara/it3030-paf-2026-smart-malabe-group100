export function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

export function formatDateTime(dateValue) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function toToken(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Portal feed items may use ISO timestamps or human-readable strings. */
export function formatFeedTime(isoOrText) {
  if (isoOrText == null || isoOrText === "") {
    return "";
  }
  const asString = String(isoOrText).trim();
  const parsed = Date.parse(asString);
  if (!Number.isNaN(parsed)) {
    return formatDateTime(parsed);
  }
  return asString;
}

