import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../Button";
import Card from "../Card";
import {
  addUpdate,
  deleteTechnicianEvidence,
  fetchAttachmentPreview,
  replaceTechnicianEvidence,
  uploadTechnicianEvidence,
} from "../../services/ticketService";
import { formatDateTime } from "../../utils/formatters";
import { canTechnicianPostWorkOnTicket } from "../../utils/technicianTicketFlow";
import {
  normalizeAttachmentFromApi,
  normalizeTicketFromApi,
  normalizeTicketUpdateFromApi,
} from "../../utils/ticketNormalize";

const MAX_TECHNICIAN_EVIDENCE = 3;

function isImageEvidence(mime, fileName) {
  if (mime && String(mime).startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || "");
}

function sortUpdatesNewestFirst(updates) {
  if (!Array.isArray(updates)) return [];
  const normalized = updates.map(normalizeTicketUpdateFromApi).filter(Boolean);
  return normalized.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(String(a.timestamp)) : 0;
    const tb = b.timestamp ? Date.parse(String(b.timestamp)) : 0;
    return tb - ta;
  });
}

/** Scroll the modal work section into view and focus the update textarea (used by footer "Add comment"). */
export function focusTechnicianModalWorkNotes() {
  const el = document.getElementById("technician-modal-work-notes");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    const ta = el.querySelector("textarea");
    if (ta && typeof ta.focus === "function") ta.focus();
  }, 280);
}

/**
 * Updates + technician evidence for ticket detail modals (My tickets, Accept queue).
 */
export default function TechnicianTicketModalWorkPanel({ ticket, onTicketUpdated }) {
  const [progressText, setProgressText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [panelError, setPanelError] = useState("");
  const [pickFile, setPickFile] = useState(null);

  const canWork = ticket && canTechnicianPostWorkOnTicket(ticket);
  const ticketId = ticket?.id ? String(ticket.id) : "";

  const updates = useMemo(() => sortUpdatesNewestFirst(ticket?.updates), [ticket?.updates]);

  const techAttachments = useMemo(() => {
    const raw = ticket?.technicianAttachments;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeAttachmentFromApi).filter(Boolean);
  }, [ticket?.technicianAttachments]);

  const techKey = useMemo(() => techAttachments.map((a) => a?.id).join("|"), [techAttachments]);

  const [techPreviewById, setTechPreviewById] = useState({});

  useEffect(() => {
    if (!ticketId || techAttachments.length === 0) {
      setTechPreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    async function load() {
      const next = {};
      for (const att of techAttachments) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(ticketId, att.id, { fileNameHint: att.fileName });
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip */
        }
      }
      if (!cancelled) {
        setTechPreviewById((prev) => {
          Object.values(prev).forEach((entry) => {
            if (entry?.url) URL.revokeObjectURL(entry.url);
          });
          return next;
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ticketId, techKey]);

  const applyTicketResponse = useCallback(
    (data) => {
      if (!data) return;
      const normalized = normalizeTicketFromApi(data);
      onTicketUpdated?.(normalized);
    },
    [onTicketUpdated],
  );

  const handlePostUpdate = async (event) => {
    event.preventDefault();
    if (!ticketId || !progressText.trim() || !canWork) return;
    setBusy(true);
    setPanelError("");
    try {
      const res = await addUpdate(ticketId, { message: progressText.trim() });
      applyTicketResponse(res?.data);
      setProgressText("");
    } catch (e) {
      setPanelError(e.message || "Could not add update.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async () => {
    if (!ticketId || !pickFile || !canWork) return;
    if (techAttachments.length >= MAX_TECHNICIAN_EVIDENCE) {
      setPanelError(`You can upload at most ${MAX_TECHNICIAN_EVIDENCE} evidence files.`);
      return;
    }
    setPending("upload");
    setPanelError("");
    try {
      const res = await uploadTechnicianEvidence(ticketId, pickFile);
      applyTicketResponse(res?.data);
      setPickFile(null);
    } catch (e) {
      setPanelError(e.message || "Could not upload.");
    } finally {
      setPending(null);
    }
  };

  const handleDeleteTech = async (attachmentId) => {
    if (!ticketId || !attachmentId || !canWork) return;
    if (!window.confirm("Remove this evidence file?")) return;
    setPending(`del-${attachmentId}`);
    setPanelError("");
    try {
      const res = await deleteTechnicianEvidence(ticketId, attachmentId);
      applyTicketResponse(res?.data);
    } catch (e) {
      setPanelError(e.message || "Could not remove file.");
    } finally {
      setPending(null);
    }
  };

  const handleReplaceTech = async (attachmentId, file) => {
    if (!ticketId || !attachmentId || !file || !canWork) return;
    setPending(`repl-${attachmentId}`);
    setPanelError("");
    try {
      const res = await replaceTechnicianEvidence(ticketId, attachmentId, file);
      applyTicketResponse(res?.data);
    } catch (e) {
      setPanelError(e.message || "Could not replace file.");
    } finally {
      setPending(null);
    }
  };

  if (!ticket) return null;

  return (
    <div
      className="technician-modal-work-panel mt-8 border-t border-border pt-6"
      id="technician-modal-work-notes"
    >
      {panelError ? (
        <p className="alert alert-error mb-4" role="alert">
          {panelError}
        </p>
      ) : null}

      {!canWork ? (
        <p className="supporting-text mb-6 rounded-2xl border border-border/80 bg-tint/40 px-4 py-3 text-sm">
          <strong>Updates and evidence</strong> are available after you <strong>accept</strong> this assignment (and
          while the ticket is still active).
        </p>
      ) : null}

      <Card
        className="mb-6 shadow-shadow/40"
        subtitle="Visible to the person who submitted the ticket"
        title="Updates"
      >
        {updates.length ? (
          <ul className="mb-4 space-y-3">
            {updates.map((u) => (
              <li className="rounded-2xl border border-border bg-tint/60 p-3" key={u.id}>
                <p className="whitespace-pre-wrap text-sm text-text/80">{u.message}</p>
                <p className="mt-2 text-xs text-text/60">
                  {u.updatedBy || "Technician"}
                  {u.timestamp ? ` · ${formatDateTime(u.timestamp)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="supporting-text mb-4">No updates yet.</p>
        )}

        <form className="form-grid" onSubmit={handlePostUpdate}>
          <label className="field">
            <span>Add update</span>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              disabled={busy || !canWork}
              onChange={(e) => setProgressText(e.target.value)}
              placeholder="What did you check or change?"
              value={progressText}
            />
          </label>
          <div>
            <Button disabled={busy || !canWork || !progressText.trim()} type="submit" variant="primary">
              {busy ? "Posting…" : "Post update"}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        className="shadow-shadow/40"
        subtitle="Photos or documents showing your work (stored separately from the requester’s uploads)"
        title="Technician evidence"
      >
        <p className="supporting-text mb-4 text-sm">
          Upload up to {MAX_TECHNICIAN_EVIDENCE} files. You can remove or replace each file while the ticket is open.
        </p>

        {techAttachments.length > 0 ? (
          <ul className="ticket-detail-evidence-list technician-evidence-list technician-tech-evidence-list mb-4">
            {techAttachments.map((att) => {
              const preview = techPreviewById[att.id];
              const name = att.fileName || "Attachment";
              const showImg = preview?.url && isImageEvidence(preview.mime, name);
              return (
                <li className="ticket-detail-evidence-item" key={att.id || name}>
                  {canWork && att.id ? (
                    <div className="technician-tech-evidence-actions">
                      <button
                        aria-label={`Remove ${name}`}
                        className="ticket-detail-evidence-remove"
                        disabled={pending != null}
                        onClick={() => handleDeleteTech(att.id)}
                        type="button"
                      >
                        Remove
                      </button>
                      <label className="technician-tech-evidence-replace">
                        <input
                          accept="image/*,application/pdf,.doc,.docx"
                          className="technician-tech-evidence-replace-input"
                          disabled={pending != null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReplaceTech(att.id, f);
                            e.target.value = "";
                          }}
                          type="file"
                        />
                        <span className="technician-tech-evidence-replace-text">Replace</span>
                      </label>
                    </div>
                  ) : null}
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
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <label className="field min-w-[200px] flex-1">
            <span>Choose file</span>
            <input
              className="block w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-tint file:px-3 file:py-1.5 file:text-sm"
              disabled={!canWork || techAttachments.length >= MAX_TECHNICIAN_EVIDENCE || pending != null}
              onChange={(e) => setPickFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          <Button
            disabled={
              !canWork || !pickFile || techAttachments.length >= MAX_TECHNICIAN_EVIDENCE || pending === "upload"
            }
            onClick={handleUpload}
            type="button"
            variant="secondary"
          >
            {pending === "upload" ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
