import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const initialFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function SignupPage() {
  const [formState, setFormState] = useState(initialFormState);
  const [localError, setLocalError] = useState("");
  const {
    isAuthenticated,
    user,
    register,
    loginWithGoogle,
    loginWithApple,
    clearError,
    isLoading,
    error,
  } = useAuth();
  const navigate = useNavigate();
  const normalizedEmail = formState.email.trim().toLowerCase();
  const activeError = localError || error;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
    setLocalError("");
    clearError();
  };

  const redirectToWorkspace = (authenticatedUser) => {
    navigate(getDefaultRouteForRole(authenticatedUser.role), { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.name.trim() || !normalizedEmail || !formState.password.trim()) {
      setLocalError("Complete all sign up fields to continue.");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setLocalError("Password confirmation does not match.");
      return;
    }

    try {
      const authenticatedUser = await register({
        name: formState.name,
        email: normalizedEmail,
        password: formState.password,
      });
      redirectToWorkspace(authenticatedUser);
    } catch (signupError) {
      return signupError;
    }
  };

  const handleProviderSignup = async (provider) => {
    setLocalError("");
    clearError();

    try {
      const authenticatedUser =
        provider === "apple"
          ? await loginWithApple(normalizedEmail)
          : await loginWithGoogle(normalizedEmail);
      redirectToWorkspace(authenticatedUser);
    } catch (signupError) {
      return signupError;
    }
  };

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card">
          <div className="auth-heading">
            <h1 className="auth-title">Sign Up</h1>
            <p className="auth-subtitle">
              Create your Smart Campus account and continue to your workspace.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field field-annotated">
              <span>Full name</span>
              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6.75 8.25a6.75 6.75 0 0 1 13.5 0"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <input
                  autoComplete="name"
                  className="login-input"
                  name="name"
                  onChange={handleFieldChange}
                  placeholder="Your full name"
                  type="text"
                  value={formState.name}
                />
              </div>
            </label>

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
                  value={formState.email}
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
                  autoComplete="new-password"
                  className="login-input"
                  name="password"
                  onChange={handleFieldChange}
                  placeholder="Create a password"
                  type="password"
                  value={formState.password}
                />
              </div>
            </label>

            <label className="field field-annotated">
              <span>Confirm password</span>
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
                    <path
                      d="m9.8 15.5 1.4 1.4 3-3"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <input
                  autoComplete="new-password"
                  className="login-input"
                  name="confirmPassword"
                  onChange={handleFieldChange}
                  placeholder="Confirm your password"
                  type="password"
                  value={formState.confirmPassword}
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
              Sign Up
            </Button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth-grid">
            <button
              className="social-button"
              disabled={isLoading}
              onClick={() => handleProviderSignup("google")}
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
              <span className="social-button-label">Continue with Google</span>
            </button>

            <button
              className="social-button"
              disabled={isLoading}
              onClick={() => handleProviderSignup("apple")}
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
              <span className="social-button-label">Continue with Apple</span>
            </button>
          </div>

          <p className="login-demo-note">
            Use your official campus email to activate the correct role and continue
            into your Smart Campus workspace.
          </p>

          <p className="auth-switch-copy">
            Already have an account?{" "}
            <Link className="text-link" to="/login">
              Login
            </Link>
          </p>

          {isLoading ? <LoadingSpinner label="Creating your account..." /> : null}
        </Card>
      </div>
    </section>
  );
}

export default SignupPage;
