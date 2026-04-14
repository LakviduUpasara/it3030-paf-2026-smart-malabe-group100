import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { createTicket } from "../services/ticketService";

const initialForm = {
  title: "",
  description: "",
};

function MyTicketsPage() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      setFormData(initialForm);
    } catch (submitError) {
      setError(submitError.message || "Unable to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title="My Tickets" subtitle="Report a new incident or maintenance request">
      <form className="form-grid" onSubmit={handleSubmit}>
        {successMessage ? <p className="alert alert-success field-full">{successMessage}</p> : null}
        {error ? <p className="alert alert-error field-full">{error}</p> : null}

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
            {isSubmitting ? "Submitting..." : "Submit ticket"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default MyTicketsPage;
