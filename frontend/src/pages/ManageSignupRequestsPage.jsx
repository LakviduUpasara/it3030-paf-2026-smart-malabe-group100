import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAdminShell } from "../context/AdminShellContext";
import { useAuth } from "../hooks/useAuth";
import {
  approveSignupRequest,
  getPendingSignupRequests,
  rejectSignupRequest,
} from "../services/authService";
import { normalizeRole, ROLES } from "../utils/roleUtils";

/** Campus managers may assign staff/student roles; platform admins may assign any role. */
const SIGNUP_ROLES_MANAGER = [
  ROLES.USER,
  ROLES.STUDENT,
  ROLES.LECTURER,
  ROLES.LAB_ASSISTANT,
  ROLES.TECHNICIAN,
];

const SIGNUP_ROLES_FULL = [
  ...SIGNUP_ROLES_MANAGER,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.LOST_ITEM_ADMIN,
];

function ManageSignupRequestsPage() {
  const { user } = useAuth();
  const { setActiveWindow } = useAdminShell();
  const [requests, setRequests] = useState([]);
  const [roleSelections, setRoleSelections] = useState({});
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingId, setIsSubmittingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveWindow("List");
    return () => setActiveWindow("");
  }, [setActiveWindow]);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const pendingRequests = await getPendingSignupRequests();
        setRequests(pendingRequests);
      } catch (requestError) {
        setError(requestError.message || "Unable to load pending sign up requests.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

  const requestCountLabel = useMemo(
    () => `${requests.length} pending request${requests.length === 1 ? "" : "s"}`,
    [requests.length],
  );

  const assignableRoles = useMemo(() => {
    const r = normalizeRole(user?.role);
    if (r === ROLES.MANAGER) {
      return SIGNUP_ROLES_MANAGER;
    }
    return SIGNUP_ROLES_FULL;
  }, [user?.role]);

  const defaultAssignableRole = useMemo(
    () => assignableRoles[0] || ROLES.USER,
    [assignableRoles],
  );

  const handleRoleChange = (requestId, nextRole) => {
    setRoleSelections((currentSelections) => ({
      ...currentSelections,
      [requestId]: nextRole,
    }));
  };

  const handleNoteChange = (requestId, nextNote) => {
    setNotes((currentNotes) => ({
      ...currentNotes,
      [requestId]: nextNote,
    }));
  };

  const removeRequest = (requestId) => {
    setRequests((currentRequests) => currentRequests.filter((request) => request.id !== requestId));
  };

  const resolveApproveRole = (request) => {
    const manual = roleSelections[request.id];
    if (manual && assignableRoles.includes(manual)) {
      return manual;
    }
    if (request.requestedRole && assignableRoles.includes(request.requestedRole)) {
      return request.requestedRole;
    }
    return assignableRoles.includes(defaultAssignableRole) ? defaultAssignableRole : assignableRoles[0];
  };

  const handleApprove = async (request) => {
    const requestId = request.id;
    setIsSubmittingId(requestId);
    setError("");

    try {
      const safeRole = resolveApproveRole(request);

      await approveSignupRequest(requestId, {
        assignedRole: safeRole,
        reviewerNote: notes[requestId] || "",
      });
      removeRequest(requestId);
    } catch (requestError) {
      setError(requestError.message || "Unable to approve the request.");
    } finally {
      setIsSubmittingId("");
    }
  };

  const handleReject = async (requestId) => {
    setIsSubmittingId(requestId);
    setError("");

    try {
      await rejectSignupRequest(requestId, {
        reviewerNote: notes[requestId] || "",
      });
      removeRequest(requestId);
    } catch (requestError) {
      setError(requestError.message || "Unable to reject the request.");
    } finally {
      setIsSubmittingId("");
    }
  };

  return (
    <>
      <AdminPageHeader
        actions={<span className="rounded-full border border-border bg-tint px-3 py-1 text-xs font-semibold text-heading">{requestCountLabel}</span>}
        description="Review incoming sign-up requests, assign roles, and approve or reject campus access."
        title="User requests"
      />

      <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <p className="text-sm text-text/72">
          Approved applicants can sign in after role assignment. Rejected requests are removed from this queue.
        </p>
      </section>

      {error ? (
        <div className="mt-4 rounded-2xl border border-border bg-tint p-4 text-sm text-heading" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6">
          <LoadingSpinner label="Loading pending requests…" />
        </div>
      ) : requests.length === 0 ? (
        <section className="mt-6 rounded-3xl border border-border bg-card p-8 text-center shadow-shadow">
          <p className="text-sm text-text/70">All sign-up requests have been reviewed.</p>
        </section>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {requests.map((request) => (
            <section
              key={request.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-shadow"
            >
              <div className="border-b border-border pb-4">
                <h2 className="text-lg font-semibold text-heading">{request.fullName}</h2>
                <p className="mt-1 text-sm text-text/70">{request.email}</p>
                {request.department && request.department !== "—" ? (
                  <p className="mt-1 text-xs text-text/55">{request.department}</p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Campus ID</p>
                  <p className="mt-1 text-sm">{request.campusId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Phone</p>
                  <p className="mt-1 text-sm">{request.phoneNumber}</p>
                </div>
                {request.supplementaryProfile ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Role profile notes</p>
                    <p className="mt-1 text-sm text-text/80">{request.supplementaryProfile}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Provider</p>
                  <p className="mt-1 text-sm">{request.authProvider || "LOCAL"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Submitted</p>
                  <p className="mt-1 text-sm">{new Date(request.requestedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Requested role</p>
                  <p className="mt-1 text-sm">
                    {request.requestedRole ? String(request.requestedRole).replaceAll("_", " ") : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-tint/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/60">Reason for access</p>
                <p className="mt-2 text-sm text-text/80">{request.reasonForAccess}</p>
              </div>

              {request.applicationProfileJson ? (
                <details className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-heading">
                    Full registration form (same structure as admin console)
                  </summary>
                  <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-tint/50 p-3 text-left text-xs text-text/80">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(request.applicationProfileJson), null, 2);
                      } catch {
                        return request.applicationProfileJson;
                      }
                    })()}
                  </pre>
                </details>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text/70">Assign role</span>
                  <select
                    className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                    onChange={(event) => handleRoleChange(request.id, event.target.value)}
                    value={resolveApproveRole(request)}
                  >
                    {assignableRoles.map((roleValue) => (
                      <option key={roleValue} value={roleValue}>
                        {roleValue.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs font-semibold text-text/70">Reviewer note</span>
                  <textarea
                    className="min-h-[88px] rounded-2xl border border-border bg-card px-3 py-2 text-sm"
                    onChange={(event) => handleNoteChange(request.id, event.target.value)}
                    placeholder="Add an approval note or rejection reason."
                    rows={3}
                    value={notes[request.id] || ""}
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  disabled={Boolean(isSubmittingId)}
                  onClick={() => handleApprove(request)}
                  variant="primary"
                  type="button"
                >
                  {isSubmittingId === request.id ? "Submitting…" : "Approve"}
                </Button>
                <Button
                  disabled={Boolean(isSubmittingId)}
                  onClick={() => handleReject(request.id)}
                  variant="secondary"
                  type="button"
                >
                  Reject
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default ManageSignupRequestsPage;
