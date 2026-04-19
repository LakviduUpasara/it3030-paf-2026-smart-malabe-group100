import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets, updateStatus } from "../../services/ticketService";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

function formatTicketMeta(ticket) {
  const idShort = ticket?.id ? String(ticket.id).slice(0, 10) : "";
  const cat = [ticket?.categoryId, ticket?.subCategoryId].filter(Boolean).join(" · ");
  const reporter = ticket?.createdByUsername?.trim();
  const bits = [];
  if (idShort) bits.push(idShort);
  if (cat) bits.push(cat);
  return { line1: bits.join(" · ") || "—", reporter };
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
          <div className="list-stack">
            {resolvedTickets.map((ticket) => {
              const meta = formatTicketMeta(ticket);
              const busy = pendingId === ticket.id;
              return (
                <div
                  className="list-row flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-tint/60 p-4"
                  key={ticket.id}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      className="text-heading font-semibold hover:underline"
                      to={`/technician/tickets/${ticket.id}`}
                    >
                      {ticket.title}
                    </Link>
                    <p className="supporting-text">{meta.line1}</p>
                    <p className="supporting-text">
                      {meta.reporter ? `Reporter: ${meta.reporter}` : "Reporter: —"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={`status-badge shrink-0 ${toToken(ticket.status)}`}
                      title={formatStatusLabel(ticket.status)}
                    >
                      {formatStatusLabel(ticket.status)}
                    </span>
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => handleMarkInProgress(ticket.id)}
                      variant="secondary"
                    >
                      {busy ? "Updating…" : "Mark in progress"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default TechnicianResolvedTicketsPage;
