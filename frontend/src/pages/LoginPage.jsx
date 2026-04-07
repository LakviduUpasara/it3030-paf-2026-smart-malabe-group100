import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import Card from "../components/Card";
import LoginPanel from "../components/LoginPanel";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function LoginPage() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card">
          <LoginPanel />
        </Card>
      </div>
    </section>
  );
}

export default LoginPage;
