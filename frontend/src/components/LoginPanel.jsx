import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const initialCredentials = {
  email: "",
  password: "",
};

function LoginPanel({ showHeading = true }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [verificationCode, setVerificationCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const {
    login,
    loginWithGoogle,
    verifyTwoFactor,
    clearError,
    clearTwoFactor,
    isLoading,
    error,
    twoFactorChallenge,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const activeError = localError || error;

  const redirectToWorkspace = (authenticatedUser) => {
    const redirectTarget =
      location.state?.from?.pathname || getDefaultRouteForRole(authenticatedUser.role);
    navigate(redirectTarget, { replace: true });
  };

  const handleAuthResponse = (response) => {
    if (!response) {
      return;
    }

    if (response.authStatus === "AUTHENTICATED" && response.user) {
      redirectToWorkspace(response.user);
      return;
    }

    if (response.authStatus === "PENDING_APPROVAL") {
      navigate("/approval-pending", { replace: true });
    }
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
      const response = await login({
        email: normalizedEmail,
        password: credentials.password,
      });
      handleAuthResponse(response);
    } catch (loginError) {
      return loginError;
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError("");
    clearError();

    if (!normalizedEmail) {
      setLocalError("Enter your approved campus email before continuing with Google.");
      return;
    }

    try {
      const response = await loginWithGoogle(normalizedEmail);
      handleAuthResponse(response);
    } catch (loginError) {
      return loginError;
    }
  };

  const handleAppleLogin = () => {
    setLocalError("Apple sign-in is not configured in this build yet.");
    clearError();
  };

  const handleVerifyTwoFactor = async (event) => {
    event.preventDefault();

    if (!verificationCode.trim() || !twoFactorChallenge?.challengeId) {
      setLocalError("Enter the verification code to finish sign in.");
      return;
    }

    try {
      const response = await verifyTwoFactor({
        challengeId: twoFactorChallenge.challengeId,
        code: verificationCode.trim(),
      });
      handleAuthResponse(response);
    } catch (verificationError) {
      return verificationError;
    }
  };

  const handleBackToLogin = () => {
    setVerificationCode("");
    setLocalError("");
    clearError();
    clearTwoFactor();
  };

  return (
    <>
      {showHeading ? (
        <div className="auth-heading">
          <h1 className="auth-title">
            {twoFactorChallenge ? "2-Step Verification" : "Login"}
          </h1>
          <p className="auth-subtitle">
            {twoFactorChallenge
              ? "Finish the verification step required for secure campus access."
              : "Sign in to continue to your Smart Campus workspace."}
          </p>
        </div>
      ) : null}

      {twoFactorChallenge ? (
        <form className="login-form auth-verification-form" onSubmit={handleVerifyTwoFactor}>
          <div className="auth-help-panel">
            <p className="supporting-text">{twoFactorChallenge.deliveryHint}</p>

            {twoFactorChallenge.debugCode ? (
              <p className="auth-inline-code">
                Demo email verification code: <strong>{twoFactorChallenge.debugCode}</strong>
              </p>
            ) : null}

            {twoFactorChallenge.manualEntryKey ? (
              <div className="auth-inline-block">
                <strong>Authenticator setup key</strong>
                <code>{twoFactorChallenge.manualEntryKey}</code>
              </div>
            ) : null}
          </div>

          <label className="field field-annotated">
            <span>Verification code</span>
            <div className="input-shell">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 12.5 10.5 15 16 9.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="3.75"
                    y="4.75"
                    width="16.5"
                    height="14.5"
                    rx="2.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <input
                autoComplete="one-time-code"
                className="login-input"
                onChange={(event) => {
                  setVerificationCode(event.target.value);
                  setLocalError("");
                  clearError();
                }}
                placeholder="Enter the 6-digit code"
                type="text"
                value={verificationCode}
              />
            </div>
          </label>

          {activeError ? <p className="alert alert-error">{activeError}</p> : null}

          <div className="auth-actions-row">
            <Button disabled={isLoading} type="submit" variant="primary">
              Verify and Continue
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleBackToLogin}
              type="button"
              variant="secondary"
            >
              Back
            </Button>
          </div>
        </form>
      ) : (
        <>
          <form className="login-form" onSubmit={handleCredentialLogin}>
            <label className="field field-annotated">
              <span>Campus Email</span>
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
                  placeholder="e.g., name@campus.edu"
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

            <div className="auth-form-utility">
              <label className="auth-checkbox">
                <input
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  type="checkbox"
                />
                <span>Remember Me</span>
              </label>
              <button className="auth-link-button" type="button">
                Forgot password?
              </button>
            </div>

            {activeError ? <p className="alert alert-error">{activeError}</p> : null}

            <Button
              className="login-submit"
              disabled={isLoading}
              type="submit"
              variant="primary"
            >
              Login
            </Button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth-grid">
            <button
              className="social-button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
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
              className="social-button social-button-apple"
              disabled={isLoading}
              onClick={handleAppleLogin}
              type="button"
            >
              <span className="social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.62 12.52c.03 3.07 2.7 4.1 2.73 4.12-.02.07-.43 1.48-1.42 2.93-.86 1.25-1.75 2.5-3.15 2.53-1.38.03-1.82-.82-3.4-.82-1.58 0-2.07.79-3.37.85-1.35.05-2.38-1.35-3.25-2.59-1.78-2.57-3.14-7.27-1.31-10.44.91-1.58 2.53-2.58 4.29-2.61 1.34-.03 2.6.91 3.4.91.79 0 2.28-1.13 3.84-.96.65.03 2.48.26 3.66 2 .1.07-2.18 1.27-2.15 4.08Zm-2.14-8.91c.72-.88 1.21-2.11 1.08-3.33-1.03.04-2.29.68-3.03 1.56-.67.77-1.26 2.01-1.1 3.2 1.15.09 2.32-.58 3.05-1.43Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <span className="social-button-label">Continue with Apple</span>
            </button>
          </div>

          <p className="login-demo-note">
            Demo local admin: <strong>admin@smartcampus.edu</strong> /
            <strong> Admin@12345</strong>. Demo Google access also supports
            <strong> google.admin@smartcampus.edu</strong>.
          </p>
        </>
      )}

      <p className="auth-switch-copy">
        Do not have an account?{" "}
        <Link className="text-link" to="/signup">
          Sign Up
        </Link>
      </p>

      {isLoading ? <LoadingSpinner label="Authenticating your access..." /> : null}
    </>
  );
}

export default LoginPanel;
