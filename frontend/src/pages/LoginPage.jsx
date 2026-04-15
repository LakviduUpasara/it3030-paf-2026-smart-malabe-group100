import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import Card from "../components/Card";
import LoginPanel from "../components/LoginPanel";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function LoginPage() {
  const { isAuthenticated, pendingApproval, user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <LoginPanel />
        </Card>
      </div>
    </section>
  );
}

export default LoginPage;
