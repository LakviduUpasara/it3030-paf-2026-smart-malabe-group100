import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

/**
 * GIS must call `initialize` at most once per client_id. Re-initializing on every
 * prop change (e.g. disabled while logging in) can freeze or break the page.
 */
const gsi = {
  initializedClientId: null,
  dispatch: {
    onCredential: null,
    onError: null,
  },
};

function ensureGsiInitialized(clientId) {
  if (!window.google?.accounts?.id || !clientId) {
    return;
  }

  if (gsi.initializedClientId === clientId) {
    return;
  }

  gsi.initializedClientId = clientId;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response?.credential) {
        gsi.dispatch.onError?.("Google did not return a valid credential.");
        return;
      }
      gsi.dispatch.onCredential?.(response.credential);
    },
  });
}

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

function GoogleIdentityButton({
  buttonText = "continue_with",
  disabled = false,
  minWidth = 240,
  maxWidth = 396,
  onCredential,
  onError,
  size = "large",
  theme = "outline",
}) {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [statusMessage, setStatusMessage] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
    gsi.dispatch.onCredential = (credential) => onCredentialRef.current?.(credential);
    gsi.dispatch.onError = (message) => onErrorRef.current?.(message);
  }, [onCredential, onError]);

  useEffect(() => {
    let isActive = true;

    if (!clientId) {
      return undefined;
    }

    if (disabled) {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!isActive || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        setStatusMessage("");
        ensureGsiInitialized(clientId);

        const parentWidth = containerRef.current.parentElement?.clientWidth || 360;
        const buttonWidth = Math.max(minWidth, Math.min(parentWidth, maxWidth));

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme,
          size,
          shape: "pill",
          text: buttonText,
          logo_alignment: "left",
          width: buttonWidth,
        });
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setStatusMessage("Google sign-in could not be loaded.");
        onErrorRef.current?.("Google sign-in could not be loaded.");
      });

    return () => {
      isActive = false;
    };
  }, [buttonText, clientId, disabled, maxWidth, minWidth, size, theme]);

  if (!clientId) {
    return (
      <div className="google-identity-slot google-identity-slot-disabled">
        <button className="social-button" disabled type="button">
          <span className="social-button-label">Google sign-in requires `VITE_GOOGLE_CLIENT_ID`</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`google-identity-slot ${disabled ? "google-identity-slot-disabled" : ""}`.trim()}>
      {statusMessage ? <p className="alert alert-error">{statusMessage}</p> : null}
      <div className="google-identity-button-shell">
        <div ref={containerRef} className="google-identity-button" />
      </div>
    </div>
  );
}

export default GoogleIdentityButton;
