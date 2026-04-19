import { useEffect, useState } from "react";
import Button from "../Button";

const REASON_MAX = 500;

/**
 * Confirm declining a pending assignment or returning accepted work to the desk (reason required for admins).
 */
export default function TechnicianRejectAssignmentModal({
  open,
  onClose,
  onComplete,
  busy = false,
  inProgressPhase = false,
  ticketTitle,
}) {
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const title = inProgressPhase ? "Return ticket to desk" : "Decline this assignment";
  const subtitle = inProgressPhase
    ? "Your assignment will be cleared and the desk can assign someone else."
    : "The ticket goes back to the desk queue. Add a short note if helpful.";

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= REASON_MAX;

  const handleSubmit = async () => {
    setSubmitError("");
    if (!canSubmit) {
      setSubmitError("Please enter a reason (visible to administrators).");
      return;
    }
    try {
      await onComplete(trimmed);
    } catch (e) {
      setSubmitError(e?.message || "Something went wrong.");
    }
  };

  return (
    <div
      className="modal-backdrop modal-backdrop--stack"
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="technician-reject-modal-title"
      >
        <div className="modal-header">
          <h3 id="technician-reject-modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-content">
          <p className="supporting-text mb-4">{subtitle}</p>
          {ticketTitle ? (
            <p className="mb-3 font-medium text-heading">{String(ticketTitle).trim()}</p>
          ) : null}
          <label className="field mb-2 block">
            <span className="text-sm text-text/80">
              Reason for rejection <span className="text-text/55">(required — shown to administrators, max {REASON_MAX} characters)</span>
            </span>
            <textarea
              className="mt-1 w-full min-h-[88px] rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              disabled={busy}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. workload, missing access, wrong category…"
            />
          </label>
          {submitError ? <p className="alert alert-error">{submitError}</p> : null}
        </div>
        <div className="modal-footer">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !canSubmit} onClick={handleSubmit}>
            {busy ? "Submitting…" : inProgressPhase ? "Return to desk" : "Decline assignment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
