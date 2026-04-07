import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import campusLoginIllustration from "../assets/campus-login-illustration.svg";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { inferRoleFromEmail } from "../utils/mockData";
import { getDefaultRouteForRole, getRoleDescription } from "../utils/roleUtils";

const initialCredentials = {
  email: "",
  password: "",
};

function LoginPage() {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [localError, setLocalError] = useState("");
  const {
    isAuthenticated,
    user,
    login,
    loginWithGoogle,
    loginWithApple,
    clearError,
    isLoading,
    error,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const previewRole = inferRoleFromEmail(normalizedEmail || "user@smartcampus.edu");
  const activeError = localError || error;

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  const redirectToWorkspace = (authenticatedUser) => {
    const redirectTarget =
      location.state?.from?.pathname || getDefaultRouteForRole(authenticatedUser.role);
    navigate(redirectTarget, { replace: true });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [name]: value,
    }));
    setLocalError("");
    clearError();
  };

  const handleCredentialLogin = async (event) => {
    event.preventDefault();

    if (!normalizedEmail || !credentials.password.trim()) {
      setLocalError("Enter your email address and password to continue.");
      return;
    }

    try {
      const authenticatedUser = await login({
        email: normalizedEmail,
        password: credentials.password,
      });
      redirectToWorkspace(authenticatedUser);
    } catch (loginError) {
      return loginError;
    }
  };

  const handleProviderLogin = async (provider) => {
    setLocalError("");
    clearError();

    try {
      const authenticatedUser =
        provider === "apple"
          ? await loginWithApple(normalizedEmail)
          : await loginWithGoogle(normalizedEmail);
      redirectToWorkspace(authenticatedUser);
    } catch (loginError) {
      return loginError;
    }
  };

  return (
    <div className="login-shell">
      <div className="login-background-blur blur-one"></div>
      <div className="login-background-blur blur-two"></div>

      <div className="auth-grid login-grid login-stage">
        <section
          className="login-visual"
          style={{
            backgroundImage: `
              linear-gradient(145deg, rgba(6, 18, 34, 0.84), rgba(12, 74, 110, 0.58)),
              url(${campusLoginIllustration})
            `,
          }}
        >
          <div className="login-visual-head">
            <span className="eyebrow-pill">Smart Campus Operations Hub</span>
            <span className="login-visual-chip">OAuth 2.0 Ready</span>
          </div>

          <div className="login-visual-content">
            <h1>Secure campus access for students, staff, and operations teams.</h1>

            <p>
              Manage facilities, bookings, incidents, and notifications from one
              polished workspace designed for role-based campus operations.
            </p>

            <div className="hero-highlights">
              <span>Protected access</span>
              <span>Role-aware dashboards</span>
              <span>Unified admin workflows</span>
            </div>

            <div className="login-stat-strip">
              <article>
                <strong>24/7</strong>
                <span>Always Available</span>
              </article>
              <article>
                <strong>RBAC</strong>
                <span>Protected Routes</span>
              </article>
              <article>
                <strong>SSO</strong>
                <span>Google & Apple Access</span>
              </article>
            </div>
          </div>
        </section>

        <Card className="login-panel glass-card">
          <div className="login-brand-row">
            <div>
              <p className="login-kicker">Campus account</p>
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">
                Sign in with your campus email and password, or continue with a
                social account to enter the correct workspace.
              </p>
            </div>
            <span className={`role-chip role-${previewRole.toLowerCase()}`}>{previewRole}</span>
          </div>

          <div className="login-role-preview">
            <strong>Access profile preview</strong>
            <span>{getRoleDescription(previewRole)}</span>
          </div>

          <form className="login-form" onSubmit={handleCredentialLogin}>
            <label className="field field-annotated">
              <span>Email address</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 6.75h16a1.25 1.25 0 0 1 1.25 1.25v8a1.25 1.25 0 0 1-1.25 1.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                    <path
                      d="m4 8 8 5 8-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <input
                  autoComplete="email"
                  className="login-input"
                  name="email"
                  onChange={handleFieldChange}
                  placeholder="name@smartcampus.edu"
                  type="email"
                  value={credentials.email}
                />
              </div>
            </label>

            <label className="field field-annotated">
              <span>Password</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M7.25 10.75v-2a4.75 4.75 0 1 1 9.5 0v2"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="4.75"
                      y="10.75"
                      width="14.5"
                      height="9.5"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="15.5" r="1.1" fill="currentColor" />
                  </svg>
                </span>
                <input
                  autoComplete="current-password"
                  className="login-input"
                  name="password"
                  onChange={handleFieldChange}
                  placeholder="Enter your password"
                  type="password"
                  value={credentials.password}
                />
              </div>
            </label>

            {activeError ? <p className="alert alert-error">{activeError}</p> : null}

            <Button
              className="login-submit"
              disabled={isLoading}
              type="submit"
              variant="primary"
            >
              Log in
            </Button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth-grid">
            <button
              className="social-button"
              disabled={isLoading}
              onClick={() => handleProviderLogin("google")}
              type="button"
            >
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#FFC107"
                    d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.221 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.348 4.337-17.694 10.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.2 0-9.624-3.326-11.284-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                  />
                </svg>
              </span>
              <span className="social-button-label">Sign up with Google</span>
            </button>

            <button
              className="social-button"
              disabled={isLoading}
              onClick={() => handleProviderLogin("apple")}
              type="button"
            >
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.72 12.74c.03 2.94 2.58 3.92 2.61 3.93-.02.07-.41 1.42-1.34 2.82-.8 1.21-1.64 2.41-2.95 2.43-1.29.02-1.7-.76-3.17-.76-1.47 0-1.93.74-3.15.79-1.27.05-2.23-1.27-3.04-2.47-1.66-2.44-2.93-6.88-1.22-9.85.85-1.47 2.38-2.4 4.03-2.43 1.25-.02 2.43.85 3.17.85.74 0 2.13-1.05 3.59-.9.61.03 2.32.25 3.42 1.86-.09.06-2.04 1.19-1.95 3.73Zm-2.22-6.16c.67-.81 1.12-1.94 1-3.06-.97.04-2.14.65-2.84 1.46-.62.72-1.17 1.87-1.02 2.97 1.08.08 2.19-.55 2.86-1.37Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="social-button-label">Sign up with Apple</span>
            </button>
          </div>

          <p className="login-demo-note">
            Demo access: use <strong>admin@smartcampus.edu</strong> for ADMIN,
            <strong> technician@smartcampus.edu</strong> for TECHNICIAN, or any
            other valid email for USER access. The password can be any value in
            demo mode.
          </p>

          {isLoading ? <LoadingSpinner label="Authenticating your access..." /> : null}
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
