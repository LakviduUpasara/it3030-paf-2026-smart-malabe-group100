import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  approveSignupRequest,
  getPendingSignupRequests,
  rejectSignupRequest,
} from "../services/authService";
import { ROLES } from "../utils/roleUtils";

const defaultRoleSelections = {
  [ROLES.ADMIN]: ROLES.ADMIN,
  [ROLES.TECHNICIAN]: ROLES.TECHNICIAN,
  [ROLES.USER]: ROLES.USER,
};

function ManageSignupRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [roleSelections, setRoleSelections] = useState({});
  const [notes, setNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingId, setIsSubmittingId] = useState("");
  const [error, setError] = useState("");

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
    setRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== requestId),
    );
  };

  const handleApprove = async (requestId) => {
    setIsSubmittingId(requestId);
    setError("");

    try {
      await approveSignupRequest(requestId, {
        assignedRole: roleSelections[requestId] || ROLES.USER,
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
    <div className="page-stack">
      <Card
        title="User Registration Approvals"
        subtitle="Review incoming sign up requests, assign roles, and approve campus access."
        actions={<span className="status-pill status-pending">{requestCountLabel}</span>}
      >
        <p className="supporting-text">
          Approved applicants can sign in after role assignment. Rejected requests stay
          visible to the applicant inside their approval dashboard.
        </p>
      </Card>

      {error ? <p className="alert alert-error">{error}</p> : null}

      {isLoading ? (
        <LoadingSpinner label="Loading pending sign up requests..." />
      ) : requests.length === 0 ? (
        <Card title="No pending requests">
          <p className="supporting-text">
            All sign up requests have already been reviewed.
          </p>
        </Card>
      ) : (
        <div className="approval-request-list">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="approval-request-card"
              title={request.fullName}
              subtitle={`${request.email} • ${request.department}`}
            >
              <div className="request-detail-grid">
                <div>
                  <strong>Campus ID</strong>
                  <p>{request.campusId}</p>
                </div>
                <div>
                  <strong>Phone</strong>
                  <p>{request.phoneNumber}</p>
                </div>
                <div>
                  <strong>Requested 2FA</strong>
                  <p>{request.preferredTwoFactorMethod}</p>
                </div>
                <div>
                  <strong>Submitted</strong>
                  <p>{new Date(request.requestedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="auth-help-panel">
                <strong>Reason for access</strong>
                <p className="supporting-text">{request.reasonForAccess}</p>
              </div>

              <div className="approval-request-grid">
                <label className="field field-annotated">
                  <span>Assign role</span>
                  <select
                    className="auth-select"
                    onChange={(event) => handleRoleChange(request.id, event.target.value)}
                    value={roleSelections[request.id] || defaultRoleSelections[ROLES.USER]}
                  >
                    <option value={ROLES.USER}>USER</option>
                    <option value={ROLES.TECHNICIAN}>TECHNICIAN</option>
                    <option value={ROLES.ADMIN}>ADMIN</option>
                  </select>
                </label>

                <label className="field field-annotated">
                  <span>Reviewer note</span>
                  <textarea
                    className="auth-textarea"
                    onChange={(event) => handleNoteChange(request.id, event.target.value)}
                    placeholder="Add an approval note or rejection reason."
                    rows="3"
                    value={notes[request.id] || ""}
                  />
                </label>
              </div>

              <div className="auth-actions-row">
                <Button
                  disabled={Boolean(isSubmittingId)}
                  onClick={() => handleApprove(request.id)}
                  variant="primary"
                >
                  {isSubmittingId === request.id ? "Submitting..." : "Approve"}
                </Button>
                <Button
                  disabled={Boolean(isSubmittingId)}
                  onClick={() => handleReject(request.id)}
                  variant="secondary"
                >
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageSignupRequestsPage;
