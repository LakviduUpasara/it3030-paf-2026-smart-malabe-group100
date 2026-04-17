import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";

/**
 * Optional first Google sign-in: offer 2FA setup without blocking access.
 */
function GoogleTwoFactorPromptModal() {
  const navigate = useNavigate();
  const { dismissGoogleTwoFactorPrompt, isLoading, error, clearError } = useAuth();

  const handleSetup = () => {
    clearError();
    navigate("/settings/security");
  };

  const handleSkip = async () => {
    clearError();
    await dismissGoogleTwoFactorPrompt();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-2fa-prompt-title"
    >
      <div className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h2 id="google-2fa-prompt-title" className="text-lg font-semibold text-heading">
          Add 2-step verification?
        </h2>
        <p className="mt-3 text-sm text-text/80">
          You can secure your Smart Campus account with an authenticator app. This is optional — you can skip and set it up
          later under Administration → System Settings (or Account security).
        </p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button disabled={isLoading} onClick={handleSkip} type="button" variant="secondary">
            Skip for now
          </Button>
          <Button disabled={isLoading} onClick={handleSetup} type="button" variant="primary">
            Set up now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default GoogleTwoFactorPromptModal;
