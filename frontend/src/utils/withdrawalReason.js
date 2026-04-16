export const WITHDRAWAL_REASON_OPTIONS = [
  { value: "RESOLVED_MYSELF", label: "Issue resolved on my own" },
  { value: "NO_LONGER_NEEDED", label: "No longer need help" },
  { value: "DUPLICATE", label: "Duplicate or submitted by mistake" },
  { value: "ELSEWHERE", label: "Handled through another channel" },
  { value: "OTHER", label: "Other" },
];

export function formatWithdrawalReasonForDisplay(ticket) {
  const code = ticket?.withdrawalReasonCode;
  const note = ticket?.withdrawalReasonNote;
  if (!code && !note) return "";
  if (code === "OTHER" && note) return `Other: ${note}`;
  const label = WITHDRAWAL_REASON_OPTIONS.find((o) => o.value === code)?.label;
  return label || code || note || "";
}
