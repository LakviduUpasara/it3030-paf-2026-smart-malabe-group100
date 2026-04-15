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
        // ✅ FIX: axios response
        const res = await getMyTickets();
        const data = res.data;

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    const imageFiles = fileList.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== fileList.length) {
      setError("Only image attachments are allowed.");
    } else if (fileList.length > 3) {
      setError("You can upload up to 3 images.");
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
      // ✅ FIX: axios response
      const res = await createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: "OPEN",
      });

      const ticket = res.data;

      let uploadedCount = 0;

      if (ticket?.id && attachments.length > 0) {
        await Promise.all(
          attachments.map(async (file) => {
            await uploadFile(ticket.id, file);
            uploadedCount++;
          })
        );
      }

      setSuccessMessage("✅ Ticket created successfully!");

      // ✅ safer update
      setTickets((prev) => [ticket, ...prev]);

      setFormData(initialForm);
      setAttachments([]);
      setIsFormOpen(false);

    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading your tickets..." />;
  }

  return (
    <>
      {/* HEADER */}
      <section className="my-tickets-header-section">
        <div className="my-tickets-hero-main">
          <img src={maintenanceIllustration} alt="" />
          <div>
            <h2>My Tickets</h2>
            <p>Track maintenance and incident requests</p>
          </div>

          <Button onClick={() => setIsFormOpen(!isFormOpen)}>
            {isFormOpen ? "Cancel" : "Create Ticket"}
          </Button>
        </div>
      </section>

      {/* CONTENT */}
      <Card>
        {successMessage && <p className="alert alert-success">{successMessage}</p>}
        {error && <p className="alert alert-error">{error}</p>}

        {tickets.length === 0 ? (
          <p>No tickets yet</p>
        ) : (
          <div>
            {tickets.map((ticket) => (
              <div key={ticket.id}>
                <strong>{ticket.title}</strong>
                <p>{ticket.description}</p>
                <span>{ticket.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL */}
      {isFormOpen && (
        <div className="modal">
          <form onSubmit={handleSubmit}>
            <input
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <input type="file" multiple onChange={handleAttachmentChange} />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

export default MyTicketsPage;