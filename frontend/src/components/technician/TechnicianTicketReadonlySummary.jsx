import { useEffect, useMemo, useState } from "react";
import { fetchAttachmentPreview } from "../../services/ticketService";
import { toToken } from "../../utils/formatters";
import { parseTicketDescription } from "../../utils/ticketDescription";
import { normalizeAttachmentFromApi } from "../../utils/ticketNormalize";
import { isAcceptedTechnicianWork, isAwaitingTechnicianDecision } from "../../utils/technicianTicketFlow";

function isImageEvidence(mime, fileName) {
  if (mime && String(mime).startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || "");
}

function formatTicketStatusLabelForTicket(ticket) {
  if (isAwaitingTechnicianDecision(ticket)) return "Awaiting your response";
  if (isAcceptedTechnicianWork(ticket)) {
    const rs = String(ticket?.status || "OPEN")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    return rs === "ACCEPTED" ? "Accepted" : "In progress";
  }
  const raw = String(ticket?.status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "In progress";
  if (raw === "ASSIGNED") return "Awaiting your response";
  if (raw === "OPEN") return "Open";
  if (raw === "REJECTED") return "Rejected";
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "WITHDRAWN") return "Withdrawn";
  return String(ticket?.status || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Read-only ticket body (matches the top of TechnicianTicketPanel): title, status, report, meta, requester evidence.
 */
export default function TechnicianTicketReadonlySummary({ ticket }) {
  const parsed = parseTicketDescription(ticket?.description);
  const creator = ticket?.createdByUsername?.trim();
  const statusToken = toToken(ticket?.status || "unknown");

  const normalizedAttachments = useMemo(() => {
    const raw = ticket?.attachments;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeAttachmentFromApi).filter(Boolean);
  }, [ticket?.attachments]);

  const evidenceAttachmentKey = useMemo(
    () => normalizedAttachments.map((a) => a?.id).join("|"),
    [normalizedAttachments],
  );

  const [evidencePreviewById, setEvidencePreviewById] = useState({});

  useEffect(() => {
    if (!ticket?.id || normalizedAttachments.length === 0) {
      setEvidencePreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    async function loadEvidence() {
      const next = {};
      for (const att of normalizedAttachments) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(ticket.id, att.id);
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip */
        }
      }
      if (!cancelled) {
        setEvidencePreviewById((prev) => {
          Object.values(prev).forEach((entry) => {
            if (entry?.url) URL.revokeObjectURL(entry.url);
          });
          return next;
        });
      }
    }

    loadEvidence();
    return () => {
      cancelled = true;
    };
  }, [ticket?.id, evidenceAttachmentKey]);

  if (!ticket) {
    return null;
  }

  return (
    <article className="technician-ticket-panel">
      <div className="technician-ticket-panel-header">
        <div className="technician-ticket-panel-title-row">
          <h3 className="technician-ticket-panel-title">
            {ticket.title?.trim() || "Untitled request"}
          </h3>
          <span
            className={`status-badge ${statusToken}`}
            title={`Status: ${formatTicketStatusLabelForTicket(ticket)}`}
          >
            {formatTicketStatusLabelForTicket(ticket)}
          </span>
        </div>
        <p className="technician-ticket-panel-sub">
          <span className="technician-ticket-panel-label">Ticket ID</span> {ticket.id ?? "—"}
        </p>
        {creator ? (
          <p className="technician-ticket-panel-sub">
            <span className="technician-ticket-panel-label">Submitted by</span> {creator}
          </p>
        ) : null}
      </div>

      <div className="technician-ticket-panel-body">
        <h4 className="technician-ticket-section-title">What they reported</h4>
        <p className="technician-ticket-description">
          {parsed.content?.trim() ? parsed.content : "—"}
        </p>

        <dl className="technician-ticket-meta">
          <div className="technician-ticket-meta-item">
            <dt>Location</dt>
            <dd>{parsed.location?.trim() || "—"}</dd>
          </div>
          <div className="technician-ticket-meta-item">
            <dt>Priority</dt>
            <dd>{parsed.priority?.trim() || "Normal"}</dd>
          </div>
          <div className="technician-ticket-meta-item">
            <dt>Preferred contact</dt>
            <dd>
              {parsed.contactMethod?.trim() || "—"}
              {parsed.contactDetails?.trim() ? (
                <>
                  <span className="technician-ticket-meta-sep" aria-hidden="true">
                    {" "}
                    ·{" "}
                  </span>
                  <span className="technician-ticket-contact-detail">{parsed.contactDetails.trim()}</span>
                </>
              ) : null}
            </dd>
          </div>
        </dl>

        {normalizedAttachments.length > 0 ? (
          <div className="technician-evidence-block" aria-label="Requester evidence">
            <h4 className="technician-ticket-section-title technician-evidence-heading">Requester evidence</h4>
            <p className="technician-ticket-section-hint technician-evidence-hint">
              Photos or files the requester submitted with this ticket (read-only).
            </p>
            <ul className="ticket-detail-evidence-list technician-evidence-list">
              {normalizedAttachments.map((att) => {
                const preview = evidencePreviewById[att.id];
                const name = att.fileName || "Attachment";
                const showImg = preview?.url && isImageEvidence(preview.mime, name);
                return (
                  <li className="ticket-detail-evidence-item" key={att.id || name}>
                    {showImg ? (
                      <a
                        className="ticket-detail-evidence-thumb-link"
                        href={preview.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <img alt={name} className="ticket-detail-evidence-img" src={preview.url} />
                      </a>
                    ) : preview?.url ? (
                      <a className="ticket-detail-evidence-file" download={name} href={preview.url}>
                        {name}
                      </a>
                    ) : att.id ? (
                      <span className="ticket-detail-evidence-loading">{name}</span>
                    ) : (
                      <span className="ticket-detail-evidence-file">{name}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
