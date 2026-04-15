const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "case",
    label: "Uppercase and lowercase letters",
    test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "At least one symbol",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

const STRENGTH_LABELS = [
  { label: "Weak", tone: "weak" },
  { label: "Fair", tone: "fair" },
  { label: "Good", tone: "good" },
  { label: "Strong", tone: "strong" },
];

export function getPasswordStrength(password = "") {
  const normalizedPassword = String(password);
  const checks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(normalizedPassword),
  }));
  const passedCount = checks.filter((rule) => rule.passed).length;
  const score = normalizedPassword ? passedCount : 0;
  const levelIndex = Math.max(0, Math.min(STRENGTH_LABELS.length - 1, score - 1));
  const strengthMeta = STRENGTH_LABELS[levelIndex];

  return {
    score,
    maxScore: PASSWORD_RULES.length,
    progress: normalizedPassword ? (passedCount / PASSWORD_RULES.length) * 100 : 0,
    label: normalizedPassword ? strengthMeta.label : "Add a password",
    tone: normalizedPassword ? strengthMeta.tone : "neutral",
    checks,
  };
}
