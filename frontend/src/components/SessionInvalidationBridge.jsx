import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Listens for api.js dispatch when a stored session receives 401 on a protected endpoint (e.g. account deleted).
 */
function SessionInvalidationBridge() {
  const navigate = useNavigate();
  const { clearClientState } = useAuth();
  const clearRef = useRef(clearClientState);
  clearRef.current = clearClientState;

  useEffect(() => {
    const onInvalid = (e) => {
      clearRef.current();
      const msg = e.detail?.message || "Your account is no longer available. Please sign in again.";
      navigate(`/login?notice=${encodeURIComponent(msg)}`, { replace: true });
    };
    window.addEventListener("smart-campus:session-invalid", onInvalid);
    return () => window.removeEventListener("smart-campus:session-invalid", onInvalid);
  }, [navigate]);

  return null;
}

export default SessionInvalidationBridge;
