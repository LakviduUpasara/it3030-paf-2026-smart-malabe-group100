import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FaApple } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import {
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import Button from "../components/Button";
import Card from "../components/Card";
import GoogleIdentityButton from "../components/GoogleIdentityButton";
import LoadingSpinner from "../components/LoadingSpinner";
import SocialAccountChooserModal from "../components/SocialAccountChooserModal";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const AUTH_PROVIDERS = { LOCAL: "LOCAL", GOOGLE: "GOOGLE", APPLE: "APPLE" };
const SOCIAL_COPY = {
  GOOGLE: { label: "Google", icon: FcGoogle },
  APPLE: { label: "Apple", icon: FaApple },
};
const TWO_FACTOR_OPTIONS = [
  {
    value: "EMAIL_OTP",
    title: "Email verification code",
    description: "Get a one-time code in your approved inbox.",
    badge: "Inbox",
    icon: HiOutlineEnvelope,
  },
  {
    value: "AUTHENTICATOR_APP",
    title: "Authenticator app",
    description: "Use a TOTP app for the rotating 6-digit code.",
    badge: "App",
    icon: HiOutlineShieldCheck,
  },
];
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
const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  campusId: "",
  phoneNumber: "",
  department: "",
  reasonForAccess: "",
  preferredTwoFactorMethod: "EMAIL_OTP",
};

function SignupPage() {
  const [formState, setFormState] = useState(initialForm);
  const [step, setStep] = useState(1);
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
  } =
    useAuth();
  const navigate = useNavigate();
  const isSocial = provider !== AUTH_PROVIDERS.LOCAL;
  const activeError = localError || error;
  const shouldShowLoginHint = /already has an approved smart campus account|already have an account|please log in instead/i.test(
    activeError,
  );
  const providerMeta = SOCIAL_COPY[provider];
  const ProviderIcon = providerMeta?.icon;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      campusId: String(data.get("campusId") || formState.campusId || ""),
      phoneNumber: String(data.get("phoneNumber") || formState.phoneNumber || ""),
      department: String(data.get("department") || formState.department || ""),
      reasonForAccess: String(data.get("reasonForAccess") || formState.reasonForAccess || ""),
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

  const normalizeIdentity = (fullName, email) => ({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
  });

  const validateAccount = (state, nextProvider = provider) => {
    const identity = normalizeIdentity(state.fullName, state.email);

    if (!identity.fullName || !identity.email) {
      setLocalError("Complete your account details to continue.");
      return false;
    }

    if (!emailPattern.test(identity.email)) {
      setLocalError("Enter a valid email address to continue.");
      return false;
    }

    if (nextProvider === AUTH_PROVIDERS.LOCAL && !state.password.trim()) {
      setLocalError("Enter a password to continue with local sign up.");
      return false;
    }

    if (
      nextProvider === AUTH_PROVIDERS.LOCAL &&
      state.password !== state.confirmPassword
    ) {
      setLocalError("Password confirmation does not match.");
      return false;
    }

    return true;
  };

  const validateProfile = (state) => {
    if (!state.campusId.trim() || !state.phoneNumber.trim() || !state.department.trim() || !state.reasonForAccess.trim()) {
      setLocalError("Complete the campus profile details before submitting the request.");
      return false;
    }
    return true;
  };

  const goToProfileStep = () => {
    const current = syncForm();
    if (!validateAccount(current, AUTH_PROVIDERS.LOCAL)) {
      return;
    }
    setStep(2);
  };

  const openSocialChooser = (nextProvider) => {
    syncForm();
    setChooserProvider(nextProvider);
    clearTransientErrors();
  };

  const backToLocalSignup = () => {
    setProvider(AUTH_PROVIDERS.LOCAL);
    setStep(1);
    setSocialSignupToken("");
    clearTransientErrors();
    setChooserProvider(null);
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
        preferredTwoFactorMethod: "AUTHENTICATOR_APP",
      }));
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
      preferredTwoFactorMethod: "AUTHENTICATOR_APP",
    }));
    setChooserProvider(null);
    setStep(2);
    clearTransientErrors();
  };

  const submitSignup = async (event) => {
    event.preventDefault();
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

    if (!validateProfile(current)) {
      return;
    }

    try {
      const response = await register({
        ...current,
        fullName: identity.fullName,
        email: identity.email,
        authProvider: provider,
        socialSignupToken,
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
          <span className="connected-account-kicker">{providerMeta.label} account connected</span>
          <strong className="connected-account-name">{formState.fullName}</strong>
          <div className="connected-account-email">
            <HiOutlineEnvelope />
            <span>{formState.email}</span>
          </div>
        </div>
        <span className="connected-account-status">
          <HiOutlineCheckBadge />
          <span>Verified</span>
        </span>
      </div>

      <div className={`auth-actions-row connected-account-actions ${compact ? "connected-account-actions-compact" : ""}`.trim()}>
        {!compact ? (
          <Button className="connected-account-primary" onClick={() => setStep(2)} type="button" variant="primary">
            Continue to Campus Profile
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
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card">
          <div className="auth-heading">
            <h1 className="auth-title">Sign Up</h1>
            <p className="auth-subtitle">
              {isSocial
                ? `${SOCIAL_COPY[provider].label} account verified. Complete the remaining campus profile fields and submit the approval request.`
                : "Submit your account request in two steps. An administrator must approve the request and assign your role before sign in is enabled."}
            </p>
          </div>

          <div className="auth-progress">
            <span className={`auth-progress-step ${step === 1 ? "is-active" : ""}`.trim()}>
              {isSocial ? `1. ${SOCIAL_COPY[provider].label} Account` : "1. Account"}
            </span>
            <span className={`auth-progress-step ${step === 2 ? "is-active" : ""}`.trim()}>
              2. Campus Profile
            </span>
          </div>

          <form className="login-form" onSubmit={submitSignup} ref={formRef}>
            {step === 1 && !isSocial ? (
              <div className="auth-form-grid">
                <label className="field field-annotated field-full">
                  <span>Full name</span>
                  <div className="input-shell">
                    <input className="login-input" name="fullName" onChange={handleChange} onInput={handleChange} placeholder="Your full name" type="text" value={formState.fullName} />
                  </div>
                </label>

                <label className="field field-annotated field-full">
                  <span>Email address</span>
                  <div className="input-shell">
                    <input className="login-input" name="email" onChange={handleChange} onInput={handleChange} placeholder="name@smartcampus.edu" type="email" value={formState.email} />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Password</span>
                  <div className="input-shell">
                    <input className="login-input" name="password" onChange={handleChange} onInput={handleChange} placeholder="Create a password" type="password" value={formState.password} />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Confirm password</span>
                  <div className="input-shell">
                    <input className="login-input" name="confirmPassword" onChange={handleChange} onInput={handleChange} placeholder="Confirm your password" type="password" value={formState.confirmPassword} />
                  </div>
                </label>
              </div>
            ) : null}

            {step === 1 && isSocial ? (
              renderConnectedAccountCard()
            ) : null}

            {step === 2 ? (
              <div className="auth-form-grid">
                {isSocial ? (
                  <div className="field-full">
                    {renderConnectedAccountCard({ compact: true })}
                  </div>
                ) : null}

                <label className="field field-annotated">
                  <span>Campus ID</span>
                  <div className="input-shell">
                    <input className="login-input" name="campusId" onChange={handleChange} onInput={handleChange} placeholder="IT23123456 / EMP-109" type="text" value={formState.campusId} />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Phone number</span>
                  <div className="input-shell">
                    <input className="login-input" name="phoneNumber" onChange={handleChange} onInput={handleChange} placeholder="+94 77 123 4567" type="text" value={formState.phoneNumber} />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Department / Faculty</span>
                  <div className="input-shell">
                    <input className="login-input" name="department" onChange={handleChange} onInput={handleChange} placeholder="Computing / Facilities / Administration" type="text" value={formState.department} />
                  </div>
                </label>

                <label className="field field-annotated field-full">
                  <span>Reason for access</span>
                  <textarea className="auth-textarea" name="reasonForAccess" onChange={handleChange} onInput={handleChange} placeholder="Explain why you need Smart Campus Operations Hub access." rows="4" value={formState.reasonForAccess} />
                </label>

                <div className="field field-annotated field-full">
                  <div className="field-section-heading">
                    <span>2-step verification</span>
                    <p>Choose how Smart Campus verifies secure sign-in.</p>
                  </div>
                  <div className="auth-method-grid">
                    {TWO_FACTOR_OPTIONS.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = formState.preferredTwoFactorMethod === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`auth-method-option ${isSelected ? "is-selected" : ""}`.trim()}
                        >
                          <input
                            checked={isSelected}
                            name="preferredTwoFactorMethod"
                            onChange={handleChange}
                            type="radio"
                            value={option.value}
                          />
                          <div className="auth-method-option-top">
                            <span className="auth-method-icon" aria-hidden="true">
                              <OptionIcon />
                            </span>
                            <span className="auth-method-badge">{option.badge}</span>
                          </div>
                          <div className="auth-method-option-copy">
                            <span>{option.title}</span>
                            <small>{option.description}</small>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
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
              <Button className="login-submit" onClick={goToProfileStep} type="button" variant="primary">
                Continue
              </Button>
            ) : null}

            {step === 2 ? (
              <div className="auth-actions-row">
                <Button onClick={() => setStep(1)} type="button" variant="secondary">Back</Button>
                <Button className="login-submit" disabled={isLoading} type="submit" variant="primary">
                  Submit Approval Request
                </Button>
              </div>
            ) : null}
          </form>

          {!isSocial && step === 1 ? (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
              <div className="social-auth-grid">
                <GoogleIdentityButton
                  buttonText="signup_with"
                  disabled={isLoading}
                  onCredential={handleGoogleSignup}
                  onError={(message) => setLocalError(message)}
                />
                <button className="social-button social-button-apple" disabled={isLoading} onClick={() => openSocialChooser(AUTH_PROVIDERS.APPLE)} type="button">
                  <span className="social-button-label">Sign up with Apple</span>
                </button>
              </div>
              <p className="login-demo-note">
                Google sign-up uses a real Google account chooser and brings back the verified
                profile automatically. Apple sign-up remains a placeholder until Apple Sign In is
                configured.
              </p>
            </>
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
