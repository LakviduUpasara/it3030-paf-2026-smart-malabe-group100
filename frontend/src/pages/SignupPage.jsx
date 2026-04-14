import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import GoogleIdentityButton from "../components/GoogleIdentityButton";
import LoadingSpinner from "../components/LoadingSpinner";
import SocialAccountChooserModal from "../components/SocialAccountChooserModal";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const AUTH_PROVIDERS = { LOCAL: "LOCAL", GOOGLE: "GOOGLE", APPLE: "APPLE" };
const SOCIAL_COPY = {
  GOOGLE: { label: "Google" },
  APPLE: { label: "Apple" },
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

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card">
          <div className="auth-heading">
            <h1 className="auth-title">Sign Up</h1>
            <p className="auth-subtitle">
              {isSocial
                ? `${SOCIAL_COPY[provider].label} account verified. Complete the campus profile and send the approval request. Email is pulled from the provider automatically.`
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
              <>
                <label className="field field-annotated">
                  <span>Full name</span>
                  <div className="input-shell">
                    <input className="login-input" name="fullName" onChange={handleChange} onInput={handleChange} placeholder="Your full name" type="text" value={formState.fullName} />
                  </div>
                </label>

                <label className="field field-annotated">
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
              </>
            ) : null}

            {step === 1 && isSocial ? (
              <div className="auth-provider-summary">
                <span className="status-pill status-approved">
                  {SOCIAL_COPY[provider].label} Account Connected
                </span>
                <strong className="auth-provider-title">{formState.fullName}</strong>
                <p className="supporting-text">{formState.email}</p>
                <p className="auth-provider-helper">
                  Provider authentication is complete. Continue to the campus profile, or reconnect the account without typing the email again.
                </p>
                <div className="auth-actions-row">
                  <Button onClick={() => setStep(2)} type="button" variant="primary">Continue to Campus Profile</Button>
                  <Button
                    onClick={() =>
                      provider === AUTH_PROVIDERS.GOOGLE
                        ? backToLocalSignup()
                        : openSocialChooser(provider)
                    }
                    type="button"
                    variant="secondary"
                  >
                    Change Account
                  </Button>
                  <Button onClick={backToLocalSignup} type="button" variant="ghost">Use Email and Password</Button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <>
                {isSocial ? (
                  <div className="auth-provider-summary auth-provider-summary-compact">
                    <span className="status-pill status-approved">
                      {SOCIAL_COPY[provider].label} Account Connected
                    </span>
                    <div className="auth-provider-grid">
                      <div>
                        <strong>{formState.fullName}</strong>
                        <p className="supporting-text">{formState.email}</p>
                      </div>
                      <Button
                        onClick={() =>
                          provider === AUTH_PROVIDERS.GOOGLE
                            ? backToLocalSignup()
                            : openSocialChooser(provider)
                        }
                        type="button"
                        variant="secondary"
                      >
                        Change Account
                      </Button>
                    </div>
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

                <label className="field field-annotated">
                  <span>Reason for access</span>
                  <textarea className="auth-textarea" name="reasonForAccess" onChange={handleChange} onInput={handleChange} placeholder="Explain why you need Smart Campus Operations Hub access." rows="4" value={formState.reasonForAccess} />
                </label>

                <div className="field field-annotated">
                  <span>Preferred 2-step verification method</span>
                  {isSocial ? (
                    <div className="auth-method-lock">
                      <strong>Google Authenticator is enabled for social sign-up</strong>
                      <p>
                        After administrator approval and the first social login, Smart Campus
                        will show the setup key for Google Authenticator and ask for the
                        generated 6-digit code.
                      </p>
                    </div>
                  ) : (
                    <div className="auth-method-grid">
                      <label className="auth-method-option">
                        <input checked={formState.preferredTwoFactorMethod === "EMAIL_OTP"} name="preferredTwoFactorMethod" onChange={handleChange} type="radio" value="EMAIL_OTP" />
                        <span>Email verification</span>
                        <small>Receive a one-time code during sign in.</small>
                      </label>
                      <label className="auth-method-option">
                        <input checked={formState.preferredTwoFactorMethod === "AUTHENTICATOR_APP"} name="preferredTwoFactorMethod" onChange={handleChange} type="radio" value="AUTHENTICATOR_APP" />
                        <span>Google Authenticator</span>
                        <small>Use an authenticator app for the second step.</small>
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {activeError ? <p className="alert alert-error">{activeError}</p> : null}

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
