import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { createTicket, getMyTickets } from "../services/ticketService";
import { toToken } from "../utils/formatters";

const initialForm = {
  title: "",
  description: "",
};

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const ticket = await createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      const idPart = ticket?.id != null ? ` (#${ticket.id})` : "";
      setSuccessMessage(`Ticket submitted successfully${idPart}.`);
      setTickets((previous) => [ticket, ...previous]);
      setFormData(initialForm);
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
    <Card
      title="My Tickets"
      subtitle="Track maintenance and incident requests"
      actions={
        <Button onClick={() => setIsFormOpen((previous) => !previous)} variant={isFormOpen ? "ghost" : "primary"}>
          {isFormOpen ? "Cancel" : "Create Ticket"}
        </Button>
      }
    >
      {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
      {error ? <p className="alert alert-error">{error}</p> : null}

      {isFormOpen ? (
        <form className="form-grid my-tickets-create-form" onSubmit={handleSubmit}>
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

          <div className="field-full">
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </form>
      ) : null}

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
              </div>
              <span className={`status-badge ${toToken(ticket.status || "open")}`}>{ticket.status || "Open"}</span>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

export default MyTicketsPage;
