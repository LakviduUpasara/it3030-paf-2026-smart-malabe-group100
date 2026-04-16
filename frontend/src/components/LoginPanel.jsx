import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FaApple } from "react-icons/fa6";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import Button from "./Button";
import GoogleIdentityButton from "./GoogleIdentityButton";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole, normalizeRole, ROLES } from "../utils/roleUtils";

const DEMO_LOCAL_ADMIN_EMAIL = "admin@smartcampus.edu";
const DEMO_LOCAL_ADMIN_PASSWORD = "Admin@12345";

const viteDeveloperFlag = String(import.meta.env.VITE_DEVELOPER_MODE ?? "")
  .trim()
  .toLowerCase() === "true";

const initialCredentials = {
  email: viteDeveloperFlag ? DEMO_LOCAL_ADMIN_EMAIL : "",
  password: viteDeveloperFlag ? DEMO_LOCAL_ADMIN_PASSWORD : "",
};

function LoginPanel({ showHeading = true }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    devLogin,
    developerMode,
    loginWithGoogle,
    loginWithApple,
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

  useEffect(() => {
    let isMounted = true;

    const loadQrCode = async () => {
      if (!twoFactorChallenge?.qrCodeUri) {
        setQrCodeDataUrl("");
        return;
      }

      try {
        const nextQrCode = await QRCode.toDataURL(twoFactorChallenge.qrCodeUri, {
          margin: 1,
          width: 176,
          color: {
            dark: "#16304a",
            light: "#ffffff",
          },
        });

        if (isMounted) {
          setQrCodeDataUrl(nextQrCode);
        }
      } catch {
        if (isMounted) {
          setQrCodeDataUrl("");
        }
      }
    };

    loadQrCode();

    return () => {
      isMounted = false;
    };
  }, [twoFactorChallenge]);

  useEffect(() => {
    if (!developerMode) {
      return;
    }

    setCredentials((previous) => {
      if (previous.email.trim() || previous.password.trim()) {
        return previous;
      }

      return {
        email: DEMO_LOCAL_ADMIN_EMAIL,
        password: DEMO_LOCAL_ADMIN_PASSWORD,
      };
    });
  }, [developerMode]);

  const redirectToWorkspace = (authenticatedUser) => {
    const role = normalizeRole(authenticatedUser?.role);
    const fromPath = location.state?.from?.pathname;
    const defaultPath =
      developerMode && role === ROLES.ADMIN && !fromPath ? "/admin" : getDefaultRouteForRole(role);
    const redirectTarget = fromPath || defaultPath;
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

  const handleDevQuickLogin = async (event) => {
    event.preventDefault();
    setLocalError("");
    clearError();

    if (!normalizedEmail) {
      setLocalError("Enter your campus email to use developer quick sign-in.");
      return;
    }

    try {
      const response = await devLogin(normalizedEmail);
      handleAuthResponse(response);
    } catch (quickLoginError) {
      return quickLoginError;
    }
  };

  const handleGoogleLogin = async (credential) => {
    setLocalError("");
    clearError();

    try {
      const response = await loginWithGoogle(credential);
      handleAuthResponse(response);
    } catch (loginError) {
      return loginError;
    }
  };

  const handleAppleLogin = async () => {
    return handleProviderLogin("Apple", loginWithApple);
  };

  const handleProviderLogin = async (providerLabel, loginAction) => {
    setLocalError("");
    clearError();

    if (!normalizedEmail) {
      setLocalError(`Enter your approved campus email before continuing with ${providerLabel}.`);
      return;
    }

    try {
      const response = await loginAction(normalizedEmail);
      handleAuthResponse(response);
    } catch (loginError) {
      return loginError;
    }
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
    setQrCodeDataUrl("");
    setLocalError("");
    clearError();
    clearTwoFactor();
  };

  return (
    <div className="login-premium-shell">
      {showHeading ? (
        <div className="signup-shell-head login-shell-head">
          <div className="signup-shell-head-top">
            <span className="signup-eyebrow login-eyebrow">
              {twoFactorChallenge ? "Secure Verification" : "Campus Login"}
            </span>
          </div>
          <div className="auth-heading signup-heading login-heading">
            <h1 className="auth-title signup-title login-title-premium">
              {twoFactorChallenge ? "Complete verification" : "Welcome back"}
            </h1>
            <p className="auth-subtitle signup-subtitle login-subtitle-premium">
              {twoFactorChallenge
                ? "Verify your account to finish signing in to Smart Campus."
                : developerMode
                  ? "Developer mode is on: you can use quick sign-in or the standard flow below."
                  : "Sign in with your approved campus account to continue to your workspace."}
            </p>
          </div>
        </div>
      ) : null}

      {twoFactorChallenge ? (
        <form className="login-form auth-verification-form" onSubmit={handleVerifyTwoFactor}>
          <div className="auth-help-panel">
            <p className="supporting-text">{twoFactorChallenge.deliveryHint}</p>

            {qrCodeDataUrl ? (
              <div className="authenticator-setup-card">
                <div className="authenticator-setup-qr">
                  <img
                    alt="Google Authenticator QR code"
                    className="authenticator-qr-image"
                    src={qrCodeDataUrl}
                  />
                </div>
                <div className="authenticator-setup-copy">
                  <strong>Scan with Google Authenticator</strong>
                  <p>
                    Open Google Authenticator, tap the plus button, then scan this QR code.
                  </p>
                </div>
              </div>
            ) : null}

            {twoFactorChallenge.debugCode ? (
              <p className="auth-inline-code">
                Demo email verification code: <strong>{twoFactorChallenge.debugCode}</strong>
              </p>
            ) : null}

            {twoFactorChallenge.manualEntryKey ? (
              <div className="auth-inline-block">
                <strong>Manual setup key</strong>
                <p className="supporting-text">
                  If scanning is unavailable, add an account manually in Google Authenticator
                  and paste this key.
                </p>
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

          <div className="auth-actions-row signup-form-actions">
            <Button className="signup-submit" disabled={isLoading} type="submit" variant="primary">
              Verify and Continue
            </Button>
            <Button
              className="login-secondary-action"
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
          {developerMode ? (
            <>
              <div className="auth-help-panel login-dev-banner">
                <p className="supporting-text">
                  <strong>Developer mode:</strong> second-factor and email OTP delivery are bypassed on the server.
                  Never turn this on for production deployments.
                </p>
                <Button
                  className="signup-submit login-dev-quick"
                  disabled={isLoading}
                  onClick={handleDevQuickLogin}
                  type="button"
                  variant="primary"
                >
                  Quick sign-in (email only)
                </Button>
              </div>
              <div className="auth-divider">
                <span>or standard sign-in</span>
              </div>
            </>
          ) : null}

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
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="input-action-button"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                </button>
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
              className="login-submit signup-submit"
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
            <GoogleIdentityButton
              buttonText="continue_with"
              disabled={isLoading}
              maxWidth={340}
              minWidth={220}
              onCredential={handleGoogleLogin}
              onError={(message) => setLocalError(message)}
              size="medium"
            />

        {activeError ? <p className="alert alert-error">{activeError}</p> : null}

        <Button className="login-submit" disabled={isLoading} type="submit" variant="primary">
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
          <span className="social-button-label">Continue with Google</span>
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
          <span className="social-button-label">Continue with Apple</span>
        </button>
      </div>

      <p className="login-demo-note">
        Need access? Contact Campus IT Services. Demo accounts:{" "}
        <strong>user@smartcampus.edu</strong> (student),{" "}
        <strong>admin@smartcampus.edu</strong>, and{" "}
        <strong>technician@smartcampus.edu</strong>.
      </p>

      <p className="auth-switch-copy">
        Need access?{" "}
        <Link className="text-link" to="/signup">
          Create an account
        </Link>
      </p>

      {isLoading ? <LoadingSpinner label="Authenticating your access..." /> : null}
    </div>
  );
}

export default LoginPanel;
