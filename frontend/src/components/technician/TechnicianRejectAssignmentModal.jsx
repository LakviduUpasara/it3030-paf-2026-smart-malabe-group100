import { useEffect, useId, useState } from "react";
import Button from "../Button";
import {
  buildTechnicianRejectReason,
  TECHNICIAN_REJECT_OTHER,
  TECHNICIAN_REJECT_PRESET_REASONS,
  TECHNICIAN_REJECT_REASON_MAX,
} from "../../utils/technicianRejectReasons";

/**
 * Two-step flow: (1) confirm return to desk, (2) reason from list or Other + text, then submit.
 */
function TechnicianRejectAssignmentModal({
  open,
  onClose,
  onComplete,
  ticketTitle,
  inProgressPhase = false,
  busy = false,
}) {
  const titleId = useId();
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedReason("");
    setOtherText("");
    setLocalError("");
  }, [open]);

  useEffect(() => {
    if (!open || busy) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, busy, onClose]);

  if (!open) {
    return null;
  }

  const showOther = selectedReason === TECHNICIAN_REJECT_OTHER;

  const handleConfirmReason = async () => {
    setLocalError("");
    const built = buildTechnicianRejectReason(selectedReason, otherText);
    if (!built.ok) {
      setLocalError(built.error);
      return;
    }
    try {
      await onComplete(built.reason);
    } catch (e) {
      setLocalError(e?.message || "Could not return ticket.");
    }
  };

  const deskLine = inProgressPhase
    ? "Your assignment will be cleared and the ticket will be Open again so the desk can assign another technician."
    : "The ticket will be Open again so the desk can assign a different technician.";

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
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h3 id={titleId}>
            {step === 1 ? "Return ticket to desk?" : "Reason for returning"}
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-content">
          {ticketTitle ? (
            <p className="mb-3 font-medium text-heading">
              {String(ticketTitle).trim() || "Untitled request"}
            </p>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-3">
              <p className="supporting-text">{deskLine}</p>
              <p className="supporting-text text-sm text-amber-800/90 dark:text-amber-200/90">
                Continue only if you are sure — you will be asked for a reason on the next step.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="supporting-text text-sm">
                The desk will see this note when reassigning the ticket.
              </p>
              <label className="field">
                <span>Reason</span>
                <select
                  className="w-full rounded-xl border border-border bg-surface p-3 text-sm"
                  disabled={busy}
                  value={selectedReason}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    setLocalError("");
                  }}
                >
                  <option value="">Select a reason…</option>
                  {TECHNICIAN_REJECT_PRESET_REASONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {showOther ? (
                <label className="field">
                  <span>Describe the reason</span>
                  <textarea
                    className="min-h-[96px] w-full rounded-xl border border-border bg-surface p-3 text-sm"
                    disabled={busy}
                    maxLength={TECHNICIAN_REJECT_REASON_MAX}
                    placeholder="Type details for the desk…"
                    value={otherText}
                    onChange={(e) => {
                      setOtherText(e.target.value);
                      setLocalError("");
                    }}
                  />
                  <span className="supporting-text text-xs">
                    {otherText.length}/{TECHNICIAN_REJECT_REASON_MAX}
                  </span>
                </label>
              ) : null}
              {localError ? <p className="alert alert-error">{localError}</p> : null}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step === 1 ? (
            <>
              <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => setStep(2)}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setLocalError("");
                  setStep(1);
                }}
              >
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={handleConfirmReason}>
                {busy ? "Returning…" : "Confirm — return to desk"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TechnicianRejectAssignmentModal;
