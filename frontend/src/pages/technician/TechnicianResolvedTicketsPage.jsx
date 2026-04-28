import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets, updateStatus } from "../../services/ticketService";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";
import { formatDateTime, toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

function formatCategoryCell(ticket) {
  const cat = [ticket?.categoryId, ticket?.subCategoryId].filter(Boolean).join(" · ");
  return cat || "—";
}

function formatStatusLabel(status) {
  const s = String(status || "")
    .trim()
    .toUpperCase();
  if (s === "RESOLVED") return "Resolved";
  if (s === "CLOSED") return "Closed";
  return String(status || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function TechnicianResolvedTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadTickets = useCallback(async () => {
    const res = await getMyTickets();
    const data = res?.data;
    const list = Array.isArray(data) ? data : [];
    setTickets(list.map(normalizeTicketFromApi));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadTickets();
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to load tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [loadTickets]);

  const resolvedTickets = useMemo(
    () => tickets.filter((t) => isResolvedTicketStatus(t?.status)),
    [tickets],
  );

  const handleMarkInProgress = async (ticketId) => {
    setPendingId(ticketId);
    setFeedback({ type: "", text: "" });
    try {
      await updateStatus(ticketId, "ACCEPTED");
      await loadTickets();
      setFeedback({
        type: "success",
        text: "Ticket moved back to Accepted. You can continue it under My tickets.",
      });
    } catch (e) {
      setFeedback({
        type: "error",
        text: e.message || "Could not reopen ticket.",
      });
    } finally {
      setPendingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading resolved tickets..." />;
  }

  return (
    <div className="technician-page">
      <Card
        className="technician-page-card"
        subtitle="Reopen a ticket if you need to add more work or corrections."
        title="Resolved"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {feedback.text ? (
          <p
            className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
            role="status"
          >
            {feedback.text}
          </p>
        ) : null}
        {!resolvedTickets.length ? (
          <p className="supporting-text">
            No resolved tickets yet. When you mark work complete from a ticket, it appears here.
          </p>
        ) : (
          <div
            className="technician-table-wrapper"
            role="region"
            aria-label="Resolved tickets"
          >
            <table className="technician-table">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Category</th>
                  <th scope="col">Requester</th>
                  <th scope="col">Last updated</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="technician-table-actions-header">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {resolvedTickets.map((ticket) => {
                  const busy = pendingId === ticket.id;
                  const statusToken = toToken(ticket.status);
                  const updated = ticket.updatedAt ?? ticket.createdAt;
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className="technician-table-title">
                          <Link
                            className="technician-table-ticket-title hover:underline"
                            to={`/technician/tickets/${ticket.id}`}
                          >
                            {ticket.title?.trim() || "Untitled"}
                          </Link>
                          <span className="technician-table-ticket-id">ID: {ticket.id ?? "—"}</span>
                        </div>
                      </td>
                      <td>{formatCategoryCell(ticket)}</td>
                      <td>{ticket.createdByUsername?.trim() || "—"}</td>
                      <td>{updated ? formatDateTime(updated) : "—"}</td>
                      <td>
                        <span
                          className={`status-badge ${statusToken}`}
                          title={formatStatusLabel(ticket.status)}
                        >
                          {formatStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="technician-table-actions-cell">
                        <div className="technician-table-actions">
                          <Button
                            type="button"
                            disabled={busy}
                            onClick={() => handleMarkInProgress(ticket.id)}
                            variant="secondary"
                          >
                            {busy ? "Updating…" : "Mark in progress"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default TechnicianResolvedTicketsPage;
