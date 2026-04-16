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

            <button
              className="social-button social-button-apple"
              disabled={isLoading}
              onClick={handleAppleLogin}
              type="button"
            >
              <span className="social-button-icon-shell" aria-hidden="true">
                <FaApple />
              </span>
              <span className="social-button-copy">
                <span className="social-button-label">Continue with Apple</span>
                <small className="social-button-caption">Use your approved Apple ID</small>
              </span>
            </button>
          </div>

          <p className="login-demo-note auth-assist-note">
            {developerMode ? (
              <>
                Demo admin (local): <strong>{DEMO_LOCAL_ADMIN_EMAIL}</strong> + password{" "}
                <strong>{DEMO_LOCAL_ADMIN_PASSWORD}</strong> (exact capitals/symbols). Quick sign-in still needs{" "}
                <code>APP_DEVELOPER_MODE</code> or Spring <code>dev</code> profile on the API.
              </>
            ) : (
              <>
                Test admin access: <strong>{DEMO_LOCAL_ADMIN_EMAIL}</strong> / <strong>{DEMO_LOCAL_ADMIN_PASSWORD}</strong>.
              </>
            )}
          </p>
        </>
      )}

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
