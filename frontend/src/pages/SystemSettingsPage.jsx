import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import Button from "../components/Button";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import { useAuth } from "../hooks/useAuth";
import * as accountService from "../services/accountService";

const METHODS = [
  { value: "EMAIL_OTP", label: "Email verification code" },
  { value: "AUTHENTICATOR_APP", label: "Authenticator app (TOTP)" },
];

function SystemSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const data = await accountService.getSecuritySettings();
      setSettings(data);
    } catch (e) {
      setLoadError(e.message || "Unable to load settings.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!settings?.qrCodeUri) {
        setQrDataUrl("");
        return;
      }
      try {
        const url = await QRCode.toDataURL(settings.qrCodeUri, { margin: 1, width: 176 });
        if (!cancelled) {
          setQrDataUrl(url);
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings?.qrCodeUri]);

  const twoFactorOn = Boolean(settings?.twoFactorEnabled);
  const method = settings?.preferredTwoFactorMethod || "EMAIL_OTP";

  const handleSaveNotifications = async () => {
    if (!settings) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const next = await accountService.updateSecuritySettings({
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        appNotificationsEnabled: settings.appNotificationsEnabled,
      });
      setSettings((prev) => ({ ...prev, ...next }));
    } catch (e) {
      setSaveError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTwoFactor = async (enabled) => {
    if (!settings) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (!enabled) {
        const next = await accountService.updateSecuritySettings({ twoFactorEnabled: false });
        setSettings((prev) => ({ ...prev, ...next }));
        setVerifyCode("");
        return;
      }
      if (method === "EMAIL_OTP") {
        const next = await accountService.updateSecuritySettings({
          twoFactorEnabled: true,
          preferredTwoFactorMethod: "EMAIL_OTP",
        });
        setSettings((prev) => ({ ...prev, ...next }));
        return;
      }
      if (settings.authenticatorConfigured) {
        const next = await accountService.updateSecuritySettings({
          twoFactorEnabled: true,
          preferredTwoFactorMethod: "AUTHENTICATOR_APP",
        });
        setSettings((prev) => ({ ...prev, ...next }));
        return;
      }
      setSaveError("Generate a new authenticator key and verify a code before turning on 2-step verification.");
    } catch (e) {
      setSaveError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleMethodChange = async (nextMethod) => {
    if (!settings) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const next = await accountService.updateSecuritySettings({
        preferredTwoFactorMethod: nextMethod,
      });
      setSettings((prev) => ({ ...prev, ...next }));
      setVerifyCode("");
    } catch (e) {
      setSaveError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartAuthenticator = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await accountService.startAuthenticatorEnrollment();
      await load();
    } catch (e) {
      setSaveError(e.message || "Could not start authenticator setup.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!verifyCode.trim()) {
      setSaveError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const next = await accountService.verifyAuthenticatorEnrollment(verifyCode.trim());
      setSettings(next);
      setVerifyCode("");
    } catch (e) {
      setSaveError(e.message || "Verification failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetAuthenticator = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const next = await accountService.resetAuthenticator();
      setSettings(next);
      setVerifyCode("");
    } catch (e) {
      setSaveError(e.message || "Reset failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button className="mt-4" onClick={load} type="button" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-text/72">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <AdminPageHeader
        description="Manage optional 2-step verification and how Smart Campus reaches you."
        title="System settings"
      />

      {saveError ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{saveError}</p> : null}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <h2 className="text-base font-semibold text-heading">2-step verification</h2>
        <p className="mt-2 text-sm text-text/72">
          Optional. When enabled, sign-in requires your email code or authenticator app according to your selection.
        </p>

        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            checked={twoFactorOn}
            disabled={saving}
            onChange={(e) => handleToggleTwoFactor(e.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-medium text-text">Enable 2-step verification</span>
        </label>

        <div className="mt-6 space-y-3">
          <span className="text-sm font-medium text-text">Method</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            {METHODS.map((m) => (
              <label key={m.value} className="flex items-center gap-2 text-sm">
                <input
                  checked={method === m.value}
                  disabled={saving}
                  name="twofa-method"
                  onChange={() => handleMethodChange(m.value)}
                  type="radio"
                  value={m.value}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {method === "EMAIL_OTP" ? (
          <p className="mt-4 text-sm text-text/72">
            At sign-in, Smart Campus will email a one-time code to {user?.email || "your campus email"}.
          </p>
        ) : null}

        {method === "AUTHENTICATOR_APP" ? (
          <div className="mt-4 space-y-4">
            {settings.authenticatorConfigured ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                Authenticator app is configured. Use the code from your app when signing in.
              </div>
            ) : null}

            {settings.pendingAuthenticatorEnrollment ? (
              <div className="rounded-2xl border border-border bg-tint/40 p-4">
                <p className="text-sm font-medium text-heading">Finish linking your app</p>
                {qrDataUrl ? (
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img alt="Authenticator QR" className="h-44 w-44 rounded-lg border border-border bg-white p-2" src={qrDataUrl} />
                    <div className="min-w-0 flex-1 text-sm text-text/80">
                      <p>Scan with Google Authenticator or a compatible app, or add the manual key.</p>
                      {settings.manualEntryKey ? (
                        <code className="mt-2 block break-all rounded bg-bg px-2 py-1 text-xs">{settings.manualEntryKey}</code>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <label className="mt-4 block text-sm">
                  <span className="font-medium text-text">Verification code</span>
                  <input
                    className="mt-1 w-full max-w-xs rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="6-digit code"
                    type="text"
                    value={verifyCode}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button disabled={saving} onClick={handleVerifyAuthenticator} type="button" variant="primary">
                    Complete setup
                  </Button>
                </div>
              </div>
            ) : (
              <Button disabled={saving} onClick={handleStartAuthenticator} type="button" variant="secondary">
                Generate QR &amp; setup key
              </Button>
            )}

            {settings.authenticatorConfigured ? (
              <Button disabled={saving} onClick={handleResetAuthenticator} type="button" variant="secondary">
                Reset / reconfigure authenticator
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <h2 className="text-base font-semibold text-heading">Notification settings</h2>
        <p className="mt-2 text-sm text-text/72">Control channels independently. You can enable one, both, or neither.</p>

        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            checked={settings.emailNotificationsEnabled}
            disabled={saving}
            onChange={(e) => setSettings((s) => ({ ...s, emailNotificationsEnabled: e.target.checked }))}
            type="checkbox"
          />
          <span className="text-sm">Email notifications</span>
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            checked={settings.appNotificationsEnabled}
            disabled={saving}
            onChange={(e) => setSettings((s) => ({ ...s, appNotificationsEnabled: e.target.checked }))}
            type="checkbox"
          />
          <span className="text-sm">In-app notifications</span>
        </label>

        <div className="mt-6">
          <Button disabled={saving} onClick={handleSaveNotifications} type="button" variant="primary">
            {saving ? "Saving…" : "Save notification preferences"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SystemSettingsPage;
