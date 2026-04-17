import { jsPDF } from "jspdf";
import { formatDateTime } from "./formatters";

const APP_NAME = "Smart Campus Operations Hub";
const RESOLUTION_COPY =
  "Marked resolved by maintenance. If something is still wrong, open a new ticket or contact support.";

function imageFormatFromDataUrl(dataUrl) {
  const m = /^data:image\/([\w+]+);/i.exec(dataUrl);
  if (!m) return "PNG";
  const t = m[1].toLowerCase();
  if (t === "jpeg" || t === "jpg") return "JPEG";
  if (t === "png") return "PNG";
  if (t === "webp") return "WEBP";
  if (t === "gif") return "GIF";
  return "PNG";
}

function safePdfFileName(ticketId) {
  const raw = String(ticketId ?? "ticket").trim() || "ticket";
  return raw.replace(/[^\w.-]+/g, "_").slice(0, 80);
}

/**
 * @param {object} params
 * @param {object} params.ticket
 * @param {{ parsed: object, categoryLabel: string, subCategoryLabel: string, suggestions: string[] }} params.view
 * @param {string} params.statusLabel
 * @param {string} params.assigneeLabel
 * @param {{ dataUrl: string, caption?: string }[]} [params.userEvidence]
 * @param {{ dataUrl: string, caption?: string }[]} [params.technicianEvidence]
 * @param {string[]} [params.userEvidenceOtherFiles]
 * @param {string[]} [params.technicianEvidenceOtherFiles]
 */
export async function downloadResolvedTicketPdf({
  ticket,
  view,
  statusLabel,
  assigneeLabel,
  userEvidence = [],
  technicianEvidence = [],
  userEvidenceOtherFiles = [],
  technicianEvidenceOtherFiles = [],
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageWidth - margin * 2;
  let y = margin;

  const bodySize = 10;
  const smallSize = 9;
  const titleSize = 16;
  const sectionSize = 11;
  const lineGap = 5;
  const updateBlockPad = 4;
  const updateBarW = 3.5;
  /** Light panel + left accent so technician replies are easy to spot in the PDF. */
  const UPDATE_PANEL = { fill: [240, 245, 250], bar: [46, 120, 175], border: [190, 200, 215] };

  const newPageIfNeeded = (delta) => {
    if (y + delta > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const printLines = (lines, fontSize, fontStyle = "normal", gap = lineGap) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    const textLines = Array.isArray(lines) ? lines : [lines];
    for (const line of textLines) {
      const wrapped = doc.splitTextToSize(String(line), contentW);
      for (const w of wrapped) {
        newPageIfNeeded(gap + 2);
        doc.text(w, margin, y);
        y += gap;
      }
    }
  };

  const addField = (label, value) => {
    const val = value == null || value === "" ? "—" : String(value);
    printLines(`${label}:`, bodySize, "bold", lineGap);
    printLines(val, bodySize, "normal", lineGap);
    y += 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleSize);
  newPageIfNeeded(titleSize);
  doc.text(APP_NAME, margin, y);
  y += titleSize * 0.45 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(sectionSize);
  doc.text("Ticket details (resolved)", margin, y);
  y += sectionSize * 0.45 + 6;

  doc.setFontSize(bodySize);

  const ticketIdLine = ticket?.id != null ? `Ticket #${ticket.id}` : "Ticket";
  addField("Reference", ticketIdLine);
  addField("Title", ticket?.title || "Untitled Ticket");
  addField("Status", statusLabel || "Resolved");
  addField("Category", view?.categoryLabel || "—");
  addField("Subcategory", view?.subCategoryLabel || "—");
  addField("Location", view?.parsed?.location || "—");
  addField("Priority", view?.parsed?.priority || "Normal");

  const contact =
    [view?.parsed?.contactMethod, view?.parsed?.contactDetails].filter(Boolean).join(" · ") || "—";
  addField("Preferred contact", contact);
  addField("Assigned technician", assigneeLabel || "—");

  printLines("Resolution:", bodySize, "bold");
  printLines(RESOLUTION_COPY, bodySize, "normal");
  y += 2;

  if (ticket?.createdAt) {
    try {
      addField("Submitted", formatDateTime(ticket.createdAt));
    } catch {
      addField("Submitted", String(ticket.createdAt));
    }
  }

  printLines("Description:", bodySize, "bold");
  printLines(view?.parsed?.content || "No description provided.", bodySize, "normal");
  y += 2;

  if (Array.isArray(ticket?.updates) && ticket.updates.length > 0) {
    const textInset = margin + updateBarW + updateBlockPad;
    const textW = contentW - updateBarW - updateBlockPad * 2;

    printLines("Technician updates", sectionSize, "bold", 6);
    doc.setDrawColor(...UPDATE_PANEL.border);
    doc.setLineWidth(0.35);
    newPageIfNeeded(3);
    doc.line(margin, y, margin + contentW, y);
    y += 5;

    ticket.updates.forEach((u, idx) => {
      const meta = [u.updatedBy, u.timestamp ? formatDateTime(u.timestamp) : null]
        .filter(Boolean)
        .join(" · ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(bodySize);
      const titleLines = doc.splitTextToSize(`Update ${idx + 1}`, textW);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(smallSize);
      const metaLines = meta ? doc.splitTextToSize(meta, textW) : [];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      const msgLines = u.message ? doc.splitTextToSize(String(u.message), textW) : [];

      const titleGap = lineGap;
      const metaGap = 4.2;
      const msgGap = lineGap;
      const blockH =
        updateBlockPad +
        titleLines.length * titleGap +
        (metaLines.length > 0 ? 2 + metaLines.length * metaGap : 0) +
        (msgLines.length > 0 ? 2 + msgLines.length * msgGap : 0) +
        updateBlockPad;

      newPageIfNeeded(blockH + 6);
      const blockTop = y;

      doc.setFillColor(...UPDATE_PANEL.fill);
      doc.rect(margin, blockTop, contentW, blockH, "F");
      doc.setFillColor(...UPDATE_PANEL.bar);
      doc.rect(margin, blockTop, updateBarW, blockH, "F");
      doc.setDrawColor(...UPDATE_PANEL.border);
      doc.setLineWidth(0.25);
      doc.rect(margin, blockTop, contentW, blockH, "S");

      let ty = blockTop + updateBlockPad + 4;
      doc.setTextColor(25, 45, 70);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(bodySize);
      titleLines.forEach((line) => {
        doc.text(line, textInset, ty);
        ty += titleGap;
      });

      if (metaLines.length > 0) {
        ty += 1;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(smallSize);
        doc.setTextColor(70, 85, 105);
        metaLines.forEach((line) => {
          doc.text(line, textInset, ty);
          ty += metaGap;
        });
      }

      if (msgLines.length > 0) {
        ty += 1;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodySize);
        doc.setTextColor(15, 25, 40);
        msgLines.forEach((line) => {
          doc.text(line, textInset, ty);
          ty += msgGap;
        });
      }

      doc.setTextColor(0, 0, 0);
      y = blockTop + blockH + 5;
    });
    y += 2;
  }

  if (Array.isArray(view?.suggestions) && view.suggestions.length > 0) {
    addField("Suggestions", view.suggestions.join(", "));
  }

  const addEvidenceSection = async (heading, items) => {
    if (!items || items.length === 0) return;
    printLines(heading.toUpperCase(), sectionSize, "bold", 6);
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const cap = item.caption ? String(item.caption) : `Image ${i + 1}`;
      printLines(cap, smallSize, "italic");

      const fmt = imageFormatFromDataUrl(item.dataUrl);
      const props = doc.getImageProperties(item.dataUrl);
      const maxW = contentW;
      const imgW = maxW;
      const imgH = (props.height * maxW) / props.width;
      newPageIfNeeded(imgH + 6);
      doc.addImage(item.dataUrl, fmt, margin, y, imgW, imgH);
      y += imgH + 6;
    }
  };

  await addEvidenceSection("Your evidence", userEvidence);
  if (userEvidenceOtherFiles.length > 0) {
    addField("Your evidence (other files)", userEvidenceOtherFiles.join(", "));
  }
  await addEvidenceSection("Technician evidence", technicianEvidence);
  if (technicianEvidenceOtherFiles.length > 0) {
    addField("Technician evidence (other files)", technicianEvidenceOtherFiles.join(", "));
  }

  doc.setFontSize(smallSize);
  doc.setTextColor(100);
  newPageIfNeeded(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  doc.setTextColor(0);

  const fileName = `${safePdfFileName(ticket?.id)}-ticket.pdf`;
  doc.save(fileName);
}

export async function blobUrlToDataUrl(blobUrl) {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
