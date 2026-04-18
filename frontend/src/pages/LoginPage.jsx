import { useEffect, useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Card from "../components/Card";
import LoginPanel from "../components/LoginPanel";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function LoginPage() {
  const { isAuthenticated, pendingApproval, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionNotice = useMemo(() => {
    const raw = searchParams.get("notice");
    if (!raw?.trim()) {
      return "";
    }
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!sessionNotice) {
      return undefined;
    }
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("notice");
          return next;
        },
        { replace: true },
      );
    }, 12_000);
    return () => window.clearTimeout(t);
  }, [sessionNotice, setSearchParams]);

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  if (pendingApproval?.status === "PENDING") {
    return <Navigate replace to="/approval-pending" />;
  }

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered signup-card-wrap login-card-wrap">
        <Card className="auth-card glass-card signup-premium-card login-premium-card">
          {sessionNotice ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {sessionNotice}
            </p>
          ) : null}
          <LoginPanel />
        </Card>
      </div>
    </section>
  );
}

export default LoginPage;
