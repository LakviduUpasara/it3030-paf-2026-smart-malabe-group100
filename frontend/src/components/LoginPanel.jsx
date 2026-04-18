import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { FaApple } from "react-icons/fa6";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import Button from "./Button";
import GoogleIdentityButton from "./GoogleIdentityButton";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getAuthSecurityHints, normalizeAuthStatus } from "../services/authService";
import { getDefaultRouteForRole, normalizeRole, ROLES } from "../utils/roleUtils";
import { formatCountdownMs, parseBackendDateTime } from "../utils/dateTimeParse";

/** Fallback if API omits timing fields (should match backend app.auth.challenge-minutes). */
const OTP_CHALLENGE_MINUTES_FALLBACK = Number(
  String(import.meta.env.VITE_AUTH_CHALLENGE_MINUTES ?? "10").trim() || "10",
);

const initialCredentials = {
  email: "",
  password: "",
};

function LoginPanel({ showHeading = true }) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [allowSkipFirstLogin2fa, setAllowSkipFirstLogin2fa] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [firstLoginCurrentPw, setFirstLoginCurrentPw] = useState("");
  const [firstLoginNewPw, setFirstLoginNewPw] = useState("");
  const [firstLoginConfirmPw, setFirstLoginConfirmPw] = useState("");
  const {
    login,
    devLogin,
    developerMode,
    loginWithGoogle,
    loginWithApple,
    verifyTwoFactor,
    resendEmailOtp,
    changeFirstLoginPassword,
    selectFirstLoginTwoFactorMethod,
    skipFirstLoginTwoFactor,
    clearError,
    clearTwoFactor,
    logout,
    isLoading,
    error,
    twoFactorChallenge,
    sessionPhase,
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

  const [otpClockTick, setOtpClockTick] = useState(0);

  useEffect(() => {
    if (!twoFactorChallenge || twoFactorChallenge.method !== "EMAIL_OTP") {
      return;
    }
    const id = setInterval(() => setOtpClockTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [twoFactorChallenge?.challengeId, twoFactorChallenge?.method]);

  const emailOtpTiming = useMemo(() => {
    void otpClockTick;
    if (!twoFactorChallenge || twoFactorChallenge.method !== "EMAIL_OTP") {
      return {
        expireMs: 0,
        resendWaitMs: 0,
        canResend: false,
        showExpiryCountdown: false,
        expired: false,
      };
    }
    const now = Date.now();
    const expiresAt = parseBackendDateTime(twoFactorChallenge.expiresAt);
    const nextResendAt = parseBackendDateTime(twoFactorChallenge.nextResendAt);
    const showExpiryCountdown = Boolean(expiresAt);
    const expireMs = showExpiryCountdown ? expiresAt.getTime() - now : 0;
    const expired = showExpiryCountdown && expireMs <= 0;
    const resendWaitMs = nextResendAt ? nextResendAt.getTime() - now : 0;
    const canResend = !expired && resendWaitMs <= 0;
    return { expireMs, resendWaitMs, canResend, showExpiryCountdown, expired };
  }, [twoFactorChallenge, otpClockTick]);

  useEffect(() => {
    if (sessionPhase !== "TWO_FACTOR_METHOD_SELECTION") {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const hints = await getAuthSecurityHints();
        if (!cancelled) {
          setAllowSkipFirstLogin2fa(Boolean(hints?.allowSkippingFirstLoginTwoFactorSetup));
        }
      } catch {
        if (!cancelled) {
          setAllowSkipFirstLogin2fa(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionPhase]);

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

    const status = normalizeAuthStatus(response.authStatus);

    if (status === "AUTHENTICATED" && response.user) {
      redirectToWorkspace(response.user);
      return;
    }

    if (status === "PENDING_APPROVAL") {
      navigate("/approval-pending", { replace: true });
    }

    if (
      response.authStatus === "PASSWORD_CHANGE_REQUIRED"
      || response.authStatus === "TWO_FACTOR_METHOD_SELECTION_REQUIRED"
    ) {
      setFirstLoginCurrentPw("");
      setFirstLoginNewPw("");
      setFirstLoginConfirmPw("");
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

  const handleFirstLoginPassword = async (event) => {
    event.preventDefault();
    setLocalError("");
    clearError();
    if (!firstLoginCurrentPw.trim() || !firstLoginNewPw.trim()) {
      setLocalError("Enter your current password and a new password.");
      return;
    }
    if (firstLoginNewPw.length < 8) {
      setLocalError("New password must be at least 8 characters.");
      return;
    }
    if (firstLoginNewPw !== firstLoginConfirmPw) {
      setLocalError("New password and confirmation do not match.");
      return;
    }
    try {
      const response = await changeFirstLoginPassword({
        currentPassword: firstLoginCurrentPw,
        newPassword: firstLoginNewPw,
      });
      handleAuthResponse(response);
    } catch (passwordError) {
      return passwordError;
    }
  };

  const handlePickTwoFactorMethod = async (method) => {
    setLocalError("");
    clearError();
    if (method !== "EMAIL_OTP" && method !== "AUTHENTICATOR_APP") {
      setLocalError("Choose email or authenticator app verification.");
      return;
    }
    try {
      const response = await selectFirstLoginTwoFactorMethod(method);
      handleAuthResponse(response);
    } catch (selectionError) {
      return selectionError;
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

  const handleResendEmailOtp = async () => {
    if (!twoFactorChallenge?.challengeId) {
      return;
    }
    setLocalError("");
    clearError();
    try {
      await resendEmailOtp({ challengeId: twoFactorChallenge.challengeId });
      setVerificationCode("");
    } catch (resendError) {
      return resendError;
    }
  };

  const handleBackToLogin = async () => {
    setVerificationCode("");
    setQrCodeDataUrl("");
    setLocalError("");
    clearError();
    clearTwoFactor();
    setFirstLoginCurrentPw("");
    setFirstLoginNewPw("");
    setFirstLoginConfirmPw("");
    if (sessionPhase) {
      try {
        await logout();
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="login-premium-shell">
      {showHeading ? (
        <div className="signup-shell-head login-shell-head">
          <div className="signup-shell-head-top">
            <span className="signup-eyebrow login-eyebrow">
              {sessionPhase === "PASSWORD_CHANGE"
                ? "First sign-in"
                : sessionPhase === "TWO_FACTOR_METHOD_SELECTION"
                  ? "Security setup"
                  : twoFactorChallenge
                    ? "Secure Verification"
                    : "Campus Login"}
            </span>
          </div>
          <div className="auth-heading signup-heading login-heading">
            <h1 className="auth-title signup-title login-title-premium">
              {sessionPhase === "PASSWORD_CHANGE"
                ? "Set a new password"
                : sessionPhase === "TWO_FACTOR_METHOD_SELECTION"
                  ? "Choose verification method"
                  : twoFactorChallenge
                    ? "Complete verification"
                    : "Welcome back"}
            </h1>
            <p className="auth-subtitle signup-subtitle login-subtitle-premium">
              {sessionPhase === "PASSWORD_CHANGE"
                ? "Use your temporary or assigned password and choose a strong new password."
                : sessionPhase === "TWO_FACTOR_METHOD_SELECTION"
                  ? "Pick how you want to verify sign-in next time: email code or an authenticator app."
                  : twoFactorChallenge
                    ? "Verify your account to finish signing in to Smart Campus."
                    : developerMode
                      ? "Developer mode is on: you can use quick sign-in or the standard flow below."
                      : "Sign in with your approved campus account to continue to your workspace."}
            </p>
          </div>
        </div>
      ) : null}

      {sessionPhase === "PASSWORD_CHANGE" ? (
        <form className="login-form" onSubmit={handleFirstLoginPassword}>
          <p className="supporting-text">
            Your administrator requires a password change before you can access your dashboard.
          </p>
          <label className="field field-annotated">
            <span>Current password</span>
            <input
              autoComplete="current-password"
              className="login-input"
              onChange={(e) => setFirstLoginCurrentPw(e.target.value)}
              type="password"
              value={firstLoginCurrentPw}
            />
          </label>
          <label className="field field-annotated">
            <span>New password (min 8 characters)</span>
            <input
              autoComplete="new-password"
              className="login-input"
              onChange={(e) => setFirstLoginNewPw(e.target.value)}
              type="password"
              value={firstLoginNewPw}
            />
          </label>
          <label className="field field-annotated">
            <span>Confirm new password</span>
            <input
              autoComplete="new-password"
              className="login-input"
              onChange={(e) => setFirstLoginConfirmPw(e.target.value)}
              type="password"
              value={firstLoginConfirmPw}
            />
          </label>
          {activeError ? <p className="alert alert-error">{activeError}</p> : null}
          <div className="auth-actions-row signup-form-actions">
            <Button className="signup-submit" disabled={isLoading} type="submit" variant="primary">
              Continue
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
      ) : sessionPhase === "TWO_FACTOR_METHOD_SELECTION" ? (
        <div className="login-form auth-verification-form">
          <p className="supporting-text">
            2-step verification is optional. Email sends a code to your inbox. Authenticator shows a QR code once to link
            the app; after that, sign-in uses the app. You can skip now and configure this later in System Settings.
          </p>
          <div className="auth-actions-row signup-form-actions flex-col gap-2 sm:flex-row">
            <Button
              className="signup-submit flex-1"
              disabled={isLoading}
              onClick={() => handlePickTwoFactorMethod("EMAIL_OTP")}
              type="button"
              variant="primary"
            >
              Email verification code
            </Button>
            <Button
              className="signup-submit flex-1"
              disabled={isLoading}
              onClick={() => handlePickTwoFactorMethod("AUTHENTICATOR_APP")}
              type="button"
              variant="secondary"
            >
              Google Authenticator (TOTP)
            </Button>
          </div>
          {activeError ? <p className="alert alert-error">{activeError}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="login-secondary-action"
              disabled={isLoading}
              onClick={handleBackToLogin}
              type="button"
              variant="secondary"
            >
              Back
            </Button>
            {allowSkipFirstLogin2fa ? (
              <Button
                className="login-secondary-action"
                disabled={isLoading}
                onClick={async () => {
                  setLocalError("");
                  clearError();
                  try {
                    const response = await skipFirstLoginTwoFactor();
                    handleAuthResponse(response);
                  } catch {
                    /* error surfaced via context */
                  }
                }}
                type="button"
                variant="secondary"
              >
                Skip for now
              </Button>
            ) : (
              <p className="supporting-text text-sm">
                Your organization requires 2-step verification. Choose email or authenticator to continue.
              </p>
            )}
          </div>
        </div>
      ) : twoFactorChallenge ? (
        <form className="login-form auth-verification-form" onSubmit={handleVerifyTwoFactor}>
          <div className="auth-help-panel">
            <p className="supporting-text">{twoFactorChallenge.deliveryHint}</p>

            {twoFactorChallenge.method === "EMAIL_OTP" ? (
              <div className="auth-otp-meta-row" aria-live="polite">
                <span>
                  {emailOtpTiming.showExpiryCountdown ? (
                    <strong>
                      {emailOtpTiming.expired
                        ? "This code has expired."
                        : `Code expires in ${formatCountdownMs(emailOtpTiming.expireMs)}`}
                    </strong>
                  ) : (
                    <span className="auth-otp-static-hint">
                      Use the code from your email within about {OTP_CHALLENGE_MINUTES_FALLBACK} minutes.
                    </span>
                  )}
                </span>
                <span className="auth-otp-resend-wrap">
                  {emailOtpTiming.expired ? (
                    <span className="auth-otp-expired-hint">Sign in again to request a new code.</span>
                  ) : emailOtpTiming.resendWaitMs > 0 ? (
                    <span>
                      Resend available in <strong>{formatCountdownMs(emailOtpTiming.resendWaitMs)}</strong>
                    </span>
                  ) : (
                    <button
                      className="auth-resend-btn"
                      disabled={isLoading || !emailOtpTiming.canResend}
                      onClick={handleResendEmailOtp}
                      type="button"
                    >
                      Resend code
                    </button>
                  )}
                </span>
              </div>
            ) : null}

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
            <Button
              className="signup-submit"
              disabled={
                isLoading ||
                (twoFactorChallenge?.method === "EMAIL_OTP" && emailOtpTiming.expired)
              }
              type="submit"
              variant="primary"
            >
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
                  <strong>Developer mode (API):</strong> the server skips second-factor and allows quick sign-in. This
                  banner only appears when the backend reports developer mode (see
                  <code> APP_DEVELOPER_MODE</code> or Spring <code>dev</code> profile).
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
              className="social-button"
              disabled={isLoading}
              onClick={handleAppleLogin}
              type="button"
            >
              <span className="social-icon" aria-hidden="true">
                <FaApple />
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
        </>
      )}
    </div>
  );
}

export default LoginPanel;
