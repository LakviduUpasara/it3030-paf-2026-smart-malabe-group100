import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

const initialFormState = {
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
  const [formState, setFormState] = useState(initialFormState);
  const [step, setStep] = useState(1);
  const [localError, setLocalError] = useState("");
  const { isAuthenticated, pendingApproval, user, register, clearError, isLoading, error } =
    useAuth();
  const navigate = useNavigate();
  const normalizedEmail = formState.email.trim().toLowerCase();
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

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
    setLocalError("");
    clearError();
  };

  const validateStepOne = () => {
    if (!formState.fullName.trim() || !normalizedEmail || !formState.password.trim()) {
      setLocalError("Complete your account details to continue.");
      return false;
    }

    if (formState.password !== formState.confirmPassword) {
      setLocalError("Password confirmation does not match.");
      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    if (
      !formState.campusId.trim() ||
      !formState.phoneNumber.trim() ||
      !formState.department.trim() ||
      !formState.reasonForAccess.trim()
    ) {
      setLocalError("Complete the campus profile details before submitting the request.");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateStepOne()) {
      return;
    }

    setStep(2);
    setLocalError("");
  };

  const handleBack = () => {
    setStep(1);
    setLocalError("");
    clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    return submitSignupRequest("LOCAL");
  };

  const submitSignupRequest = async (authProvider) => {
    if (!validateStepTwo()) {
      return;
    }

    try {
      const response = await register({
        fullName: formState.fullName,
        email: normalizedEmail,
        password: formState.password,
        campusId: formState.campusId,
        phoneNumber: formState.phoneNumber,
        department: formState.department,
        reasonForAccess: formState.reasonForAccess,
        authProvider,
        preferredTwoFactorMethod: formState.preferredTwoFactorMethod,
      });

      if (response?.authStatus === "PENDING_APPROVAL") {
        navigate("/approval-pending", { replace: true });
      }
    } catch (submitError) {
      return submitError;
    }
  };

  const handleGoogleSignup = async () => {
    setLocalError("");
    clearError();

    if (!validateStepOne()) {
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    return submitSignupRequest("GOOGLE");
  };

  const handleAppleSignup = () => {
    setLocalError("");
    clearError();

    if (!validateStepOne()) {
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setLocalError("Apple sign-up is not configured in this build yet.");
  };

  return (
    <section className="auth-screen auth-screen-centered">
      <div className="auth-card-wrap auth-card-wrap-centered">
        <Card className="auth-card glass-card">
          <div className="auth-heading">
            <h1 className="auth-title">Sign Up</h1>
            <p className="auth-subtitle">
              Submit your account request in two steps. An administrator must approve
              the request and assign your role before sign in is enabled.
            </p>
          </div>

          <div className="auth-progress">
            <span className={`auth-progress-step ${step === 1 ? "is-active" : ""}`.trim()}>
              1. Account
            </span>
            <span className={`auth-progress-step ${step === 2 ? "is-active" : ""}`.trim()}>
              2. Campus Profile
            </span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
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
                      name="fullName"
                      onChange={handleFieldChange}
                      placeholder="Your full name"
                      type="text"
                      value={formState.fullName}
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
              </>
            ) : (
              <>
                <label className="field field-annotated">
                  <span>Campus ID</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="campusId"
                      onChange={handleFieldChange}
                      placeholder="IT23123456 / EMP-109"
                      type="text"
                      value={formState.campusId}
                    />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Phone number</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="phoneNumber"
                      onChange={handleFieldChange}
                      placeholder="+94 77 123 4567"
                      type="text"
                      value={formState.phoneNumber}
                    />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Department / Faculty</span>
                  <div className="input-shell">
                    <input
                      className="login-input"
                      name="department"
                      onChange={handleFieldChange}
                      placeholder="Computing / Facilities / Administration"
                      type="text"
                      value={formState.department}
                    />
                  </div>
                </label>

                <label className="field field-annotated">
                  <span>Reason for access</span>
                  <textarea
                    className="auth-textarea"
                    name="reasonForAccess"
                    onChange={handleFieldChange}
                    placeholder="Explain why you need Smart Campus Operations Hub access."
                    rows="4"
                    value={formState.reasonForAccess}
                  />
                </label>

                <div className="field field-annotated">
                  <span>Preferred 2-step verification method</span>
                  <div className="auth-method-grid">
                    <label className="auth-method-option">
                      <input
                        checked={formState.preferredTwoFactorMethod === "EMAIL_OTP"}
                        name="preferredTwoFactorMethod"
                        onChange={handleFieldChange}
                        type="radio"
                        value="EMAIL_OTP"
                      />
                      <span>Email verification</span>
                      <small>Receive a one-time code during local sign in.</small>
                    </label>
                    <label className="auth-method-option">
                      <input
                        checked={
                          formState.preferredTwoFactorMethod === "AUTHENTICATOR_APP"
                        }
                        name="preferredTwoFactorMethod"
                        onChange={handleFieldChange}
                        type="radio"
                        value="AUTHENTICATOR_APP"
                      />
                      <span>Google Authenticator</span>
                      <small>Use an authenticator app after local sign in.</small>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeError ? <p className="alert alert-error">{activeError}</p> : null}

            {step === 1 ? (
              <Button className="login-submit" onClick={handleNextStep} type="button" variant="primary">
                Continue
              </Button>
            ) : (
              <div className="auth-actions-row">
                <Button onClick={handleBack} type="button" variant="secondary">
                  Back
                </Button>
                <Button className="login-submit" disabled={isLoading} type="submit" variant="primary">
                  Submit Approval Request
                </Button>
              </div>
            )}
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth-grid">
            <button
              className="social-button"
              disabled={isLoading}
              onClick={handleGoogleSignup}
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
              className="social-button social-button-apple"
              disabled={isLoading}
              onClick={handleAppleSignup}
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
              <span className="social-button-label">Sign up with Apple</span>
            </button>
          </div>

          <p className="login-demo-note">
            Admin will review your request, assign the correct role, and approve the
            account before login is enabled. Google sign-up still follows the same
            approval flow.
          </p>

          <p className="auth-switch-copy">
            Already have an account?{" "}
            <Link className="text-link" to="/login">
              Login
            </Link>
          </p>

          {isLoading ? <LoadingSpinner label="Submitting your request..." /> : null}
        </Card>
      </div>
    </section>
  );
}

export default SignupPage;
