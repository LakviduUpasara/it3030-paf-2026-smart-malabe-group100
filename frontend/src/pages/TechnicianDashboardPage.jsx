import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import TicketCard from "../components/TicketCard";
import { addUpdate, getTickets, updateStatus, uploadFile } from "../services/ticketService";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "CLOSED"];

function statusSelectOptions(current) {
  if (current && !STATUS_OPTIONS.includes(current)) {
    return [current, ...STATUS_OPTIONS];
  }
  return STATUS_OPTIONS;
}

function TechnicianDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pendingKey, setPendingKey] = useState(null);
  const [statusDraftById, setStatusDraftById] = useState({});
  const [messagesById, setMessagesById] = useState({});
  const [filesById, setFilesById] = useState({});
  const [fileInputReset, setFileInputReset] = useState({});

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getTickets();
        if (active) {
          const list = Array.isArray(data) ? data : [];
          setTickets(list);
          setStatusDraftById((previous) => {
            const next = { ...previous };
            for (const t of list) {
              if (next[t.id] === undefined) {
                next[t.id] = t.status ?? "OPEN";
              }
            }
            return next;
          });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Failed to load tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const handleStatusDraftChange = (ticketId, value) => {
    setStatusDraftById((previous) => ({ ...previous, [ticketId]: value }));
  };

  const handleApplyStatus = async (ticketId) => {
    const nextStatus = statusDraftById[ticketId];
    if (!nextStatus) {
      return;
    }

    setFeedback({ type: "", text: "" });
    setPendingKey(`${ticketId}-status`);

    try {
      await updateStatus(ticketId, nextStatus);
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket,
        ),
      );
      setFeedback({
        type: "success",
        text: `Ticket #${ticketId} status updated to ${nextStatus}.`,
      });
    } catch (actionError) {
      setFeedback({ type: "error", text: actionError.message || "Update failed." });
    } finally {
      setPendingKey(null);
    }
  };

  const handleMessageChange = (ticketId, value) => {
    setMessagesById((previous) => ({ ...previous, [ticketId]: value }));
  };

  const handleAddUpdate = async (ticketId) => {
    const message = (messagesById[ticketId] || "").trim();
    if (!message) {
      setFeedback({ type: "error", text: "Enter an update message before sending." });
      return;
    }

    setFeedback({ type: "", text: "" });
    setPendingKey(`${ticketId}-update`);

    try {
      await addUpdate(ticketId, { message, updatedBy: "Technician" });
      setMessagesById((previous) => ({ ...previous, [ticketId]: "" }));
      setFeedback({ type: "success", text: `Update recorded for ticket #${ticketId}.` });
    } catch (actionError) {
      setFeedback({ type: "error", text: actionError.message || "Could not add update." });
    } finally {
      setPendingKey(null);
    }
  };

  const handleFileChange = (ticketId, event) => {
    const file = event.target.files?.[0];
    setFilesById((previous) => ({
      ...previous,
      [ticketId]: file ?? null,
    }));
  };

  const handleUploadAttachment = async (ticketId) => {
    const file = filesById[ticketId];
    if (!file) {
      setFeedback({ type: "error", text: "Choose a file to upload." });
      return;
    }

    setFeedback({ type: "", text: "" });
    setPendingKey(`${ticketId}-upload`);

    try {
      await uploadFile(ticketId, file);
      setFilesById((previous) => {
        const next = { ...previous };
        delete next[ticketId];
        return next;
      });
      setFileInputReset((previous) => ({
        ...previous,
        [ticketId]: (previous[ticketId] || 0) + 1,
      }));
      setFeedback({
        type: "success",
        text: `Attachment uploaded for ticket #${ticketId}.`,
      });
    } catch (actionError) {
      setFeedback({ type: "error", text: actionError.message || "Upload failed." });
    } finally {
      setPendingKey(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading technician queue..." />;
  }

  return (
    <Card
      title="Technician Dashboard"
      subtitle="Update status, add notes, and upload attachments for incident tickets"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}
      {feedback.text ? (
        <p
          className={
            feedback.type === "success" ? "alert alert-success" : "alert alert-error"
          }
        >
          {feedback.text}
        </p>
      ) : null}

      {!error && tickets.length === 0 ? (
        <p className="supporting-text">No tickets in the queue.</p>
      ) : null}

      <div className="list-stack">
        {tickets.map((ticket) => {
          const draft = statusDraftById[ticket.id] ?? ticket.status ?? "OPEN";
          const busyStatus = pendingKey === `${ticket.id}-status`;
          const busyUpdate = pendingKey === `${ticket.id}-update`;
          const busyUpload = pendingKey === `${ticket.id}-upload`;
          const busyRow = busyStatus || busyUpdate || busyUpload;

          return (
            <article
              className="list-row align-start"
              key={ticket.id}
              style={{ flexWrap: "wrap", gap: "1rem" }}
            >
              <TicketCard ticket={ticket} variant="compact" />

              <div className="form-grid" style={{ flex: "1 1 280px", maxWidth: "420px" }}>
                <label className="field field-full">
                  <span>Change status</span>
                  <div className="inline-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                    <select
                      onChange={(event) => handleStatusDraftChange(ticket.id, event.target.value)}
                      value={draft}
                    >
                      {statusSelectOptions(ticket.status).map((option) => (
                        <option key={option} value={option}>
                          {String(option).replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <Button
                      disabled={busyRow}
                      onClick={() => handleApplyStatus(ticket.id)}
                      type="button"
                      variant="secondary"
                    >
                      {busyStatus ? "Saving…" : "Update status"}
                    </Button>
                  </div>
                </label>

                <label className="field field-full">
                  <span>Technician update</span>
                  <textarea
                    onChange={(event) => handleMessageChange(ticket.id, event.target.value)}
                    placeholder="Notes for the requester or team"
                    rows="3"
                    value={messagesById[ticket.id] ?? ""}
                  />
                </label>
                <div>
                  <Button
                    disabled={busyRow}
                    onClick={() => handleAddUpdate(ticket.id)}
                    type="button"
                    variant="primary"
                  >
                    {busyUpdate ? "Sending…" : "Add update"}
                  </Button>
                </div>

                <label className="field field-full">
                  <span>Attachment</span>
                  <div className="inline-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                    <input
                      key={`${ticket.id}-${fileInputReset[ticket.id] || 0}`}
                      accept="*/*"
                      disabled={busyRow}
                      onChange={(event) => handleFileChange(ticket.id, event)}
                      type="file"
                    />
                    <Button
                      disabled={busyRow}
                      onClick={() => handleUploadAttachment(ticket.id)}
                      type="button"
                      variant="secondary"
                    >
                      {busyUpload ? "Uploading…" : "Upload file"}
                    </Button>
                  </div>
                  {filesById[ticket.id] ? (
                    <p className="supporting-text">Selected: {filesById[ticket.id].name}</p>
                  ) : null}
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

export default TechnicianDashboardPage;
