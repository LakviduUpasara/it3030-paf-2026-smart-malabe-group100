import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX, ListOrdered } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import AdminKpiGrid from "../components/admin/AdminKpiGrid";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminStatTile from "../components/admin/AdminStatTile";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  adminApproveBooking,
  adminRejectBooking,
  getAdminBookings,
  getAdminBookingSummary,
} from "../services/bookingService";
import { toToken } from "../utils/formatters";

function bookingStatusKey(status) {
  if (status == null) {
    return "PENDING";
  }
  if (typeof status === "object" && status !== null && typeof status.name === "string") {
    return status.name.trim().toUpperCase();
  }
  return String(status).trim().toUpperCase();
}

function formatDateTime(value) {
  if (value == null) {
    return "—";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ApproveBookingsPage() {
  const [summary, setSummary] = useState({
    totalBookings: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectForId, setRejectForId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [sum, page] = await Promise.all([
        getAdminBookingSummary(),
        getAdminBookings({ page: 0, size: 100 }),
      ]);
      setSummary({
        totalBookings: Number(sum?.totalBookings ?? 0),
        approved: Number(sum?.approved ?? 0),
        pending: Number(sum?.pending ?? 0),
        rejected: Number(sum?.rejected ?? 0),
      });
      setRows(Array.isArray(page?.content) ? page.content : []);
    } catch (e) {
      setError(e.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (bookingId) => {
    setError("");
    setNotice("");
    setProcessingId(bookingId);
    try {
      await adminApproveBooking(bookingId);
      setNotice("Booking approved.");
      await loadData();
    } catch (e) {
      setError(e.message || "Approve failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (bookingId) => {
    setRejectError("");
    setRejectReason("");
    setRejectForId(bookingId);
  };

  const closeReject = () => {
    setRejectForId(null);
    setRejectReason("");
    setRejectError("");
  };

  const confirmReject = async () => {
    if (!rejectForId) {
      return;
    }
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError("Enter a rejection reason.");
      return;
    }
    setError("");
    setNotice("");
    setProcessingId(rejectForId);
    try {
      await adminRejectBooking(rejectForId, trimmed);
      setNotice("Booking rejected.");
      closeReject();
      await loadData();
    } catch (e) {
      setError(e.message || "Reject failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        description="Live data from MongoDB. Approve or reject pending requests; all counts update from the database."
        title="Booking approval queue"
      />

      <AdminKpiGrid>
        <AdminStatTile
          detail="All booking documents"
          icon={ListOrdered}
          label="Total bookings"
          value={summary.totalBookings}
        />
        <AdminStatTile
          detail="Confirmed reservations"
          icon={CalendarCheck}
          label="Approved"
          value={summary.approved}
        />
        <AdminStatTile
          detail="Awaiting your decision"
          icon={CalendarClock}
          label="Pending"
          value={summary.pending}
        />
        <AdminStatTile
          detail="Declined requests"
          icon={CalendarX}
          label="Rejected"
          value={summary.rejected}
        />
      </AdminKpiGrid>

      {notice ? (
        <section
          className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {notice}
        </section>
      ) : null}

      {error ? (
        <section
          className="mb-4 rounded-3xl border border-border bg-tint p-5 shadow-shadow"
          role="alert"
        >
          <p className="text-sm font-semibold text-heading">Something went wrong</p>
          <p className="mt-1 text-sm text-text/70">{error}</p>
        </section>
      ) : null}

      {loading ? (
        <Card title="Loading">
          <LoadingSpinner label="Loading bookings from server…" />
        </Card>
      ) : (
        <Card subtitle="MongoDB-backed list — newest start time first" title="All bookings">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-tint/80 text-left text-xs font-semibold uppercase tracking-wide text-text/60">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rows.map((row) => {
                  const st = bookingStatusKey(row.status);
                  const busy = processingId === row.id;
                  const canAct = st === "PENDING";
                  return (
                    <tr key={row.id} className="align-top text-text">
                      <td className="px-4 py-3 font-mono text-xs text-text/80">{row.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-heading">{row.resourceName || "—"}</p>
                        <p className="text-xs text-text/60">{row.resourceId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-heading">{row.userFullName || "—"}</p>
                        <p className="text-xs text-text/60">{row.userEmail || row.userId}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.startTime)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(row.endTime)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${toToken(st)}`}>{st}</span>
                        {st === "REJECTED" && row.rejectionReason ? (
                          <p className="mt-2 max-w-xs text-xs text-text/72" title={row.rejectionReason}>
                            Reason: {row.rejectionReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canAct ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              disabled={busy}
                              onClick={() => handleApprove(row.id)}
                              type="button"
                              variant="primary"
                            >
                              Approve
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() => openReject(row.id)}
                              type="button"
                              variant="secondary"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-text/60">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!rows.length ? (
            <p className="mt-4 text-center text-sm text-text/70">No bookings in the database yet.</p>
          ) : null}
        </Card>
      )}

      {rejectForId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-booking-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-shadow">
            <h2 id="reject-booking-title" className="text-base font-semibold text-heading">
              Reject booking
            </h2>
            <p className="mt-1 text-sm text-text/72">
              A reason is required and will be stored with the booking ({rejectForId}).
            </p>
            <label className="mt-4 block text-sm font-medium text-text">
              Reason
              <textarea
                className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                value={rejectReason}
              />
            </label>
            {rejectError ? <p className="mt-2 text-sm text-red-600">{rejectError}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button disabled={processingId != null} onClick={closeReject} type="button" variant="secondary">
                Cancel
              </Button>
              <Button
                disabled={processingId != null}
                onClick={confirmReject}
                type="button"
                variant="primary"
              >
                Confirm reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ApproveBookingsPage;
