import { toToken } from "../utils/formatters";

function TicketCard({ ticket, variant = "list", className = "" }) {
  const title = ticket.title ?? "";
  const description = ticket.description ?? "";
  const statusLabel = ticket.status || "Unknown";

  const badge = (
    <span className={`status-badge ${toToken(ticket.status || "unknown")}`}>{statusLabel}</span>
  );

  if (variant === "compact") {
    return (
      <div className={className.trim() || undefined} style={{ flex: "1 1 240px" }}>
        <strong>{title}</strong>
        <p className="supporting-text">{description || "—"}</p>
        {badge}
      </div>
    );
  }

  return (
    <article className={`list-row align-start ${className}`.trim()}>
      <div>
        <strong>{title}</strong>
        <p className="supporting-text">{description || "—"}</p>
      </div>
      <div className="inline-actions">{badge}</div>
    </article>
  );
}

export default TicketCard;
