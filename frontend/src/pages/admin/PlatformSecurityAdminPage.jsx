import { useCallback, useEffect, useState } from "react";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import * as platformSecurityService from "../../services/platformSecurityService";

function ToggleRow({ checked, disabled, label, description, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 rounded border-border"
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
      <div>
        <div className="font-medium text-text">{label}</div>
        <p className="mt-1 text-sm text-text/72">{description}</p>
      </div>
    </label>
  );
}

function PlatformSecurityAdminPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await platformSecurityService.getPlatformSecuritySettings();
      setSettings(data);
    } catch (e) {
      setError(e.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (key, value) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess("");
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await platformSecurityService.updatePlatformSecuritySettings({
        forceTwoFactorForAllUsers: settings.forceTwoFactorForAllUsers,
        treatLegacyUnknownTwoFactorAsOptional: settings.treatLegacyUnknownTwoFactorAsOptional,
        requirePasswordChangeOnFirstLoginForLocalUsers: settings.requirePasswordChangeOnFirstLoginForLocalUsers,
        newUsersMustEnableTwoFactor: settings.newUsersMustEnableTwoFactor,
        allowSkippingFirstLoginTwoFactorSetup: settings.allowSkippingFirstLoginTwoFactorSetup,
      });
      setSettings(data);
      setSuccess("Platform security policy saved.");
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-6">
        <p className="text-sm text-text/72">{loading ? "Loading platform security…" : "No data."}</p>
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        description="MongoDB-backed defaults for first-login password change, optional 2FA, and sign-in enforcement. Applies to newly created accounts and runtime login checks."
        title="Platform security policy"
      />

      <section className="mx-auto max-w-3xl space-y-4 p-6">
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p>
        ) : null}

        <div className="space-y-3">
          <ToggleRow
            checked={settings.forceTwoFactorForAllUsers}
            description="Every successful password or Google sign-in must complete a second factor (email OTP or TOTP), even if a user has not enabled 2FA in their profile."
            disabled={saving}
            label="Require second factor for all users at sign-in"
            onChange={(v) => updateField("forceTwoFactorForAllUsers", v)}
          />
          <ToggleRow
            checked={settings.treatLegacyUnknownTwoFactorAsOptional}
            description="Accounts with an unset 2FA flag are treated as optional (no challenge) unless you force2FA above."
            disabled={saving}
            label="Treat legacy “unknown” 2FA state as optional"
            onChange={(v) => updateField("treatLegacyUnknownTwoFactorAsOptional", v)}
          />
          <ToggleRow
            checked={settings.requirePasswordChangeOnFirstLoginForLocalUsers}
            description="Applies to admin-created users, students, staff, technicians, and approved email/password signups."
            disabled={saving}
            label="Require password change on first sign-in (local accounts)"
            onChange={(v) => updateField("requirePasswordChangeOnFirstLoginForLocalUsers", v)}
          />
          <ToggleRow
            checked={settings.newUsersMustEnableTwoFactor}
            description="New accounts start with 2FA enabled and enter the first-login verification wizard after password change."
            disabled={saving}
            label="New users must enable 2-step verification (on by default)"
            onChange={(v) => {
              setSettings((prev) =>
                prev
                  ? {
                      ...prev,
                      newUsersMustEnableTwoFactor: v,
                      allowSkippingFirstLoginTwoFactorSetup: v ? false : prev.allowSkippingFirstLoginTwoFactorSetup,
                    }
                  : prev,
              );
              setSuccess("");
            }}
          />
          <ToggleRow
            checked={settings.allowSkippingFirstLoginTwoFactorSetup}
            description="When off, the first-login screen hides “Skip” and the API rejects skip requests."
            disabled={saving || settings.newUsersMustEnableTwoFactor}
            label="Allow skipping optional first-login 2FA setup"
            onChange={(v) => updateField("allowSkippingFirstLoginTwoFactorSetup", v)}
          />
        </div>

        {settings.updatedAt ? (
          <p className="text-xs text-text/56">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
            {settings.lastUpdatedByEmail ? ` · ${settings.lastUpdatedByEmail}` : ""}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button disabled={saving} onClick={handleSave} type="button" variant="primary">
            {saving ? "Saving…" : "Save policy"}
          </Button>
          <Button disabled={saving} onClick={load} type="button" variant="secondary">
            Reload
          </Button>
        </div>
      </section>
    </>
  );
}

export default PlatformSecurityAdminPage;
