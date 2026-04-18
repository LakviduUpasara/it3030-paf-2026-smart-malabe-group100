/** Max length aligned with backend {@code TechnicianRejectAssignmentRequest.reason}. */
export const TECHNICIAN_REJECT_REASON_MAX = 500;

/** Sentinel value for the "Other" option in the reason dropdown. */
export const TECHNICIAN_REJECT_OTHER = "__other__";

/**
 * Preset reasons shown when a technician returns a ticket to the desk.
 * Labels are stored as the desk-facing note (plain text).
 */
export const TECHNICIAN_REJECT_PRESET_REASONS = [
  { value: "outside_area", label: "Outside my area or specialty" },
  { value: "unavailable", label: "Unavailable or workload too high" },
  { value: "missing_access", label: "Missing access, parts, or information" },
  { value: "duplicate", label: "Duplicate ticket or reassignment needed" },
  { value: TECHNICIAN_REJECT_OTHER, label: "Other (specify below)" },
];

/**
 * @param {string} selectedValue - A {@code value} from {@link TECHNICIAN_REJECT_PRESET_REASONS}
 * @param {string} otherText - Required when {@code selectedValue === TECHNICIAN_REJECT_OTHER}
 * @returns {{ ok: true, reason: string } | { ok: false, error: string }}
 */
export function buildTechnicianRejectReason(selectedValue, otherText) {
  const v = String(selectedValue || "").trim();
  if (!v) {
    return { ok: false, error: "Select a reason." };
  }
  if (v === TECHNICIAN_REJECT_OTHER) {
    const t = String(otherText || "").trim();
    if (!t) {
      return { ok: false, error: "Please describe the reason." };
    }
    if (t.length > TECHNICIAN_REJECT_REASON_MAX) {
      return { ok: false, error: `Reason must be at most ${TECHNICIAN_REJECT_REASON_MAX} characters.` };
    }
    return { ok: true, reason: t };
  }
  const preset = TECHNICIAN_REJECT_PRESET_REASONS.find((p) => p.value === v);
  if (!preset || preset.value === TECHNICIAN_REJECT_OTHER) {
    return { ok: false, error: "Select a reason." };
  }
  return { ok: true, reason: preset.label };
}
