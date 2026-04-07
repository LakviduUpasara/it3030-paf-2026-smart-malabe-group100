import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole, ROLES } from "../utils/roleUtils";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(ROLES.USER);
  const { isAuthenticated, user, loginWithGoogle, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  const handleGoogleLogin = async () => {
    try {
      const authenticatedUser = await loginWithGoogle(selectedRole);
      const redirectTarget =
        location.state?.from?.pathname || getDefaultRouteForRole(authenticatedUser.role);
      navigate(redirectTarget, { replace: true });
    } catch (loginError) {
      return loginError;
    }
  };

  return (
    <div className="auth-grid">
      <Card
        className="hero-card"
        subtitle="Smart Campus Operations Hub"
        title="Role-aware campus operations in one place"
      >
        <p className="hero-copy">
          Manage facilities, bookings, maintenance tickets, and notifications with
          secure sign-in and clean role-based navigation.
        </p>
        <div className="hero-highlights">
          <span>Google login ready</span>
          <span>RBAC protected routes</span>
          <span>Responsive dashboard</span>
        </div>
      </Card>

      <Card
        title="Sign in"
        subtitle="Choose a demo role and continue with Google"
      >
        <div className="role-selector">
          {Object.values(ROLES).map((role) => (
            <button
              key={role}
              className={
                role === selectedRole ? "role-option active" : "role-option"
              }
              onClick={() => setSelectedRole(role)}
              type="button"
            >
              {role}
            </button>
          ))}
        </div>

        <p className="supporting-text">
          This scaffold uses a Google login UI and stores user name, email, and role in
          local storage through the auth context.
        </p>

        {error ? <p className="alert alert-error">{error}</p> : null}

        <Button
          className="google-button"
          onClick={handleGoogleLogin}
          variant="primary"
        >
          <span className="google-mark">G</span>
          Continue with Google
        </Button>

        {isLoading ? <LoadingSpinner label="Signing you in..." /> : null}
      </Card>
    </div>
  );
}

export default LoginPage;
