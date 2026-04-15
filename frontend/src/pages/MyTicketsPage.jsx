import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { createTicket, getMyTickets, uploadFile } from "../services/ticketService";
import { toToken } from "../utils/formatters";
import maintenanceIllustration from "../assets/maintenance1.png";

const initialForm = {
  title: "",
  location: "",
  category: "",
  priority: "Normal",
  description: "",
  preferredContactMethod: "Phone",
  preferredContactDetails: "",
};

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMyTickets();
        if (active) {
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load your tickets.");
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
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
      if (attachments.length > 3) {
        throw new Error("You can upload up to 3 images per ticket.");
      }

      const ticket = await createTicket({
        title: formData.title.trim(),
        location: formData.location.trim(),
        category: formData.category.trim(),
        priority: formData.priority,
        description: formData.description.trim(),
        preferredContactMethod: formData.preferredContactMethod,
        preferredContactDetails: formData.preferredContactDetails.trim(),
      });

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
      const attachmentPart = uploadedCount > 0 ? ` with ${uploadedCount} image attachment${uploadedCount > 1 ? "s" : ""}` : "";
      setSuccessMessage(`Ticket submitted successfully${idPart}${attachmentPart}.`);
      setTickets((previous) => [{ ...ticket, ...formData }, ...previous]);
      setFormData(initialForm);
      setAttachments([]);
      setIsFormOpen(false);
    } catch (submitError) {
      setError(submitError.message || "Unable to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Button className="my-tickets-create-top-button" onClick={() => setIsFormOpen((previous) => !previous)} variant={isFormOpen ? "ghost" : "primary"}>
                {isFormOpen ? "Cancel" : "Create Ticket"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Card className="my-tickets-content-card">
        {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
        {error ? <p className="alert alert-error">{error}</p> : null}

        {tickets.length === 0 ? (
          <p className="supporting-text">No tickets yet. Use "Create Ticket" to submit a request.</p>
        ) : (
          <div className="list-stack">
            {tickets.map((ticket, index) => (
              <article className="my-ticket-item" key={ticket.id != null ? ticket.id : `my-ticket-${index}`}>
                <div className="my-ticket-main">
                  <strong>{ticket.title || "Untitled Ticket"}</strong>
                  <p className="supporting-text">
                    {ticket.location || "Campus"} | {ticket.category || "General"}
                  </p>
                  <p className="supporting-text">
                    Priority: {ticket.priority || "Normal"} | Assignee: {ticket.assignee || "Pending assignment"}
                  </p>
                  {ticket.preferredContactMethod || ticket.preferredContactDetails ? (
                    <p className="supporting-text">
                      Preferred contact: {ticket.preferredContactMethod || "N/A"} {ticket.preferredContactDetails ? `(${ticket.preferredContactDetails})` : ""}
                    </p>
                  ) : null}
                </div>
                <span className={`status-badge ${toToken(ticket.status || "open")}`}>{ticket.status || "Open"}</span>
              </article>
            ))}
          </div>
        )}
      </Card>

      {isFormOpen ? (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsFormOpen(false)} role="presentation">
          <div className="modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-ticket-title">
            <div className="modal-header">
              <h3 id="create-ticket-title">Create Ticket</h3>
              <button className="modal-close" disabled={isSubmitting} onClick={() => setIsFormOpen(false)} type="button">
                x
              </button>
            </div>
            <div className="modal-content">
              <form className="form-grid my-tickets-create-form my-tickets-create-form-modal" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Resource / Location</span>
                  <input
                    name="location"
                    onChange={handleChange}
                    placeholder="e.g. Lecture Hall A, Library 2nd Floor"
                    required
                    type="text"
                    value={formData.location}
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <input
                    name="category"
                    onChange={handleChange}
                    placeholder="e.g. Electrical, Projector, Network"
                    required
                    type="text"
                    value={formData.category}
                  />
                </label>

                <label className="field field-full">
                  <span>Title</span>
                  <input
                    name="title"
                    onChange={handleChange}
                    placeholder="Short summary of the issue"
                    required
                    type="text"
                    value={formData.title}
                  />
                </label>

                <label className="field">
                  <span>Priority</span>
                  <select name="priority" onChange={handleChange} value={formData.priority}>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>

                <label className="field">
                  <span>Preferred Contact Method</span>
                  <select name="preferredContactMethod" onChange={handleChange} value={formData.preferredContactMethod}>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </label>

                <label className="field field-full">
                  <span>Preferred Contact Details</span>
                  <input
                    name="preferredContactDetails"
                    onChange={handleChange}
                    placeholder="Phone number, email, or WhatsApp number"
                    required
                    type="text"
                    value={formData.preferredContactDetails}
                  />
                </label>

                <label className="field field-full">
                  <span>Description</span>
                  <textarea
                    name="description"
                    onChange={handleChange}
                    placeholder="What happened, where, and any relevant details"
                    required
                    rows="5"
                    value={formData.description}
                  />
                </label>

                <label className="field field-full">
                  <span>Evidence Images (up to 3)</span>
                  <input accept="image/*" multiple onChange={handleAttachmentChange} type="file" />
                  {attachments.length > 0 ? (
                    <small className="supporting-text">Selected: {attachments.map((file) => file.name).join(", ")}</small>
                  ) : null}
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
