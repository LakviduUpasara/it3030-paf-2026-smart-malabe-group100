import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import TicketCard from "../components/TicketCard";
import { addUpdate, getTickets, updateStatus, uploadFile } from "../services/ticketService";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "CLOSED"];

function TechnicianDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pendingKey, setPendingKey] = useState(null);
  const [statusDraftById, setStatusDraftById] = useState({});
  const [messagesById, setMessagesById] = useState({});
  const [filesById, setFilesById] = useState({});

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        // ✅ FIX
        const res = await getTickets();
        const data = res.data;

        if (active) {
          const list = Array.isArray(data) ? data : [];
          setTickets(list);

          const draft = {};
          list.forEach((t) => {
            draft[t.id] = t.status || "OPEN";
          });
          setStatusDraftById(draft);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load tickets.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTickets();
    return () => (active = false);
  }, []);

  // ✅ STATUS UPDATE
  const handleApplyStatus = async (ticketId) => {
    const nextStatus = statusDraftById[ticketId];

    setPendingKey(`${ticketId}-status`);
    setFeedback({});

    try {
      await updateStatus(ticketId, nextStatus);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: nextStatus } : t
        )
      );

      setFeedback({ type: "success", text: "Status updated!" });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  // ✅ ADD UPDATE
  const handleAddUpdate = async (ticketId) => {
    const message = messagesById[ticketId];

    if (!message) return;

    setPendingKey(`${ticketId}-update`);

    try {
      await addUpdate(ticketId, {
        message,
        updatedBy: "Technician",
      });

      setMessagesById((prev) => ({ ...prev, [ticketId]: "" }));
      setFeedback({ type: "success", text: "Update added!" });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  // ✅ FILE UPLOAD
  const handleUploadAttachment = async (ticketId) => {
    const file = filesById[ticketId];
    if (!file) return;

    setPendingKey(`${ticketId}-upload`);

    try {
      await uploadFile(ticketId, file);
      setFeedback({ type: "success", text: "File uploaded!" });

      setFilesById((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading..." />;

  return (
    <Card title="Technician Dashboard">
      {error && <p className="alert alert-error">{error}</p>}
      {feedback.text && (
        <p className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}>
          {feedback.text}
        </p>
      )}

      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ marginBottom: "20px" }}>
          <TicketCard ticket={ticket} />

          {/* STATUS */}
          <select
            value={statusDraftById[ticket.id]}
            onChange={(e) =>
              setStatusDraftById((prev) => ({
                ...prev,
                [ticket.id]: e.target.value,
              }))
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <Button onClick={() => handleApplyStatus(ticket.id)}>
            Update Status
          </Button>

          {/* MESSAGE */}
          <textarea
            placeholder="Add update"
            value={messagesById[ticket.id] || ""}
            onChange={(e) =>
              setMessagesById((prev) => ({
                ...prev,
                [ticket.id]: e.target.value,
              }))
            }
          />

          <Button onClick={() => handleAddUpdate(ticket.id)}>
            Add Update
          </Button>

          {/* FILE */}
          <input
            type="file"
            onChange={(e) =>
              setFilesById((prev) => ({
                ...prev,
                [ticket.id]: e.target.files[0],
              }))
            }
          />

          <Button onClick={() => handleUploadAttachment(ticket.id)}>
            Upload File
          </Button>
        </div>
      ))}
    </Card>
  );
}

export default TechnicianDashboardPage;