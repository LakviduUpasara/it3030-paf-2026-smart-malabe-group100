import { FaApple, FaChevronRight } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import Modal from "./Modal";

const PROVIDER_BRANDING = {
  GOOGLE: {
    label: "Google",
    title: "Sign in with Google",
    subtitle:
      "Choose a verified Google account. Smart Campus will bring back the profile automatically and open the remaining campus onboarding fields.",
    Icon: FcGoogle,
  },
  APPLE: {
    label: "Apple",
    title: "Continue with Apple",
    subtitle:
      "Choose a verified Apple account. Smart Campus will continue the campus onboarding flow with the provider profile already attached.",
    Icon: FaApple,
  },
};

function SocialAccountChooserModal({
  accounts,
  isOpen,
  onClose,
  onSelect,
  provider,
}) {
  const branding = PROVIDER_BRANDING[provider] || PROVIDER_BRANDING.GOOGLE;
  const ProviderIcon = branding.Icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="auth-modal-panel provider-chooser-modal"
      contentClassName="provider-chooser-content"
    >
      <div className="provider-chooser-header">
        <span className="provider-chooser-brandmark" aria-hidden="true">
          <ProviderIcon />
        </span>
        <div className="provider-chooser-copy">
          <h3>{branding.title}</h3>
          <p>{branding.subtitle}</p>
        </div>
      </div>

      <div className="provider-chooser-list" role="list">
        {accounts.map((account) => (
          <button
            key={account.id}
            className="provider-chooser-account"
            onClick={() => onSelect(account)}
            type="button"
          >
            <span className="provider-chooser-avatar" aria-hidden="true">
              {account.avatarLabel || account.fullName.charAt(0)}
            </span>
            <span className="provider-chooser-account-copy">
              <strong>{account.fullName}</strong>
              <span>{account.email}</span>
              {account.description ? (
                <small>{account.description}</small>
              ) : null}
            </span>
            <FaChevronRight className="provider-chooser-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="provider-chooser-footer">
        <p>
          After you pick an account, Smart Campus will ask for your requested campus role, then the campus profile
          details. Second-step verification (email code or authenticator app) is configured at first login after an
          administrator approves your request.
        </p>
        <button className="auth-link-button" onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export default SocialAccountChooserModal;
