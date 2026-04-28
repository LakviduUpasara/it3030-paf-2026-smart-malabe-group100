import fs from "node:fs";
import path from "node:path";

const EVIDENCE_DIR = path.resolve(
  process.cwd(),
  "..",
  "docs",
  "testing",
  "playwright-screenshots",
);

export function ensureEvidenceDirectory() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  return EVIDENCE_DIR;
}

export function evidenceDocPath(filename) {
  return `docs/testing/playwright-screenshots/${filename}`;
}

export async function captureEvidence(page, filename, options = {}) {
  ensureEvidenceDirectory();
  const filePath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({
    path: filePath,
    fullPage: true,
    ...options,
  });
  return filePath;
}
