import { HiOutlineShieldExclamation } from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth";

/**
 * Shown after login when the user chose the authenticator app at first-login setup
 * but has not completed confirmation (sign-in currently uses email OTP fallback).
 */
function TwoFactorSetupReminder() {
  const { user, developerMode, isAuthenticated } = useAuth();

  if (!isAuthenticated || developerMode || !user?.pendingAuthenticatorSetup) {
    return null;
  }

  return (
    <div
      className="twofactor-reminder-banner"
      role="status"
      aria-live="polite"
    >
      <HiOutlineShieldExclamation className="twofactor-reminder-icon" aria-hidden />
      <div className="twofactor-reminder-copy">
        <p className="twofactor-reminder-title">Finish second-step verification</p>
        <p className="twofactor-reminder-text">
          Your authenticator app is not fully linked yet. You can still sign in using email one-time codes. On your
          next sign-in, complete the authenticator setup when prompted, or switch to email verification from the login
          setup screens until the app is confirmed.
        </p>
      </div>
    </div>
  );
}

export default TwoFactorSetupReminder;
