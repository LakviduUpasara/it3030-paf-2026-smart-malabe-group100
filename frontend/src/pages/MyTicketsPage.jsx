import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { createTicket, getMyTickets, getTicketSuggestion, uploadFile } from "../services/ticketService";
import { getCategories, getSubCategories } from "../services/categoryService";
import { toToken } from "../utils/formatters";
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
  return String(status || "Open")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

  const popularIssues = useMemo(() => {
    const counts = new Map();
    for (const ticket of tickets) {
      if (ticket.subCategoryId) {
        counts.set(ticket.subCategoryId, (counts.get(ticket.subCategoryId) || 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [tickets]);

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
          <div className="list-stack my-tickets-list-stack">
            {tickets.map((ticket, index) => {
              const category = categoryById[ticket.categoryId];
              const parsed = parseTicketDescription(ticket.description);
              const categoryName = category?.name || "";
              const thumbSrc = getTicketThumbnailForCategory(categoryName);
              const locationLine = [parsed.location || "—", formatCategoryLabel(categoryName)]
                .filter(Boolean)
                .join(" | ");
              const statusToken = toToken(ticket.status || "open");
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
                  <span className={`my-ticket-card-badge status-badge ${statusToken}`}>
                    {formatTicketStatusLabel(ticket.status)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </Card>
      {popularIssues.length > 0 ? (
        <Card title="Popular Issues">
          <p className="supporting-text">
            Most frequent issue types from your recent tickets.
          </p>
          <div className="list-stack">
            {popularIssues.map(([subCategoryId, count]) => (
              <p className="supporting-text" key={subCategoryId}>
                {subCategoryById[subCategoryId] || subCategoryId}: {count}
              </p>
            ))}
          </div>
        </Card>
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
