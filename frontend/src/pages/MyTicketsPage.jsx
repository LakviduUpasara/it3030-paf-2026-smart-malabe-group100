import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  createTicket,
  deleteAttachment,
  fetchAttachmentPreview,
  getMyTickets,
  getTicketById,
  getTicketSuggestion,
  updateMyTicket,
  uploadFile,
  withdrawMyTicket,
} from "../services/ticketService";
import { getCategories, getSubCategories } from "../services/categoryService";
import { formatDateTime, toToken } from "../utils/formatters";
import { getTicketThumbnailForCategory } from "../utils/ticketCategoryImage";
import { META_MARKER, parseTicketDescription } from "../utils/ticketDescription";
import {
  WITHDRAWAL_REASON_OPTIONS,
  formatWithdrawalReasonForDisplay,
} from "../utils/withdrawalReason";
import maintenanceIllustration from "../assets/maintenance1.png";
import {
  createTicketDefaultValues,
  DESCRIPTION_MAX_LENGTH,
  ticketCreateFormSchema,
  TITLE_MAX_LENGTH,
} from "../utils/ticketCreateValidation";

const initialForm = createTicketDefaultValues;

function composeTicketDescription(formData) {
  const base = formData.description.trim();
  const lines = [
    `location:${formData.location.trim()}`,
    `priority:${formData.priority}`,
    `contactMethod:${formData.preferredContactMethod}`,
    `contactDetails:${formData.preferredContactDetails.trim()}`,
  ];
  return `${base}${META_MARKER}${lines.join("\n")}`;
}

function formatCategoryLabel(name) {
  if (!name) return "General";
  const lower = String(name).trim().toLowerCase();
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : "General";
}

function formatTicketStatusLabel(status) {
  const raw = String(status || "OPEN").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "In Progress";
  if (raw === "OPEN") return "Open";
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "WITHDRAWN") return "Withdrawn";
  return String(status || "Open")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isTicketEditable(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "OPEN" || normalized === "IN_PROGRESS";
}

function normalizeTicketStatus(status) {
  return String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function isImageEvidence(mime, fileName) {
  if (mime && String(mime).startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || "");
}

const MAX_EVIDENCE_IMAGES = 3;

/** Merge new file picker choices into existing list; cap total pending files at maxSlots; skip duplicates. */
function mergeEvidenceFiles(prev, incoming, maxSlots = MAX_EVIDENCE_IMAGES) {
  const cap = Math.max(0, Math.min(maxSlots, MAX_EVIDENCE_IMAGES));
  const seen = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
  const merged = [...prev];
  for (const f of incoming) {
    if (merged.length >= cap) break;
    const key = `${f.name}-${f.size}-${f.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(f);
  }
  return merged.slice(0, cap);
}

/** API may expose attachment id as `id` or `_id` (Mongo); ensure stable shape for the UI. */
function normalizeAttachmentFromApi(att) {
  if (att == null || typeof att !== "object") return null;
  const rawId = att.id ?? att._id;
  return {
    ...att,
    id: rawId != null && rawId !== "" ? String(rawId) : null,
    fileName: att.fileName ?? att.file_name ?? "",
  };
}

function normalizeTicketFromApi(ticket) {
  if (!ticket) return ticket;
  const raw = ticket.attachments;
  const list = Array.isArray(raw) ? raw : [];
  return {
    ...ticket,
    attachments: list.map(normalizeAttachmentFromApi).filter(Boolean),
  };
}

function EvidenceAttachmentThumbnails({
  attachments,
  evidencePreviewById,
  showRemove,
  onRemoveAttachment,
  removeButtonLabel = "Remove",
}) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  return (
    <ul className="ticket-detail-evidence-list">
      {attachments.map((att) => {
        const preview = evidencePreviewById[att.id];
        const name = att.fileName || "Attachment";
        const showImg = preview?.url && isImageEvidence(preview.mime, name);
        return (
          <li className="ticket-detail-evidence-item" key={att.id || name}>
            {showRemove && att.id && typeof onRemoveAttachment === "function" ? (
              <button
                aria-label={`${removeButtonLabel} ${name}`}
                className="ticket-detail-evidence-remove"
                onClick={() => onRemoveAttachment(att.id)}
                type="button"
              >
                {removeButtonLabel}
              </button>
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
  );
}

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const attachmentsRef = useRef([]);
  const editEvidenceFilesRef = useRef([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryById, setSubCategoryById] = useState({});
  const [detailTicket, setDetailTicket] = useState(null);
  const detailTicketRef = useRef(null);
  const [detailSubView, setDetailSubView] = useState("details");
  const [editFormData, setEditFormData] = useState(() => ({ ...initialForm }));
  const [editSubCategories, setEditSubCategories] = useState([]);
  const [updateError, setUpdateError] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [evidencePreviewById, setEvidencePreviewById] = useState({});
  const [editEvidenceFiles, setEditEvidenceFiles] = useState([]);
  /** Attachment ids to DELETE on Save changes only (not persisted until then). */
  const [pendingRemovedAttachmentIds, setPendingRemovedAttachmentIds] = useState([]);
  const pendingRemovedAttachmentIdsRef = useRef([]);
  const [ticketListQuery, setTicketListQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawOtherReason, setWithdrawOtherReason] = useState("");

  const {
    register: registerCreate,
    handleSubmit: submitCreateTicket,
    watch: watchCreate,
    setValue: setCreateValue,
    getValues: getCreateValues,
    reset: resetCreateForm,
    formState: { errors: createErrors },
  } = useForm({
    resolver: zodResolver(ticketCreateFormSchema),
    defaultValues: createTicketDefaultValues,
    mode: "all",
    shouldFocusError: true,
  });

  const watchCategoryId = watchCreate("categoryId");
  const watchedCreateTitle = watchCreate("title");
  const watchedCreateDescription = watchCreate("description");
  const watchedContactMethod = watchCreate("preferredContactMethod");
  const createFormValuesWatched = watchCreate();
  const isCreateFormSchemaOk = ticketCreateFormSchema.safeParse(createFormValuesWatched).success;

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setIsLoading(true);
      setError("");
      setCategoryError("");

      try {
        const ticketRes = await getMyTickets();
        const data = ticketRes.data;

        if (active) {
          const rows = Array.isArray(data) ? data : [];
          setTickets(rows.map(normalizeTicketFromApi));
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load your tickets.");
        }
      }

      try {
        const categoryRes = await getCategories();
        const categoryData = categoryRes.data;
        if (active) {
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (loadError) {
        if (active) {
          setCategoryError(loadError.message || "Unable to load categories.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    editEvidenceFilesRef.current = editEvidenceFiles;
  }, [editEvidenceFiles]);

  useEffect(() => {
    detailTicketRef.current = detailTicket;
  }, [detailTicket]);

  useEffect(() => {
    pendingRemovedAttachmentIdsRef.current = pendingRemovedAttachmentIds;
  }, [pendingRemovedAttachmentIds]);

  useEffect(() => {
    let active = true;
    async function loadSubCategoryLookup() {
      if (!categories.length) {
        setSubCategoryById({});
        return;
      }
      const pairs = await Promise.all(
        categories.map(async (category) => {
          try {
            const res = await getSubCategories(category.id);
            const items = Array.isArray(res.data) ? res.data : [];
            return items.map((item) => [item.id, item.name]);
          } catch {
            return [];
          }
        }),
      );
      if (!active) return;
      setSubCategoryById(Object.fromEntries(pairs.flat()));
    }
    loadSubCategoryLookup();
    return () => {
      active = false;
    };
  }, [categories]);

  useEffect(() => {
    let active = true;
    const categoryId = watchCategoryId;
    if (!categoryId) {
      setSubCategories([]);
      return () => {
        active = false;
      };
    }
    async function loadSubCategories() {
      try {
        const res = await getSubCategories(categoryId);
        if (active) {
          setSubCategories(Array.isArray(res.data) ? res.data : []);
        }
      } catch (subError) {
        if (active) {
          setSubCategories([]);
          setError(subError.message || "Unable to load subcategories.");
        }
      }
    }
    loadSubCategories();
    return () => {
      active = false;
    };
  }, [watchCategoryId]);

  useEffect(() => {
    if (!isFormOpen) return;
    resetCreateForm(createTicketDefaultValues);
    setCategorySearch("");
    setAttachments([]);
    setSuggestion(null);
    setError("");
  }, [isFormOpen, resetCreateForm]);

  useEffect(() => {
    if (detailSubView !== "edit" || !editFormData.categoryId) {
      setEditSubCategories([]);
      return undefined;
    }
    let active = true;
    async function loadEditSubs() {
      try {
        const res = await getSubCategories(editFormData.categoryId);
        if (active) {
          setEditSubCategories(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (active) {
          setEditSubCategories([]);
        }
      }
    }
    loadEditSubs();
    return () => {
      active = false;
    };
  }, [detailSubView, editFormData.categoryId]);

  const handleCategorySearchChange = (event) => {
    const value = event.target.value;
    setCategorySearch(value);
    setIsCategoryDropdownOpen(true);
    setActiveCategoryIndex(-1);
    setCreateValue("categoryId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setCreateValue("subCategoryId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleSelectCategory = (category) => {
    setCategorySearch(category.name || "");
    setIsCategoryDropdownOpen(false);
    setActiveCategoryIndex(-1);
    setCreateValue("categoryId", category.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setCreateValue("subCategoryId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleDescriptionSuggestion = async () => {
    const content = getCreateValues("description").trim();
    if (content.length < 5) {
      return;
    }
    try {
      const res = await getTicketSuggestion(content);
      setSuggestion(res.data);
    } catch {
      setSuggestion(null);
    }
  };

  const applySuggestion = () => {
    if (!suggestion?.matched || !suggestion?.categoryId) {
      return;
    }
    setCategorySearch(suggestion.categoryName || "");
    setIsCategoryDropdownOpen(false);
    setActiveCategoryIndex(-1);
    setCreateValue("categoryId", suggestion.categoryId, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setCreateValue("subCategoryId", suggestion.subCategoryId || "", {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const descriptionRegister = registerCreate("description");

  const handleAttachmentChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    const imageFiles = fileList.filter((file) => isImageEvidence(file.type, file.name));
    const prev = attachmentsRef.current;

    const newUniqueCount = imageFiles.filter((f) => {
      const k = `${f.name}-${f.size}-${f.lastModified}`;
      return !prev.some((p) => `${p.name}-${p.size}-${p.lastModified}` === k);
    }).length;
    const overflow = prev.length + newUniqueCount > MAX_EVIDENCE_IMAGES;

    if (fileList.length !== imageFiles.length) {
      setError("Only image attachments are allowed.");
    } else if (overflow) {
      setError(`You can upload up to ${MAX_EVIDENCE_IMAGES} images per ticket.`);
    } else {
      setError("");
    }

    setAttachments(mergeEvidenceFiles(prev, imageFiles));
    event.target.value = "";
  };

  const onCreateTicketSubmit = async (values) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (attachments.length > MAX_EVIDENCE_IMAGES) {
        throw new Error(`You can upload up to ${MAX_EVIDENCE_IMAGES} images per ticket.`);
      }

      const res = await createTicket({
        title: values.title.trim(),
        description: composeTicketDescription(values),
        categoryId: values.categoryId,
        subCategoryId: values.subCategoryId,
        suggestions:
          suggestion?.matched && suggestion?.subCategoryName
            ? [suggestion.subCategoryName]
            : [],
      });

      const ticket = res.data;

      let uploadedCount = 0;
      let ticketForList = ticket;
      if (ticket?.id != null && attachments.length > 0) {
        // Upload one at a time so server read-modify-save on the ticket document cannot race and drop files.
        for (const file of attachments) {
          await uploadFile(ticket.id, file);
          uploadedCount += 1;
        }
        // Create response has no attachments; refetch so the list (and detail view) include them.
        try {
          const freshRes = await getTicketById(ticket.id);
          ticketForList = normalizeTicketFromApi(freshRes.data);
        } catch {
          // keep create response; user can refresh to see evidence
        }
      }

      ticketForList = normalizeTicketFromApi(ticketForList);

      const idPart = ticket?.id != null ? ` (#${ticket.id})` : "";
      const attachmentPart =
        uploadedCount > 0
          ? ` with ${uploadedCount} image attachment${uploadedCount > 1 ? "s" : ""}`
          : "";
      setSuccessMessage(`Ticket submitted successfully${idPart}${attachmentPart}.`);
      setTickets((previous) => [ticketForList, ...previous]);
      resetCreateForm(createTicketDefaultValues);
      setCategorySearch("");
      setAttachments([]);
      setSuggestion(null);
      setIsFormOpen(false);
    } catch (submitError) {
      setError(submitError.message || "Unable to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredTickets = useMemo(() => {
    const q = ticketListQuery.trim().toLowerCase();
    const statusKey = filterStatus.trim();

    return tickets.filter((ticket) => {
      if (filterCategoryId && ticket.categoryId !== filterCategoryId) {
        return false;
      }

      const parsed = parseTicketDescription(ticket.description);
      if (filterPriority && (parsed.priority || "Normal") !== filterPriority) {
        return false;
      }

      if (statusKey && normalizeTicketStatus(ticket.status) !== statusKey) {
        return false;
      }

      if (q) {
        const category = categoryById[ticket.categoryId];
        const categoryName = (category?.name || "").toLowerCase();
        const subName = (subCategoryById[ticket.subCategoryId] || "").toLowerCase();
        const title = (ticket.title || "").toLowerCase();
        const content = (parsed.content || "").toLowerCase();
        const location = (parsed.location || "").toLowerCase();
        const idStr = String(ticket.id || "").toLowerCase();
        const haystack = `${title} ${content} ${location} ${categoryName} ${subName} ${idStr}`;
        if (!haystack.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    ticketListQuery,
    filterStatus,
    filterCategoryId,
    filterPriority,
    categoryById,
    subCategoryById,
  ]);

  const hasActiveTicketFilters =
    Boolean(ticketListQuery.trim()) ||
    Boolean(filterStatus) ||
    Boolean(filterCategoryId) ||
    Boolean(filterPriority);

  const clearTicketFilters = () => {
    setTicketListQuery("");
    setFilterStatus("");
    setFilterCategoryId("");
    setFilterPriority("");
  };

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      category.name?.toLowerCase().includes(query),
    );
  }, [categories, categorySearch]);

  const handleCategorySearchKeyDown = (event) => {
    if (!filteredCategories.length) {
      if (event.key === "Escape") {
        setIsCategoryDropdownOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsCategoryDropdownOpen(true);
      setActiveCategoryIndex((previous) =>
        previous < filteredCategories.length - 1 ? previous + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsCategoryDropdownOpen(true);
      setActiveCategoryIndex((previous) =>
        previous > 0 ? previous - 1 : filteredCategories.length - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      if (isCategoryDropdownOpen && activeCategoryIndex >= 0) {
        event.preventDefault();
        handleSelectCategory(filteredCategories[activeCategoryIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsCategoryDropdownOpen(false);
      setActiveCategoryIndex(-1);
    }
  };

  const ticketDetailView = useMemo(() => {
    if (!detailTicket) return null;
    const parsed = parseTicketDescription(detailTicket.description);
    const category = categoryById[detailTicket.categoryId];
    const categoryName = category?.name || "";
    return {
      parsed,
      categoryLabel: formatCategoryLabel(categoryName),
      subCategoryLabel: subCategoryById[detailTicket.subCategoryId] || "—",
      thumbSrc: getTicketThumbnailForCategory(categoryName),
      statusToken: toToken(detailTicket.status || "open"),
      suggestions: Array.isArray(detailTicket.suggestions) ? detailTicket.suggestions : [],
    };
  }, [detailTicket, categoryById, subCategoryById]);

  const evidenceAttachmentKey = useMemo(() => {
    if (!detailTicket?.attachments?.length) return "";
    return detailTicket.attachments.map((a) => a?.id).join("|");
  }, [detailTicket?.attachments]);

  const visibleEditAttachments = useMemo(() => {
    if (detailSubView !== "edit" || !detailTicket) return [];
    const list = Array.isArray(detailTicket.attachments) ? detailTicket.attachments : [];
    const removed = new Set(pendingRemovedAttachmentIds);
    return list.filter((a) => a?.id && !removed.has(a.id));
  }, [detailSubView, detailTicket, detailTicket?.attachments, pendingRemovedAttachmentIds]);

  const editMaxNewEvidenceSlots = useMemo(() => {
    if (detailSubView !== "edit" || !detailTicket) return MAX_EVIDENCE_IMAGES;
    const n = Array.isArray(detailTicket.attachments) ? detailTicket.attachments.length : 0;
    const removed = pendingRemovedAttachmentIds.length;
    const effectiveKept = Math.max(0, n - removed);
    const pendingNew = editEvidenceFiles.length;
    return Math.max(0, MAX_EVIDENCE_IMAGES - effectiveKept - pendingNew);
  }, [
    detailSubView,
    detailTicket,
    evidenceAttachmentKey,
    pendingRemovedAttachmentIds.length,
    editEvidenceFiles.length,
  ]);

  useEffect(() => {
    const showEvidence =
      detailSubView === "details" || detailSubView === "edit";
    if (!detailTicket?.id || !showEvidence) {
      return undefined;
    }
    const atts = Array.isArray(detailTicket.attachments) ? detailTicket.attachments : [];
    if (atts.length === 0) {
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
      for (const att of atts) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(detailTicket.id, att.id);
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip failed preview */
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
  }, [detailTicket?.id, evidenceAttachmentKey, detailSubView]);

  useEffect(() => {
    if (detailSubView === "details" || detailSubView === "edit") {
      return;
    }
    setEvidencePreviewById((prev) => {
      Object.values(prev).forEach((entry) => {
        if (entry?.url) URL.revokeObjectURL(entry.url);
      });
      return {};
    });
  }, [detailSubView]);

  const withdrawFormValid = useMemo(() => {
    if (!withdrawReason) return false;
    if (withdrawReason === "OTHER") return withdrawOtherReason.trim().length > 0;
    return true;
  }, [withdrawReason, withdrawOtherReason]);

  const closeDetailModal = () => {
    setEvidencePreviewById((prev) => {
      Object.values(prev).forEach((entry) => {
        if (entry?.url) URL.revokeObjectURL(entry.url);
      });
      return {};
    });
    setEditEvidenceFiles([]);
    setPendingRemovedAttachmentIds([]);
    setDetailTicket(null);
    setDetailSubView("details");
    setUpdateError("");
    setUpdateBusy(false);
    setWithdrawReason("");
    setWithdrawOtherReason("");
  };

  const openEditMode = () => {
    if (!detailTicket) return;
    const parsed = parseTicketDescription(detailTicket.description);
    setEditFormData({
      title: detailTicket.title || "",
      description: parsed.content || "",
      location: parsed.location || "",
      categoryId: detailTicket.categoryId || "",
      subCategoryId: detailTicket.subCategoryId || "",
      priority: parsed.priority || "Normal",
      preferredContactMethod: parsed.contactMethod || "Phone",
      preferredContactDetails: parsed.contactDetails || "",
    });
    setUpdateError("");
    setEditEvidenceFiles([]);
    setPendingRemovedAttachmentIds([]);
    setDetailSubView("edit");
  };

  const handleEditEvidenceChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    const imageFiles = fileList.filter((file) => isImageEvidence(file.type, file.name));
    const prev = editEvidenceFilesRef.current;
    const existingSaved = detailTicketRef.current?.attachments?.length ?? 0;
    const removedCount = pendingRemovedAttachmentIdsRef.current?.length ?? 0;
    const effectiveExisting = Math.max(0, existingSaved - removedCount);
    const maxPending = Math.max(0, MAX_EVIDENCE_IMAGES - effectiveExisting);

    const newUniqueCount = imageFiles.filter((f) => {
      const k = `${f.name}-${f.size}-${f.lastModified}`;
      return !prev.some((p) => `${p.name}-${p.size}-${p.lastModified}` === k);
    }).length;
    const overflow = prev.length + newUniqueCount > maxPending;

    if (fileList.length !== imageFiles.length) {
      setUpdateError("Only image files can be attached as evidence.");
    } else if (overflow) {
      setUpdateError(
        maxPending === 0
          ? `You already have ${MAX_EVIDENCE_IMAGES} images. Remove one to add another.`
          : `You can add up to ${maxPending} more image${maxPending === 1 ? "" : "s"} (${MAX_EVIDENCE_IMAGES} total).`,
      );
    } else {
      setUpdateError("");
    }

    setEditEvidenceFiles(mergeEvidenceFiles(prev, imageFiles, maxPending));
    event.target.value = "";
  };

  const handleRemoveEvidenceAttachment = (attachmentId) => {
    if (!attachmentId) return;
    setUpdateError("");
    setPendingRemovedAttachmentIds((prev) =>
      prev.includes(attachmentId) ? prev : [...prev, attachmentId],
    );
  };

  useEffect(() => {
    if (detailSubView !== "edit") return;
    const n = Array.isArray(detailTicket?.attachments) ? detailTicket.attachments.length : 0;
    const effectiveKept = Math.max(0, n - pendingRemovedAttachmentIds.length);
    const maxPending = Math.max(0, MAX_EVIDENCE_IMAGES - effectiveKept);
    setEditEvidenceFiles((prev) => (prev.length <= maxPending ? prev : prev.slice(0, maxPending)));
  }, [detailSubView, detailTicket, evidenceAttachmentKey, pendingRemovedAttachmentIds.length]);

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "categoryId" ? { subCategoryId: "" } : {}),
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!detailTicket?.id) return;
    setUpdateBusy(true);
    setUpdateError("");
    try {
      if (!editFormData.title.trim()) {
        throw new Error("Title is required.");
      }
      if (!editFormData.description.trim()) {
        throw new Error("Description is required.");
      }
      if (!editFormData.categoryId) {
        throw new Error("Please select a category.");
      }
      if (!editFormData.subCategoryId) {
        throw new Error("Subcategory is required.");
      }
      if (!editFormData.location.trim()) {
        throw new Error("Resource / Location is required.");
      }
      if (!editFormData.priority) {
        throw new Error("Priority is required.");
      }
      if (!editFormData.preferredContactMethod) {
        throw new Error("Preferred contact method is required.");
      }
      if (!editFormData.preferredContactDetails.trim()) {
        throw new Error("Preferred contact details are required.");
      }
      const pendingEvidence = editEvidenceFiles;
      const pendingRemoval = pendingRemovedAttachmentIds;
      const savedCount = detailTicket.attachments?.length ?? 0;
      const afterDeletes = savedCount - pendingRemoval.length;
      if (afterDeletes < 0) {
        throw new Error("Invalid attachment state. Please reopen the editor.");
      }
      if (afterDeletes + pendingEvidence.length > MAX_EVIDENCE_IMAGES) {
        throw new Error(
          `You can have at most ${MAX_EVIDENCE_IMAGES} evidence images on a ticket (including new uploads).`,
        );
      }

      const res = await updateMyTicket(detailTicket.id, {
        title: editFormData.title.trim(),
        description: composeTicketDescription(editFormData),
        categoryId: editFormData.categoryId,
        subCategoryId: editFormData.subCategoryId,
        suggestions: Array.isArray(detailTicket.suggestions) ? detailTicket.suggestions : [],
      });
      let merged = normalizeTicketFromApi(res.data);

      for (const aid of pendingRemoval) {
        const delRes = await deleteAttachment(detailTicket.id, aid);
        merged = normalizeTicketFromApi(delRes.data);
      }

      if (pendingEvidence.length > 0) {
        for (const file of pendingEvidence) {
          await uploadFile(merged.id, file);
        }
        const freshRes = await getTicketById(merged.id);
        merged = normalizeTicketFromApi(freshRes.data);
      } else if (pendingRemoval.length > 0) {
        /* merged already set from last deleteAttachment */
      }

      setTickets((previous) => previous.map((t) => (t.id === merged.id ? merged : t)));
      setDetailTicket(merged);
      setEditEvidenceFiles([]);
      setPendingRemovedAttachmentIds([]);
      setDetailSubView("details");
      const didEvidence =
        pendingEvidence.length > 0 || pendingRemoval.length > 0;
      setSuccessMessage(
        didEvidence ? "Ticket updated and evidence saved." : "Ticket updated successfully.",
      );
    } catch (err) {
      setUpdateError(err.message || "Unable to update ticket.");
    } finally {
      setUpdateBusy(false);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!detailTicket?.id) return;
    if (!withdrawReason) {
      setUpdateError("Please select a reason for withdrawal.");
      return;
    }
    if (withdrawReason === "OTHER" && !withdrawOtherReason.trim()) {
      setUpdateError("Please describe your reason when selecting Other.");
      return;
    }
    setUpdateBusy(true);
    setUpdateError("");
    try {
      const payload = { reason: withdrawReason };
      if (withdrawReason === "OTHER") {
        payload.otherReason = withdrawOtherReason.trim();
      }
      const res = await withdrawMyTicket(detailTicket.id, payload);
      const updated = normalizeTicketFromApi(res.data);
      setTickets((previous) => previous.map((t) => (t.id === updated.id ? updated : t)));
      setDetailTicket(updated);
      setDetailSubView("details");
      setSuccessMessage("Your ticket has been withdrawn.");
      setWithdrawReason("");
      setWithdrawOtherReason("");
    } catch (err) {
      setUpdateError(err.message || "Unable to withdraw ticket.");
    } finally {
      setUpdateBusy(false);
    }
  };

  const detailModalTitle =
    detailSubView === "manage"
      ? "Update ticket"
      : detailSubView === "edit"
        ? "Edit ticket details"
        : detailSubView === "withdraw"
          ? "Withdraw complaint"
          : "Ticket details";

  if (isLoading) {
    return <LoadingSpinner label="Loading your tickets..." />;
  }

  const showScrollableTicketList = tickets.length > 0 && filteredTickets.length > 0;

  return (
    <>
      <div
        className={`my-tickets-page${showScrollableTicketList ? " my-tickets-page--fill-viewport" : ""}`}
      >
        <div className="my-tickets-sticky-toolbar">
          <section className="my-tickets-header-section" aria-label="My Tickets overview">
            <div className="my-tickets-header-inner">
              <div className="my-tickets-toolbar-panel">
                <div className="my-tickets-hero-main">
                  <div className="my-tickets-hero-illustration" aria-hidden="true">
                    <img alt="" src={maintenanceIllustration} />
                  </div>
                  <div className="my-tickets-hero-copy">
                    <h2>My Tickets</h2>
                    <p>Track maintenance and incident requests</p>
                  </div>
                  <div className="my-tickets-hero-action">
                    <Button
                      className="my-tickets-create-top-button"
                      onClick={() => setIsFormOpen((previous) => !previous)}
                      variant={isFormOpen ? "ghost" : "primary"}
                    >
                      {isFormOpen ? "Cancel" : "Create Ticket"}
                    </Button>
                  </div>
                </div>

                {tickets.length > 0 ? (
                  <div className="my-tickets-filters" aria-label="Search and filter tickets">
                    <div className="my-tickets-filters-search-row">
                      <label className="my-tickets-filters-search">
                        <span>Search</span>
                        <input
                          autoComplete="off"
                          onChange={(event) => setTicketListQuery(event.target.value)}
                          placeholder="Title, description, location, category, or ticket ID"
                          type="search"
                          value={ticketListQuery}
                        />
                      </label>
                    </div>
                    <div className="my-tickets-filters-controls">
                      <label className="my-tickets-filter-field">
                        <span>Status</span>
                        <select onChange={(event) => setFilterStatus(event.target.value)} value={filterStatus}>
                          <option value="">All statuses</option>
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </label>
                      <label className="my-tickets-filter-field">
                        <span>Category</span>
                        <select
                          onChange={(event) => setFilterCategoryId(event.target.value)}
                          value={filterCategoryId}
                        >
                          <option value="">All categories</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="my-tickets-filter-field">
                        <span>Priority</span>
                        <select onChange={(event) => setFilterPriority(event.target.value)} value={filterPriority}>
                          <option value="">All priorities</option>
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </label>
                      {hasActiveTicketFilters ? (
                        <Button onClick={clearTicketFilters} type="button" variant="ghost">
                          Clear filters
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <Card className="my-tickets-content-card">
          {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
          {error ? <p className="alert alert-error">{error}</p> : null}
          {categoryError ? <p className="alert alert-error">{categoryError}</p> : null}

          {tickets.length === 0 ? (
            <p className="supporting-text">No tickets yet. Use &quot;Create Ticket&quot; to submit a request.</p>
          ) : filteredTickets.length === 0 ? (
            <p className="supporting-text my-tickets-filter-empty">
              No tickets match your search or filters. Try adjusting or{" "}
              <button className="link-button" onClick={clearTicketFilters} type="button">
                clear filters
              </button>
              .
            </p>
          ) : (
            <div className="my-tickets-list-scroll" role="region" aria-label="Your tickets">
              <div className="list-stack my-tickets-list-stack">
                {filteredTickets.map((ticket, index) => {
                  const category = categoryById[ticket.categoryId];
                  const parsed = parseTicketDescription(ticket.description);
                  const categoryName = category?.name || "";
                  const thumbSrc = getTicketThumbnailForCategory(categoryName);
                  const locationLine = [parsed.location || "—", formatCategoryLabel(categoryName)]
                    .filter(Boolean)
                    .join(" | ");
                  const listStatusToken = toToken(ticket.status || "open");
                  return (
                    <article
                      className="my-ticket-card"
                      key={ticket.id != null ? ticket.id : `my-ticket-${index}`}
                    >
                      <div className="my-ticket-card-thumb" aria-hidden="true">
                        <img alt="" src={thumbSrc} />
                      </div>
                      <div className="my-ticket-card-main">
                        <h3 className="my-ticket-card-title">{ticket.title || "Untitled Ticket"}</h3>
                        <p className="my-ticket-card-line my-ticket-card-line--meta">{locationLine}</p>
                        <p className="my-ticket-card-line my-ticket-card-line--sub">
                          Priority: {parsed.priority || "Normal"} | Assignee: Unassigned
                        </p>
                      </div>
                      <div className="my-ticket-card-status">
                        <span
                          className={`my-ticket-card-badge status-badge ${listStatusToken}`}
                        >
                          {formatTicketStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <div className="my-ticket-card-actions">
                        <Button
                          className="my-ticket-view-details"
                          onClick={async () => {
                            setUpdateError("");
                            setDetailSubView("details");
                            if (ticket?.id == null) {
                              setDetailTicket(normalizeTicketFromApi(ticket));
                              return;
                            }
                            try {
                              const fresh = await getTicketById(ticket.id);
                              setDetailTicket(normalizeTicketFromApi(fresh.data));
                            } catch (err) {
                              setUpdateError(err.message || "Unable to load ticket details.");
                              setDetailTicket(normalizeTicketFromApi(ticket));
                            }
                          }}
                          type="button"
                          variant="secondary"
                        >
                          View Details
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {detailTicket && ticketDetailView ? (
        <div
          className="modal-backdrop"
          onClick={() => !updateBusy && closeDetailModal()}
          role="presentation"
        >
          <div
            className="modal-panel modal-panel--ticket-detail"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
          >
            <div className="modal-header">
              <h3 id="ticket-detail-title">{detailModalTitle}</h3>
              <button
                className="modal-close"
                disabled={updateBusy}
                onClick={closeDetailModal}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="modal-content ticket-detail-modal">
              {updateError ? <p className="alert alert-error">{updateError}</p> : null}

              {detailSubView === "details" ? (
                <>
                  <div className="ticket-detail-modal-hero">
                    <div className="ticket-detail-modal-thumb" aria-hidden="true">
                      <img alt="" src={ticketDetailView.thumbSrc} />
                    </div>
                    <div className="ticket-detail-modal-hero-text">
                      <p className="ticket-detail-ticket-id">
                        {detailTicket.id != null ? `Ticket #${detailTicket.id}` : "Ticket"}
                      </p>
                      <h4 className="ticket-detail-heading">{detailTicket.title || "Untitled Ticket"}</h4>
                      <span
                        className={`my-ticket-card-badge status-badge ${ticketDetailView.statusToken}`}
                      >
                        {formatTicketStatusLabel(detailTicket.status)}
                      </span>
                    </div>
                  </div>
                  <div className="ticket-detail-modal-body">
                    <div className="ticket-detail-modal-fields">
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Category</div>
                        <div className="ticket-detail-value">{ticketDetailView.categoryLabel}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Subcategory</div>
                        <div className="ticket-detail-value">{ticketDetailView.subCategoryLabel}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Location</div>
                        <div className="ticket-detail-value">{ticketDetailView.parsed.location || "—"}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Priority</div>
                        <div className="ticket-detail-value">{ticketDetailView.parsed.priority || "Normal"}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Preferred contact</div>
                        <div className="ticket-detail-value">
                          {ticketDetailView.parsed.contactMethod || "—"}
                          {ticketDetailView.parsed.contactDetails
                            ? ` · ${ticketDetailView.parsed.contactDetails}`
                            : ""}
                        </div>
                      </div>
                      {detailTicket.createdAt ? (
                        <div className="ticket-detail-row">
                          <div className="ticket-detail-label">Submitted</div>
                          <div className="ticket-detail-value">{formatDateTime(detailTicket.createdAt)}</div>
                        </div>
                      ) : null}
                      {normalizeTicketStatus(detailTicket.status) === "WITHDRAWN" &&
                      formatWithdrawalReasonForDisplay(detailTicket) ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Withdrawal reason</div>
                          <div className="ticket-detail-value">{formatWithdrawalReasonForDisplay(detailTicket)}</div>
                        </div>
                      ) : null}
                      <div className="ticket-detail-row ticket-detail-row--block">
                        <div className="ticket-detail-label">Description</div>
                        <div className="ticket-detail-value ticket-detail-description">
                          {ticketDetailView.parsed.content || "No description provided."}
                        </div>
                      </div>
                      {ticketDetailView.suggestions.length > 0 ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Suggestions</div>
                          <div className="ticket-detail-value">{ticketDetailView.suggestions.join(", ")}</div>
                        </div>
                      ) : null}
                    </div>
                    <aside className="ticket-detail-modal-evidence" aria-label="Evidence">
                      <div className="ticket-detail-label">Evidence</div>
                      <div className="ticket-detail-evidence-panel">
                        {Array.isArray(detailTicket.attachments) && detailTicket.attachments.length > 0 ? (
                          <EvidenceAttachmentThumbnails
                            attachments={detailTicket.attachments}
                            evidencePreviewById={evidencePreviewById}
                          />
                        ) : (
                          <div className="ticket-detail-evidence-empty">
                            <img alt="" className="ticket-detail-evidence-placeholder-img" src={maintenanceIllustration} />
                            <p className="ticket-detail-evidence-placeholder-text">No photo evidence yet</p>
                            <p className="ticket-detail-evidence-placeholder-hint">
                              Use Update → Edit details to add up to 3 images.
                            </p>
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                  <div className="modal-actions ticket-detail-modal-actions">
                    <Button onClick={closeDetailModal} type="button" variant="secondary">
                      Close
                    </Button>
                    {isTicketEditable(detailTicket.status) ? (
                      <Button
                        onClick={() => {
                          setUpdateError("");
                          setDetailSubView("manage");
                        }}
                        type="button"
                        variant="primary"
                      >
                        Update
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : null}

              {detailSubView === "manage" ? (
                <div className="ticket-manage-flow">
                  <p className="supporting-text">
                    Update the information on this ticket, or withdraw it if you no longer need help.
                  </p>
                  <div className="ticket-manage-flow-actions">
                    <Button onClick={openEditMode} type="button" variant="primary">
                      Update details
                    </Button>
                    <Button
                      onClick={() => {
                        setUpdateError("");
                        setWithdrawReason("");
                        setWithdrawOtherReason("");
                        setDetailSubView("withdraw");
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Withdraw complaint
                    </Button>
                  </div>
                  <div className="modal-actions">
                    <Button
                      onClick={() => {
                        setUpdateError("");
                        setDetailSubView("details");
                      }}
                      type="button"
                      variant="ghost"
                    >
                      Back to details
                    </Button>
                  </div>
                </div>
              ) : null}

              {detailSubView === "withdraw" ? (
                <div className="ticket-manage-flow">
                  <p className="supporting-text">
                    Withdrawing marks this ticket as closed on your side. Staff will treat it as cancelled.
                  </p>
                  <label className="field field-full">
                    <span>
                      Reason for withdrawal <span className="required-mark">*</span>
                    </span>
                    <select
                      onChange={(event) => {
                        const value = event.target.value;
                        setWithdrawReason(value);
                        if (value !== "OTHER") {
                          setWithdrawOtherReason("");
                        }
                      }}
                      value={withdrawReason}
                    >
                      <option value="">Select a reason…</option>
                      {WITHDRAWAL_REASON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {withdrawReason === "OTHER" ? (
                    <label className="field field-full">
                      <span>
                        Describe your reason <span className="required-mark">*</span>
                      </span>
                      <textarea
                        onChange={(event) => setWithdrawOtherReason(event.target.value)}
                        placeholder="Briefly explain why you are withdrawing this request"
                        rows={3}
                        value={withdrawOtherReason}
                      />
                    </label>
                  ) : null}
                  <div className="modal-actions ticket-detail-modal-actions">
                    <Button
                      disabled={updateBusy}
                      onClick={() => {
                        setUpdateError("");
                        setWithdrawReason("");
                        setWithdrawOtherReason("");
                        setDetailSubView("manage");
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Back
                    </Button>
                    <Button
                      disabled={updateBusy || !withdrawFormValid}
                      onClick={handleWithdrawConfirm}
                      type="button"
                      variant="primary"
                    >
                      {updateBusy ? "Working..." : "Confirm withdraw"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {detailSubView === "edit" ? (
                <form
                  className="form-grid my-tickets-create-form my-tickets-create-form-modal"
                  onSubmit={handleEditSubmit}
                >
                  <label className="field field-full">
                    <span>
                      Title <span className="required-mark">*</span>
                    </span>
                    <input
                      name="title"
                      onChange={handleEditChange}
                      required
                      type="text"
                      value={editFormData.title}
                    />
                  </label>
                  <label className="field field-full">
                    <span>
                      Description <span className="required-mark">*</span>
                    </span>
                    <textarea
                      name="description"
                      onChange={handleEditChange}
                      required
                      rows="5"
                      value={editFormData.description}
                    />
                  </label>
                  <label className="field field-full">
                    <span>
                      Category <span className="required-mark">*</span>
                    </span>
                    <select name="categoryId" onChange={handleEditChange} required value={editFormData.categoryId}>
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>
                      Subcategory <span className="required-mark">*</span>
                    </span>
                    <select
                      name="subCategoryId"
                      onChange={handleEditChange}
                      required
                      value={editFormData.subCategoryId}
                      disabled={!editFormData.categoryId}
                    >
                      <option value="">
                        {editFormData.categoryId ? "Select subcategory" : "Select category first"}
                      </option>
                      {editSubCategories.map((subCategory) => (
                        <option key={subCategory.id} value={subCategory.id}>
                          {subCategory.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>
                      Resource / Location <span className="required-mark">*</span>
                    </span>
                    <input
                      name="location"
                      onChange={handleEditChange}
                      required
                      type="text"
                      value={editFormData.location}
                    />
                  </label>
                  <label className="field">
                    <span>
                      Priority <span className="required-mark">*</span>
                    </span>
                    <select name="priority" onChange={handleEditChange} value={editFormData.priority}>
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>
                      Preferred contact <span className="required-mark">*</span>
                    </span>
                    <select
                      name="preferredContactMethod"
                      onChange={handleEditChange}
                      value={editFormData.preferredContactMethod}
                    >
                      <option value="Phone">Phone</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </label>
                  <label className="field field-full">
                    <span>
                      Contact details <span className="required-mark">*</span>
                    </span>
                    <input
                      name="preferredContactDetails"
                      onChange={handleEditChange}
                      required
                      type="text"
                      value={editFormData.preferredContactDetails}
                    />
                  </label>
                  {Array.isArray(detailTicket.attachments) && detailTicket.attachments.length > 0 ? (
                    <div className="field field-full" aria-label="Current evidence">
                      <span>Current evidence</span>
                      {pendingRemovedAttachmentIds.length > 0 ? (
                        <small className="supporting-text">
                          Removals apply when you save. Back cancels unsaved removals and new file picks.
                        </small>
                      ) : null}
                      {visibleEditAttachments.length > 0 ? (
                        <div className="ticket-detail-evidence-panel ticket-detail-evidence-panel--edit-inline">
                          <EvidenceAttachmentThumbnails
                            attachments={visibleEditAttachments}
                            evidencePreviewById={evidencePreviewById}
                            onRemoveAttachment={handleRemoveEvidenceAttachment}
                            removeButtonLabel="Remove"
                            showRemove
                          />
                        </div>
                      ) : (
                        <p className="supporting-text">
                          All current images are marked for removal. They will be deleted from the server when
                          you save.
                        </p>
                      )}
                    </div>
                  ) : null}
                  <label className="field field-full">
                    <span>
                      Add evidence (images, max {MAX_EVIDENCE_IMAGES} total
                      {editMaxNewEvidenceSlots > 0
                        ? ` — you can add ${editMaxNewEvidenceSlots} more`
                        : " — remove an image above to add more"}
                      )
                    </span>
                    <input
                      accept="image/*"
                      disabled={updateBusy || editMaxNewEvidenceSlots === 0}
                      multiple
                      onChange={handleEditEvidenceChange}
                      type="file"
                    />
                    <small className="supporting-text">
                      {editMaxNewEvidenceSlots === 0
                        ? `You already have ${MAX_EVIDENCE_IMAGES} images. Remove one to add a different file.`
                        : "Select several at once (Ctrl/Cmd+click) or choose again to add more. New files upload when you save."}
                      {editEvidenceFiles.length > 0 ? (
                        <>
                          {" "}
                          Selected: {editEvidenceFiles.map((f) => f.name).join(", ")}
                        </>
                      ) : null}
                    </small>
                  </label>
                  <div className="field-full">
                    <div className="modal-actions ticket-detail-modal-actions">
                      <Button
                        disabled={updateBusy}
                        onClick={() => {
                          setUpdateError("");
                          setPendingRemovedAttachmentIds([]);
                          setEditEvidenceFiles([]);
                          setDetailSubView("manage");
                        }}
                        type="button"
                        variant="secondary"
                      >
                        Back
                      </Button>
                      <Button disabled={updateBusy} type="submit" variant="primary">
                        {updateBusy ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => !isSubmitting && setIsFormOpen(false)}
          role="presentation"
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-ticket-title"
          >
            <div className="modal-header">
              <h3 id="create-ticket-title">Create Ticket</h3>
              <button
                className="modal-close"
                disabled={isSubmitting}
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <form
                className="form-grid my-tickets-create-form my-tickets-create-form-modal"
                noValidate
                onSubmit={submitCreateTicket(onCreateTicketSubmit)}
              >
                <input type="hidden" {...registerCreate("categoryId")} />

                <label className={`field field-full${createErrors.title ? " field--invalid" : ""}`}>
                  <span>
                    Title <span className="required-mark">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Short summary of the issue"
                    maxLength={TITLE_MAX_LENGTH}
                    aria-invalid={createErrors.title ? "true" : "false"}
                    {...registerCreate("title")}
                  />
                  {createErrors.title?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.title.message}
                    </p>
                  ) : null}
                  <p className="field-char-count" aria-live="polite">
                    {(watchedCreateTitle || "").length} / {TITLE_MAX_LENGTH}
                  </p>
                </label>

                <label className={`field field-full${createErrors.description ? " field--invalid" : ""}`}>
                  <span>
                    Description <span className="required-mark">*</span>
                  </span>
                  <textarea
                    placeholder="What happened, where, and any relevant details"
                    rows={5}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    aria-invalid={createErrors.description ? "true" : "false"}
                    {...descriptionRegister}
                    onBlur={(e) => {
                      descriptionRegister.onBlur(e);
                      void handleDescriptionSuggestion();
                    }}
                  />
                  {createErrors.description?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.description.message}
                    </p>
                  ) : null}
                  <p className="field-char-count" aria-live="polite">
                    {(watchedCreateDescription || "").length} / {DESCRIPTION_MAX_LENGTH}
                  </p>
                </label>
                {suggestion?.matched ? (
                  <div className="field field-full ticket-suggestion-box">
                    <p>
                      Suggested: {suggestion.categoryName}{" "}
                      {suggestion.subCategoryName ? `-> ${suggestion.subCategoryName}` : ""}
                    </p>
                    <Button onClick={applySuggestion} type="button" variant="secondary">
                      Apply Suggestion
                    </Button>
                  </div>
                ) : null}

                <label
                  className={`field ticket-category-field${createErrors.categoryId ? " field--invalid" : ""}`}
                >
                  <span>
                    Category <span className="required-mark">*</span>
                  </span>
                  <div className="ticket-category-stack">
                    <input
                      aria-autocomplete="list"
                      aria-expanded={isCategoryDropdownOpen}
                      aria-controls="ticket-category-results"
                      className="ticket-category-search"
                      onBlur={() => {
                        window.setTimeout(() => {
                          setIsCategoryDropdownOpen(false);
                          setActiveCategoryIndex(-1);
                        }, 120);
                      }}
                      onChange={handleCategorySearchChange}
                      onFocus={() => setIsCategoryDropdownOpen(true)}
                      onKeyDown={handleCategorySearchKeyDown}
                      placeholder="Search category"
                      type="text"
                      value={categorySearch}
                    />
                    {isCategoryDropdownOpen ? (
                      <div className="ticket-category-results" id="ticket-category-results" role="listbox">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category, index) => (
                            <button
                              className={`ticket-category-option ${
                                index === activeCategoryIndex ? "active" : ""
                              }`}
                              key={category.id}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectCategory(category)}
                              onMouseEnter={() => setActiveCategoryIndex(index)}
                              type="button"
                            >
                              <span>{category.name}</span>
                              <small>{category.color}</small>
                            </button>
                          ))
                        ) : (
                          <p className="ticket-category-empty">No matching categories</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {createErrors.categoryId?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.categoryId.message}
                    </p>
                  ) : !watchCategoryId ? (
                    <small className="supporting-text">Select a category from suggestions.</small>
                  ) : null}
                  {watchCategoryId ? (
                    <small className="supporting-text">
                      Color: {categoryById[watchCategoryId]?.color || "N/A"} | Icon:{" "}
                      {categoryById[watchCategoryId]?.icon || "N/A"}
                    </small>
                  ) : null}
                </label>

                <label className={`field${createErrors.subCategoryId ? " field--invalid" : ""}`}>
                  <span>
                    Subcategory <span className="required-mark">*</span>
                  </span>
                  <select
                    disabled={!watchCategoryId}
                    aria-invalid={createErrors.subCategoryId ? "true" : "false"}
                    {...registerCreate("subCategoryId")}
                  >
                    <option value="">
                      {watchCategoryId ? "Select Subcategory" : "Select category first"}
                    </option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                  {createErrors.subCategoryId?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.subCategoryId.message}
                    </p>
                  ) : null}
                </label>

                <label className={`field${createErrors.location ? " field--invalid" : ""}`}>
                  <span>
                    Resource / Location <span className="required-mark">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Lecture Hall A, Library 2nd Floor"
                    aria-invalid={createErrors.location ? "true" : "false"}
                    {...registerCreate("location")}
                  />
                  {createErrors.location?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.location.message}
                    </p>
                  ) : null}
                </label>

                <label className="field field-full">
                  <span>Evidence (Images up to 3)</span>
                  <input accept="image/*" multiple onChange={handleAttachmentChange} type="file" />
                  <small className="supporting-text">
                    Select several at once (Ctrl/Cmd+click) or choose again to add more, up to 3 total.
                  </small>
                  {attachments.length > 0 ? (
                    <small className="supporting-text">
                      Selected: {attachments.map((file) => file.name).join(", ")}
                    </small>
                  ) : null}
                </label>

                <label className="field">
                  <span>
                    Priority <span className="required-mark">*</span>
                  </span>
                  <select {...registerCreate("priority")}>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>

                <label className="field">
                  <span>
                    Preferred Contact Method <span className="required-mark">*</span>
                  </span>
                  <select {...registerCreate("preferredContactMethod")}>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </label>

                <label className={`field field-full${createErrors.preferredContactDetails ? " field--invalid" : ""}`}>
                  <span>
                    Preferred Contact Details <span className="required-mark">*</span>
                  </span>
                  <input
                    type="text"
                    placeholder={
                      watchedContactMethod === "Email"
                        ? "name@example.com"
                        : "10-digit mobile number"
                    }
                    autoComplete={watchedContactMethod === "Email" ? "email" : "tel"}
                    aria-invalid={createErrors.preferredContactDetails ? "true" : "false"}
                    {...registerCreate("preferredContactDetails")}
                  />
                  {createErrors.preferredContactDetails?.message ? (
                    <p className="field-error" role="alert">
                      {createErrors.preferredContactDetails.message}
                    </p>
                  ) : null}
                </label>

                <div className="field-full">
                  <Button
                    disabled={isSubmitting || !isCreateFormSchemaOk}
                    type="submit"
                    variant="primary"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MyTicketsPage;
