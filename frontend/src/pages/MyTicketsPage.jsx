import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  createTicket,
  getMyTickets,
  getTicketSuggestion,
  updateMyTicket,
  uploadFile,
  withdrawMyTicket,
} from "../services/ticketService";
import { getCategories, getSubCategories } from "../services/categoryService";
import { formatDateTime, toToken } from "../utils/formatters";
import { getTicketThumbnailForCategory } from "../utils/ticketCategoryImage";
import maintenanceIllustration from "../assets/maintenance1.png";

const initialForm = {
  title: "",
  location: "",
  categoryId: "",
  subCategoryId: "",
  priority: "Normal",
  description: "",
  preferredContactMethod: "Phone",
  preferredContactDetails: "",
};

const META_MARKER = "\n\n__META__\n";

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

function parseTicketDescription(description) {
  const raw = description || "";
  if (!raw.includes(META_MARKER)) {
    return {
      content: raw.trim(),
      location: "",
      priority: "Normal",
      contactMethod: "",
      contactDetails: "",
    };
  }
  const [contentBlock, metaBlock] = raw.split(META_MARKER);
  const parsed = {
    content: (contentBlock || "").trim(),
    location: "",
    priority: "Normal",
    contactMethod: "",
    contactDetails: "",
  };
  for (const line of (metaBlock || "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key === "location") parsed.location = value;
    if (key === "priority") parsed.priority = value;
    if (key === "contactMethod") parsed.contactMethod = value;
    if (key === "contactDetails") parsed.contactDetails = value;
  }
  return parsed;
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

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryById, setSubCategoryById] = useState({});
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailSubView, setDetailSubView] = useState("details");
  const [editFormData, setEditFormData] = useState(() => ({ ...initialForm }));
  const [editSubCategories, setEditSubCategories] = useState([]);
  const [updateError, setUpdateError] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [ticketListQuery, setTicketListQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

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
          setTickets(Array.isArray(data) ? data : []);
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
    const categoryId = formData.categoryId;
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
  }, [formData.categoryId]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "categoryId" ? { subCategoryId: "" } : {}),
    }));
  };

  const handleCategorySearchChange = (event) => {
    const value = event.target.value;
    setCategorySearch(value);
    setIsCategoryDropdownOpen(true);
    setActiveCategoryIndex(-1);
    setFormData((previous) => ({
      ...previous,
      categoryId: "",
      subCategoryId: "",
    }));
  };

  const handleSelectCategory = (category) => {
    setCategorySearch(category.name || "");
    setIsCategoryDropdownOpen(false);
    setActiveCategoryIndex(-1);
    setFormData((previous) => ({
      ...previous,
      categoryId: category.id,
      subCategoryId: "",
    }));
  };

  const handleDescriptionSuggestion = async () => {
    const content = formData.description.trim();
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
    setFormData((previous) => ({
      ...previous,
      categoryId: suggestion.categoryId,
      subCategoryId: suggestion.subCategoryId || "",
    }));
  };

  const handleAttachmentChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    const imageFiles = fileList.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== fileList.length) {
      setError("Only image attachments are allowed.");
    } else if (fileList.length > 3) {
      setError("You can upload up to 3 images per ticket.");
    } else {
      setError("");
    }

    setAttachments(imageFiles.slice(0, 3));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!formData.title.trim()) {
        throw new Error("Title is required.");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required.");
      }
      if (!formData.categoryId) {
        throw new Error("Please select a category from the list.");
      }
      if (!formData.subCategoryId) {
        throw new Error("Subcategory is required.");
      }
      if (!formData.location.trim()) {
        throw new Error("Resource / Location is required.");
      }
      if (!formData.priority) {
        throw new Error("Priority is required.");
      }
      if (!formData.preferredContactMethod) {
        throw new Error("Preferred contact method is required.");
      }
      if (!formData.preferredContactDetails.trim()) {
        throw new Error("Preferred contact details are required.");
      }
      if (attachments.length > 3) {
        throw new Error("You can upload up to 3 images per ticket.");
      }

      const res = await createTicket({
        title: formData.title.trim(),
        description: composeTicketDescription(formData),
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId,
        suggestions:
          suggestion?.matched && suggestion?.subCategoryName
            ? [suggestion.subCategoryName]
            : [],
      });

      const ticket = res.data;

      let uploadedCount = 0;
      if (ticket?.id != null && attachments.length > 0) {
        await Promise.all(
          attachments.map(async (file) => {
            await uploadFile(ticket.id, file);
            uploadedCount += 1;
          }),
        );
      }

      const idPart = ticket?.id != null ? ` (#${ticket.id})` : "";
      const attachmentPart =
        uploadedCount > 0
          ? ` with ${uploadedCount} image attachment${uploadedCount > 1 ? "s" : ""}`
          : "";
      setSuccessMessage(`Ticket submitted successfully${idPart}${attachmentPart}.`);
      setTickets((previous) => [ticket, ...previous]);
      setFormData(initialForm);
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

  const closeDetailModal = () => {
    setDetailTicket(null);
    setDetailSubView("details");
    setUpdateError("");
    setUpdateBusy(false);
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
    setDetailSubView("edit");
  };

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
      const res = await updateMyTicket(detailTicket.id, {
        title: editFormData.title.trim(),
        description: composeTicketDescription(editFormData),
        categoryId: editFormData.categoryId,
        subCategoryId: editFormData.subCategoryId,
        suggestions: Array.isArray(detailTicket.suggestions) ? detailTicket.suggestions : [],
      });
      const updated = res.data;
      setTickets((previous) => previous.map((t) => (t.id === updated.id ? updated : t)));
      setDetailTicket(updated);
      setDetailSubView("details");
      setSuccessMessage("Ticket updated successfully.");
    } catch (err) {
      setUpdateError(err.message || "Unable to update ticket.");
    } finally {
      setUpdateBusy(false);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!detailTicket?.id) return;
    setUpdateBusy(true);
    setUpdateError("");
    try {
      const res = await withdrawMyTicket(detailTicket.id);
      const updated = res.data;
      setTickets((previous) => previous.map((t) => (t.id === updated.id ? updated : t)));
      setDetailTicket(updated);
      setDetailSubView("details");
      setSuccessMessage("Your ticket has been withdrawn.");
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

  return (
    <>
      <section className="my-tickets-header-section" aria-label="My Tickets overview">
        <div className="my-tickets-header-inner">
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
        </div>
      </section>

      <Card className="my-tickets-content-card">
        {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
        {error ? <p className="alert alert-error">{error}</p> : null}
        {categoryError ? <p className="alert alert-error">{categoryError}</p> : null}

        {tickets.length === 0 ? (
          <p className="supporting-text">No tickets yet. Use &quot;Create Ticket&quot; to submit a request.</p>
        ) : (
          <>
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

            {filteredTickets.length === 0 ? (
              <p className="supporting-text my-tickets-filter-empty">
                No tickets match your search or filters. Try adjusting or{" "}
                <button className="link-button" onClick={clearTicketFilters} type="button">
                  clear filters
                </button>
                .
              </p>
            ) : (
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
                      onClick={() => {
                        setUpdateError("");
                        setDetailSubView("details");
                        setDetailTicket(ticket);
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
            )}
          </>
        )}
      </Card>

      {detailTicket && ticketDetailView ? (
        <div
          className="modal-backdrop"
          onClick={() => !updateBusy && closeDetailModal()}
          role="presentation"
        >
          <div
            className="modal-panel"
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
              {updateError && detailSubView !== "details" ? (
                <p className="alert alert-error">{updateError}</p>
              ) : null}

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
                  <div className="modal-actions ticket-detail-modal-actions">
                    <Button
                      disabled={updateBusy}
                      onClick={() => {
                        setUpdateError("");
                        setDetailSubView("manage");
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Back
                    </Button>
                    <Button
                      disabled={updateBusy}
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
                  <div className="field-full">
                    <div className="modal-actions ticket-detail-modal-actions">
                      <Button
                        disabled={updateBusy}
                        onClick={() => {
                          setUpdateError("");
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
                onSubmit={handleSubmit}
              >
                <label className="field field-full">
                  <span>
                    Title <span className="required-mark">*</span>
                  </span>
                  <input
                    name="title"
                    onChange={handleChange}
                    placeholder="Short summary of the issue"
                    required
                    type="text"
                    value={formData.title}
                  />
                </label>

                <label className="field field-full">
                  <span>
                    Description <span className="required-mark">*</span>
                  </span>
                  <textarea
                    name="description"
                    onChange={handleChange}
                    onBlur={handleDescriptionSuggestion}
                    placeholder="What happened, where, and any relevant details"
                    required
                    rows="5"
                    value={formData.description}
                  />
                </label>
                {suggestion?.matched ? (
                  <div className="field field-full ticket-suggestion-box">
                    <p>
                      Suggested: {suggestion.categoryName} {suggestion.subCategoryName ? `-> ${suggestion.subCategoryName}` : ""}
                    </p>
                    <Button onClick={applySuggestion} type="button" variant="secondary">
                      Apply Suggestion
                    </Button>
                  </div>
                ) : null}

                <label className="field ticket-category-field">
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
                  {!formData.categoryId ? (
                    <small className="supporting-text">Select a category from suggestions.</small>
                  ) : null}
                  {formData.categoryId ? (
                    <small className="supporting-text">
                      Color: {categoryById[formData.categoryId]?.color || "N/A"} | Icon:{" "}
                      {categoryById[formData.categoryId]?.icon || "N/A"}
                    </small>
                  ) : null}
                </label>

                <label className="field">
                  <span>
                    Subcategory <span className="required-mark">*</span>
                  </span>
                  <select
                    name="subCategoryId"
                    onChange={handleChange}
                    required
                    value={formData.subCategoryId}
                    disabled={!formData.categoryId}
                  >
                    <option value="">
                      {formData.categoryId ? "Select Subcategory" : "Select category first"}
                    </option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>
                    Resource / Location <span className="required-mark">*</span>
                  </span>
                  <input
                    name="location"
                    onChange={handleChange}
                    placeholder="e.g. Lecture Hall A, Library 2nd Floor"
                    required
                    type="text"
                    value={formData.location}
                  />
                </label>

                <label className="field field-full">
                  <span>Evidence (Images up to 3)</span>
                  <input accept="image/*" multiple onChange={handleAttachmentChange} type="file" />
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
                  <select name="priority" onChange={handleChange} value={formData.priority}>
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
                  <select
                    name="preferredContactMethod"
                    onChange={handleChange}
                    value={formData.preferredContactMethod}
                  >
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </label>

                <label className="field field-full">
                  <span>
                    Preferred Contact Details <span className="required-mark">*</span>
                  </span>
                  <input
                    name="preferredContactDetails"
                    onChange={handleChange}
                    placeholder="Phone number, email, or WhatsApp number"
                    required
                    type="text"
                    value={formData.preferredContactDetails}
                  />
                </label>

                <div className="field-full">
                  <Button disabled={isSubmitting} type="submit" variant="primary">
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
