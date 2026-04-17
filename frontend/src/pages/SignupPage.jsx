import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaApple } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineCheckBadge, HiOutlineEnvelope } from "react-icons/hi2";
import Button from "../components/Button";
import Card from "../components/Card";
import GoogleIdentityButton from "../components/GoogleIdentityButton";
import LoadingSpinner from "../components/LoadingSpinner";
import SignupRegistrationFields from "../components/signup/SignupRegistrationFields";
import SocialAccountChooserModal from "../components/SocialAccountChooserModal";
import { useAuth } from "../hooks/useAuth";
import {
  buildInitialDraft,
  deriveRegisterPayloadPrimitives,
  validateRegistrationDraft,
} from "../signup/registrationUtils";
import { getPasswordStrength } from "../utils/passwordStrength";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const AUTH_PROVIDERS = { LOCAL: "LOCAL", GOOGLE: "GOOGLE", APPLE: "APPLE" };
const SOCIAL_COPY = {
  GOOGLE: { label: "Google", icon: FcGoogle },
  APPLE: { label: "Apple", icon: FaApple },
};
const PROVIDER_ACCOUNT_CHOICES = {
  GOOGLE: [
    {
      id: "google-student-applicant",
      fullName: "Campus Student Applicant",
      email: "student.applicant@smartcampus.edu",
      avatarLabel: "S",
      description: "Student onboarding request",
    },
    {
      id: "google-staff-applicant",
      fullName: "Facilities Staff Applicant",
      email: "staff.applicant@smartcampus.edu",
      avatarLabel: "F",
      description: "Operations and resource access request",
    },
    {
      id: "google-technician-applicant",
      fullName: "Maintenance Technician Applicant",
      email: "technician.applicant@smartcampus.edu",
      avatarLabel: "T",
      description: "Maintenance and incident support onboarding",
    },
  ],
  APPLE: [
    {
      id: "apple-student-applicant",
      fullName: "Campus iCloud Student",
      email: "icloud.student@smartcampus.edu",
      avatarLabel: "S",
      description: "Apple ID based student onboarding",
    },
    {
      id: "apple-staff-applicant",
      fullName: "Campus iCloud Staff",
      email: "icloud.staff@smartcampus.edu",
      avatarLabel: "A",
      description: "Apple ID based staff onboarding",
    },
  ],
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Roles applicants may request (platform roles are assigned only after review). */
const REQUESTABLE_ROLES = ["USER", "STUDENT", "LECTURER", "LAB_ASSISTANT", "TECHNICIAN", "MANAGER", "ADMIN"];

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  reasonForAccess: "",
  requestedRole: "USER",
  /** Matches backend TwoFactorMethod — required by API validation; user picks on step 3. */
  preferredTwoFactorMethod: "EMAIL_OTP",
};

function SignupPage() {
  const [formState, setFormState] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [registrationDraft, setRegistrationDraft] = useState(null);
  const [certifyAccuracy, setCertifyAccuracy] = useState(false);
  const [provider, setProvider] = useState(AUTH_PROVIDERS.LOCAL);
  const [chooserProvider, setChooserProvider] = useState(null);
  const [socialSignupToken, setSocialSignupToken] = useState("");
  const [localError, setLocalError] = useState("");
  const formRef = useRef(null);
  const {
    isAuthenticated,
    pendingApproval,
    user,
    register,
    prepareGoogleSignup,
    clearError,
    isLoading,
    error,
  } = useAuth();
  const navigate = useNavigate();
  const isSocial = provider !== AUTH_PROVIDERS.LOCAL;
  const activeError = localError || error;
  const shouldShowLoginHint = /already has an approved smart campus account|already have an account|please log in instead/i.test(
    activeError,
  );
  const providerMeta = SOCIAL_COPY[provider];
  const ProviderIcon = providerMeta?.icon;
  const stepLabel =
    step === 1 ? "Account" : step === 2 ? "Campus registration" : "Request & confirm";
  const passwordStrength = getPasswordStrength(formState.password);
  const passwordHasValue = formState.password.trim().length > 0;
  const confirmPasswordHasValue = formState.confirmPassword.trim().length > 0;
  const passwordsMatch =
    confirmPasswordHasValue && formState.password === formState.confirmPassword;
  const isFormDirty =
    step > 1 ||
    provider !== AUTH_PROVIDERS.LOCAL ||
    socialSignupToken ||
    Object.entries(formState).some(([, value]) => String(value).trim() !== "") ||
    certifyAccuracy;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  if (pendingApproval?.status === "PENDING") {
    return <Navigate replace to="/approval-pending" />;
  }

  const syncForm = () => {
    if (!formRef.current) {
      return formState;
    }
    const data = new FormData(formRef.current);
    const next = {
      fullName: String(data.get("fullName") || formState.fullName || ""),
      email: String(data.get("email") || formState.email || ""),
      password: String(data.get("password") || formState.password || ""),
      confirmPassword: String(data.get("confirmPassword") || formState.confirmPassword || ""),
      reasonForAccess: String(data.get("reasonForAccess") || formState.reasonForAccess || ""),
      requestedRole: String(data.get("requestedRole") || formState.requestedRole || "USER"),
      preferredTwoFactorMethod: String(
        data.get("preferredTwoFactorMethod") || formState.preferredTwoFactorMethod || "EMAIL_OTP",
      ),
    };
    setFormState(next);
    return next;
  };

  const clearTransientErrors = () => {
    setLocalError("");
    clearError();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
    clearTransientErrors();
  };

  const handleRequestedRoleChange = (event) => {
    const r = event.target.value;
    setFormState((current) => {
      const next = { ...current, requestedRole: r };
      setRegistrationDraft(buildInitialDraft(r, next.fullName, next.email));
      return next;
    });
    clearTransientErrors();
  };

  const normalizeIdentity = (fullName, email) => ({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
  });

  const validateAccount = (state, nextProvider = provider) => {
    const identity = normalizeIdentity(state.fullName, state.email);
    if (!identity.email) {
      setLocalError("Enter your primary email address to continue.");
      return false;
    }
    if (!emailPattern.test(identity.email)) {
      setLocalError("Enter a valid email address to continue.");
      return false;
    }
    if (!identity.fullName) {
      setLocalError("Enter your full name to continue.");
      return false;
    }
    if (nextProvider === AUTH_PROVIDERS.LOCAL && !state.password.trim()) {
      setLocalError("Enter a password to continue with local sign up.");
      return false;
    }
    if (nextProvider === AUTH_PROVIDERS.LOCAL && state.password !== state.confirmPassword) {
      setLocalError("Password confirmation does not match.");
      return false;
    }
    return true;
  };

  const goToRegistrationStep = () => {
    const current = syncForm();
    if (!validateAccount(current, AUTH_PROVIDERS.LOCAL)) {
      return;
    }
    setRegistrationDraft(
      buildInitialDraft(current.requestedRole || "USER", current.fullName, current.email),
    );
    setStep(2);
  };

  const goToRequestStep = () => {
    if (!registrationDraft) {
      setLocalError("Complete the registration form.");
      return;
    }
    const msg = validateRegistrationDraft(formState.requestedRole, registrationDraft);
    if (msg) {
      setLocalError(msg);
      return;
    }
    setLocalError("");
    setStep(3);
  };

  const handleStepBack = () => {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
  };

  const openSocialChooser = (nextProvider) => {
    syncForm();
    setChooserProvider(nextProvider);
    clearTransientErrors();
  };

  const resetSignupFlow = () => {
    setFormState(initialForm);
    setProvider(AUTH_PROVIDERS.LOCAL);
    setStep(1);
    setRegistrationDraft(null);
    setCertifyAccuracy(false);
    setSocialSignupToken("");
    clearTransientErrors();
    setChooserProvider(null);
  };

  const backToLocalSignup = () => {
    resetSignupFlow();
  };

  const handleGoogleSignup = async (credential) => {
    setLocalError("");
    clearError();
    try {
      const googleSession = await prepareGoogleSignup(credential);
      setProvider(AUTH_PROVIDERS.GOOGLE);
      setSocialSignupToken(googleSession.signupToken);
      setFormState((current) => ({
        ...current,
        fullName: googleSession.fullName,
        email: googleSession.email,
        password: "",
        confirmPassword: "",
      }));
      setRegistrationDraft(
        buildInitialDraft("USER", googleSession.fullName, googleSession.email),
      );
      setStep(2);
    } catch (signupError) {
      if (signupError?.status === 409) {
        setProvider(AUTH_PROVIDERS.LOCAL);
        setStep(1);
        setSocialSignupToken("");
        setLocalError(signupError.message || "This Google account already has access. Please log in instead.");
      }
      return signupError;
    }
  };

  const handleSocialAccountSelect = (selectedAccount) => {
    const selectedProvider = chooserProvider || provider || AUTH_PROVIDERS.GOOGLE;
    setProvider(selectedProvider);
    setSocialSignupToken("");
    setFormState((current) => ({
      ...current,
      fullName: selectedAccount.fullName,
      email: selectedAccount.email,
      password: "",
      confirmPassword: "",
    }));
    setRegistrationDraft(buildInitialDraft("USER", selectedAccount.fullName, selectedAccount.email));
    setChooserProvider(null);
    setStep(2);
    clearTransientErrors();
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    if (step !== 3) {
      return;
    }
    const current = syncForm();
    const identity = normalizeIdentity(current.fullName, current.email);
    if (provider === AUTH_PROVIDERS.GOOGLE && !socialSignupToken) {
      setLocalError("Reconnect your Google account before submitting the sign up request.");
      setStep(1);
      return;
    }
    if (!validateAccount(current, provider)) {
      setStep(1);
      return;
    }
    if (!registrationDraft) {
      setLocalError("Complete the registration step.");
      setStep(2);
      return;
    }
    const draftErr = validateRegistrationDraft(current.requestedRole, registrationDraft);
    if (draftErr) {
      setLocalError(draftErr);
      setStep(2);
      return;
    }
    if (!current.reasonForAccess.trim()) {
      setLocalError("Enter the reason for your access request.");
      return;
    }
    if (!certifyAccuracy) {
      setLocalError("Confirm that your details are accurate before submitting.");
      return;
    }
    const primitives = deriveRegisterPayloadPrimitives(current.requestedRole, registrationDraft, identity.email);
    try {
      const twoFa =
        current.preferredTwoFactorMethod === "AUTHENTICATOR_APP" ? "AUTHENTICATOR_APP" : "EMAIL_OTP";
      const response = await register({
        fullName: identity.fullName,
        email: identity.email,
        password: current.password,
        requestedRole: current.requestedRole || "USER",
        reasonForAccess: current.reasonForAccess.trim(),
        preferredTwoFactorMethod: twoFa,
        authProvider: provider,
        socialSignupToken,
        campusId: primitives.campusId,
        phoneNumber: primitives.phoneNumber,
        department: primitives.department,
        supplementaryProfile: primitives.supplementaryProfile,
        applicationProfileJson: primitives.applicationProfileJson,
      });
      if (response?.authStatus === "PENDING_APPROVAL") {
        navigate("/approval-pending", { replace: true });
      }
    } catch (submitError) {
      return submitError;
    }
  };

  const openConnectedAccountSwitcher = () => {
    if (provider === AUTH_PROVIDERS.GOOGLE) {
      backToLocalSignup();
      return;
    }
    openSocialChooser(provider);
  };

  const renderConnectedAccountCard = ({ compact = false } = {}) => (
    <div className={`connected-account-card ${compact ? "connected-account-card-compact" : ""}`.trim()}>
      <div className="connected-account-main">
        <div className={`connected-account-brand connected-account-brand-${provider.toLowerCase()}`} aria-hidden="true">
          {ProviderIcon ? <ProviderIcon /> : null}
        </div>
        <div className="connected-account-copy">
          <span className="connected-account-kicker">
            Connected with <span className="connected-account-kicker-brand">{providerMeta.label}</span>
          </span>
          <div className="connected-account-name-row">
            <strong className="connected-account-name">{formState.fullName}</strong>
          </div>
          <div className="connected-account-email">
            <HiOutlineEnvelope aria-hidden />
            <span>{formState.email}</span>
          </div>
        </div>
        <span className="connected-account-status">
          <HiOutlineCheckBadge aria-hidden />
          <span>Identity verified</span>
        </span>
      </div>
      <div className={`auth-actions-row connected-account-actions ${compact ? "connected-account-actions-compact" : ""}`.trim()}>
        {!compact ? (
          <Button
            className="connected-account-primary"
            onClick={() => {
              setRegistrationDraft(
                buildInitialDraft(formState.requestedRole || "USER", formState.fullName, formState.email),
              );
              setStep(2);
            }}
            type="button"
            variant="primary"
          >
            Continue to campus registration
          </Button>
        ) : null}
        <Button className="connected-account-switch" onClick={openConnectedAccountSwitcher} type="button" variant="secondary">
          {provider === AUTH_PROVIDERS.GOOGLE
            ? "Use Another Google Account"
            : `Change ${providerMeta.label} Account`}
        </Button>
        {!compact ? (
          <Button className="connected-account-link" onClick={backToLocalSignup} type="button" variant="ghost">
            Use Email and Password
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered signup-card-wrap">
        <Card className="auth-card glass-card signup-premium-card">
          <div className="signup-shell-head">
            <div className="signup-shell-head-top">
              <span className="signup-eyebrow">Campus Access</span>
              {isFormDirty ? (
                <button className="signup-reset-button" onClick={resetSignupFlow} type="button">
                  Start over
                </button>
              ) : null}
            </div>
            <div className="auth-heading signup-heading">
              <h1 className="auth-title signup-title">Create your Smart Campus account</h1>
              <p className="auth-subtitle signup-subtitle">
                {isSocial
                  ? `${SOCIAL_COPY[provider].label} account verified. Complete your campus profile for the role you request, then submit for review.`
                  : "Use your primary email, complete the campus registration step for your role, then submit your access request."}
              </p>
            </div>
          </div>

          <div className="signup-stagebar" aria-label={`Step ${step} of 3`}>
            <div className="signup-stagebar-meta">
              <strong>Step {step} of 3</strong>
              <span>{stepLabel}</span>
            </div>
            <div className="signup-stagebar-track" aria-hidden="true">
              <span className={`signup-stagebar-fill signup-stagebar-fill-step-${step}`.trim()} />
            </div>
            <div className="signup-stagebar-labels signup-stagebar-labels-3">
              <span className={step === 1 ? "is-active" : ""}>Account</span>
              <span className={step === 2 ? "is-active" : ""}>Registration</span>
              <span className={step === 3 ? "is-active" : ""}>Request</span>
            </div>
          </div>

          <form className="login-form" onSubmit={submitSignup} ref={formRef}>
            {step === 1 && !isSocial ? (
              <div className="auth-form-grid signup-form-grid">
                <label className="field field-annotated field-full">
                  <span>Primary email address *</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="email"
                      autoComplete="email"
                      onChange={handleChange}
                      onInput={handleChange}
                      placeholder="you@university.edu"
                      type="email"
                      value={formState.email}
                    />
                  </div>
                  <p className="supporting-text mt-1 text-xs text-text/60">This is your login and contact email.</p>
                </label>
                <label className="field field-annotated field-full">
                  <span>Full name *</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="fullName"
                      autoComplete="name"
                      onChange={handleChange}
                      onInput={handleChange}
                      placeholder="Your full name"
                      type="text"
                      value={formState.fullName}
                    />
                  </div>
                </label>
                <label className="field field-annotated">
                  <span>Password *</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="password"
                      onChange={handleChange}
                      onInput={handleChange}
                      placeholder="Create a password"
                      type="password"
                      value={formState.password}
                    />
                  </div>
                  {passwordHasValue ? (
                    <div className="password-strength-panel" aria-live="polite">
                      <div className="password-strength-head">
                        <strong>Password strength</strong>
                        <span className={`password-strength-badge password-strength-${passwordStrength.tone}`.trim()}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="password-strength-meter" aria-hidden="true">
                        <span
                          className={`password-strength-meter-fill password-strength-${passwordStrength.tone}`.trim()}
                          style={{ width: `${passwordStrength.progress}%` }}
                        />
                      </div>
                      <div className="password-strength-checks">
                        {passwordStrength.checks.map((check) => (
                          <span key={check.id} className={`password-check ${check.passed ? "is-passed" : ""}`.trim()}>
                            {check.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </label>
                <label className="field field-annotated">
                  <span>Confirm password *</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="confirmPassword"
                      onChange={handleChange}
                      onInput={handleChange}
                      placeholder="Confirm your password"
                      type="password"
                      value={formState.confirmPassword}
                    />
                  </div>
                  {confirmPasswordHasValue ? (
                    <p className={`password-match-note ${passwordsMatch ? "is-match" : "is-mismatch"}`.trim()}>
                      {passwordsMatch ? "Passwords match." : "Passwords do not match yet."}
                    </p>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 1 && isSocial ? renderConnectedAccountCard() : null}

            {step === 2 ? (
              <div className="auth-form-grid signup-form-grid">
                {isSocial ? (
                  <div className="field-full">{renderConnectedAccountCard({ compact: true })}</div>
                ) : null}
                <label className="field field-annotated field-full">
                  <span>Requested campus role *</span>
                  <div className="input-shell">
                    <select
                      className="login-input"
                      name="requestedRole"
                      onChange={handleRequestedRoleChange}
                      value={formState.requestedRole}
                    >
                      {REQUESTABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <div className="field-full rounded-2xl border border-border bg-card/60 p-5 text-left shadow-inner sm:p-6">
                  {registrationDraft ? (
                    <SignupRegistrationFields
                      draft={registrationDraft}
                      onDraftChange={setRegistrationDraft}
                      primaryEmail={formState.email}
                      requestedRole={formState.requestedRole}
                    />
                  ) : (
                    <p className="text-sm text-text/70">Loading form…</p>
                  )}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="auth-form-grid signup-form-grid">
                <div className="field-full rounded-2xl border border-border bg-tint/40 p-4 text-sm text-text/80">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text/55">Summary</p>
                  <p className="mt-2">
                    <strong>Role:</strong> {String(formState.requestedRole).replaceAll("_", " ")}
                  </p>
                  <p className="mt-1">
                    <strong>Email:</strong> {formState.email}
                  </p>
                  <p className="mt-1">
                    <strong>Name:</strong> {formState.fullName}
                  </p>
                </div>
                <label className="field field-annotated field-full">
                  <span>Reason for access *</span>
                  <textarea
                    className="auth-textarea"
                    name="reasonForAccess"
                    onChange={handleChange}
                    onInput={handleChange}
                    placeholder="Why do you need Smart Campus access?"
                    rows={4}
                    value={formState.reasonForAccess}
                  />
                </label>
                <label className="field field-annotated field-full">
                  <span>Preferred 2-step verification *</span>
                  <div className="input-shell">
                    <select
                      className="login-input"
                      name="preferredTwoFactorMethod"
                      onChange={handleChange}
                      value={formState.preferredTwoFactorMethod}
                    >
                      <option value="EMAIL_OTP">Email verification code</option>
                      <option value="AUTHENTICATOR_APP">Authenticator app</option>
                    </select>
                  </div>
                  <p className="supporting-text mt-1 text-xs text-text/60">
                    Applied after your request is approved (you can change this at first sign-in).
                  </p>
                </label>
                <label className="field field-annotated field-full flex flex-row items-start gap-3 !space-y-0">
                  <input
                    checked={certifyAccuracy}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                    onChange={(e) => {
                      setCertifyAccuracy(e.target.checked);
                      clearTransientErrors();
                    }}
                    type="checkbox"
                  />
                  <span className="text-sm leading-snug text-text/85">
                    I confirm the information above matches what the campus should use for my account, and I agree to
                    submit this request for administrator review.
                  </span>
                </label>
                <p className="field-full text-xs text-text/65">
                  After approval, first sign-in will guide you through password change (if applicable) and second-step
                  verification (email code or authenticator app).
                </p>
              </div>
            ) : null}

            {activeError ? (
              <div className="auth-inline-alert">
                <p className="alert alert-error">{activeError}</p>
                {shouldShowLoginHint ? (
                  <div className="auth-inline-alert-actions">
                    <Link className="text-link" to="/login">
                      Already have an account? Go to Login
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 1 && !isSocial ? (
              <Button className="login-submit signup-submit" onClick={goToRegistrationStep} type="button" variant="primary">
                Continue
              </Button>
            ) : null}

            {step === 2 ? (
              <div className="auth-actions-row signup-form-actions">
                <Button onClick={handleStepBack} type="button" variant="secondary">
                  Back
                </Button>
                <Button className="login-submit signup-submit" onClick={goToRequestStep} type="button" variant="primary">
                  Next
                </Button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="auth-actions-row signup-form-actions">
                <Button onClick={handleStepBack} type="button" variant="secondary">
                  Back
                </Button>
                <Button className="login-submit signup-submit" disabled={isLoading} type="submit" variant="primary">
                  Submit approval request
                </Button>
              </div>
            ) : null}
          </form>

          {!isSocial && step === 1 ? (
            <div className="signup-social-panel">
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              <div className="social-auth-grid signup-social-grid">
                <GoogleIdentityButton
                  buttonText="signup_with"
                  disabled={isLoading}
                  minWidth={220}
                  maxWidth={340}
                  onCredential={handleGoogleSignup}
                  onError={(message) => setLocalError(message)}
                  size="medium"
                />
                <button className="social-button social-button-apple" disabled={isLoading} onClick={() => openSocialChooser(AUTH_PROVIDERS.APPLE)} type="button">
                  <span className="social-button-icon-shell" aria-hidden="true">
                    <FaApple />
                  </span>
                  <span className="social-button-copy">
                    <span className="social-button-label">Sign up with Apple</span>
                    <small className="social-button-caption">Use your Apple ID</small>
                  </span>
                </button>
              </div>
              <p className="login-demo-note">Your Google / Apple email becomes the primary email for this request.</p>
            </div>
          ) : null}

          <p className="auth-switch-copy">
            Already have an account? <Link className="text-link" to="/login">Login</Link>
          </p>

          {isLoading ? <LoadingSpinner label="Submitting your request..." /> : null}
        </Card>
      </div>

      <SocialAccountChooserModal
        accounts={PROVIDER_ACCOUNT_CHOICES[chooserProvider] || []}
        isOpen={Boolean(chooserProvider)}
        onClose={() => setChooserProvider(null)}
        onSelect={handleSocialAccountSelect}
        provider={chooserProvider}
      />
    </section>
  );
}

export default SignupPage;
