import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function ApprovalPendingPage() {
  const {
    activateApprovedSignup,
    clearPendingApproval,
    error,
    isAuthenticated,
    isLoading,
    logout,
    pendingApproval,
    refreshPendingApproval,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransitioningToWorkspace, setIsTransitioningToWorkspace] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!pendingApproval?.requestId || pendingApproval.status !== "PENDING") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      refreshPendingApproval({
        requestId: pendingApproval.requestId,
        email: pendingApproval.email,
      }).catch(() => undefined);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [
    pendingApproval?.email,
    pendingApproval?.requestId,
    pendingApproval?.status,
    refreshPendingApproval,
  ]);

  useEffect(() => {
    if (
      !pendingApproval?.requestId
      || !pendingApproval?.email
      || pendingApproval.status !== "APPROVED"
      || isAuthenticated
      || isTransitioningToWorkspace
    ) {
      return;
    }

    let isActive = true;
    setIsTransitioningToWorkspace(true);

    activateApprovedSignup({
      requestId: pendingApproval.requestId,
      email: pendingApproval.email,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (
          response?.authStatus === "TWO_FACTOR_REQUIRED"
          || response?.authStatus === "AUTHENTICATOR_SETUP_REQUIRED"
          || response?.authStatus === "PASSWORD_CHANGE_REQUIRED"
          || response?.authStatus === "TWO_FACTOR_METHOD_SELECTION_REQUIRED"
        ) {
          navigate("/login", { replace: true });
        }
      })
      .catch(() => {
        if (isActive) {
          setIsTransitioningToWorkspace(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    activateApprovedSignup,
    isAuthenticated,
    isTransitioningToWorkspace,
    navigate,
    pendingApproval?.email,
    pendingApproval?.requestId,
    pendingApproval?.status,
  ]);

  const statusToneClass = useMemo(() => {
    switch (pendingApproval?.status) {
      case "APPROVED":
        return "status-pill status-approved";
      case "REJECTED":
        return "status-pill status-rejected";
      default:
        return "status-pill status-pending";
    }
  }, [pendingApproval?.status]);

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  const handleRefresh = async () => {
    if (!pendingApproval?.requestId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshPendingApproval({
        requestId: pendingApproval.requestId,
        email: pendingApproval.email,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGoToLogin = () => {
    clearPendingApproval();
    navigate("/login");
  };

  const handleOpenWorkspace = async () => {
    if (!pendingApproval?.requestId || !pendingApproval?.email) {
      return;
    }

    setIsTransitioningToWorkspace(true);

    try {
      const response = await activateApprovedSignup({
        requestId: pendingApproval.requestId,
        email: pendingApproval.email,
      });

      if (
        response?.authStatus === "TWO_FACTOR_REQUIRED"
        || response?.authStatus === "AUTHENTICATOR_SETUP_REQUIRED"
        || response?.authStatus === "PASSWORD_CHANGE_REQUIRED"
        || response?.authStatus === "TWO_FACTOR_METHOD_SELECTION_REQUIRED"
      ) {
        navigate("/login", { replace: true });
      }
    } catch (activationError) {
      return activationError;
    } finally {
      setIsTransitioningToWorkspace(false);
    }
  };

  const handleCreateNewRequest = () => {
    clearPendingApproval();
    navigate("/signup");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (!pendingApproval) {
    return (
      <section className="auth-screen auth-screen-centered">
        <div className="auth-card-wrap auth-card-wrap-centered">
          <Card className="auth-card glass-card" title="No pending request found">
            <p className="supporting-text">
              Submit a sign up request first, then return here to track the approval
              status.
            </p>
            <div className="auth-actions-row">
              <Button onClick={() => navigate("/signup")} variant="primary">
                Go to Sign Up
              </Button>
              <Button onClick={() => navigate("/login")} variant="secondary">
                Back to Login
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card" title="Approval Dashboard">
          <div className="waiting-dashboard-grid">
            <div className="waiting-dashboard-header">
              <span className={statusToneClass}>{pendingApproval.status}</span>
              <h2>{pendingApproval.applicantName}</h2>
              <p className="supporting-text">{pendingApproval.email}</p>
              <p className="supporting-text">
                Sign-in method: {pendingApproval.provider || "LOCAL"}
              </p>
            </div>

            <div className="request-detail-grid">
              <div>
                <strong>Request ID</strong>
                <p>{pendingApproval.requestId}</p>
              </div>
              <div>
                <strong>Submitted</strong>
                <p>{new Date(pendingApproval.requestedAt).toLocaleString()}</p>
              </div>
              <div>
                <strong>Requested role</strong>
                <p>
                  {pendingApproval.requestedRole
                    ? String(pendingApproval.requestedRole).replaceAll("_", " ")
                    : "—"}
                </p>
              </div>
              <div>
                <strong>Assigned role</strong>
                <p>
                  {pendingApproval.status === "APPROVED" && pendingApproval.assignedRole
                    ? String(pendingApproval.assignedRole).replaceAll("_", " ")
                    : pendingApproval.status === "PENDING"
                      ? "Awaiting administrator"
                      : pendingApproval.assignedRole
                        ? String(pendingApproval.assignedRole).replaceAll("_", " ")
                        : "—"}
                </p>
              </div>
              <div>
                <strong>Latest Update</strong>
                <p>{pendingApproval.message}</p>
              </div>
            </div>

            {pendingApproval.status === "APPROVED" ? (
              <div className="auth-help-panel">
                <strong>Workspace access is ready</strong>
                <p className="supporting-text">
                  Your account is approved. Smart Campus is preparing your role-based
                  workspace and will continue with the required verification step if needed.
                </p>
              </div>
            ) : null}

            {pendingApproval.reviewerNote ? (
              <div className="auth-help-panel">
                <strong>Administrator note</strong>
                <p className="supporting-text">{pendingApproval.reviewerNote}</p>
              </div>
            ) : null}

            {error ? <p className="alert alert-error">{error}</p> : null}

            <div className="auth-actions-row">
              {pendingApproval.status === "APPROVED" ? (
                <Button
                  disabled={isTransitioningToWorkspace || isLoading}
                  onClick={handleOpenWorkspace}
                  variant="primary"
                >
                  {isTransitioningToWorkspace ? "Opening Workspace..." : "Open My Workspace"}
                </Button>
              ) : null}

              {pendingApproval.status === "REJECTED" ? (
                <Button onClick={handleCreateNewRequest} variant="primary">
                  Submit a New Request
                </Button>
              ) : null}

              <Button
                disabled={
                  pendingApproval.status !== "PENDING"
                  || isRefreshing
                  || isLoading
                  || isTransitioningToWorkspace
                }
                onClick={handleRefresh}
                variant="secondary"
              >
                {isRefreshing ? "Refreshing..." : "Refresh Status"}
              </Button>

              <Button disabled={isLoading || isTransitioningToWorkspace} onClick={handleLogout} variant="ghost">
                {isLoading ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </div>

          {isLoading && pendingApproval.status === "PENDING" ? (
            <LoadingSpinner label="Checking approval status..." />
          ) : null}
        </Card>
      </div>
    </section>
  );
}

export default ApprovalPendingPage;
