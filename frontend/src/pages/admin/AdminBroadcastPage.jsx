import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Send, ShieldCheck } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import {
  getAdminHistory,
  getNotificationSettings,
  sendAdminBroadcast,
  updateNotificationSettings,
} from "../../services/notificationApi";

const ROLE_OPTIONS = [
  { id: "ADMIN", label: "Admins" },
  { id: "USER", label: "Users" },
  { id: "TECHNICIAN", label: "Technicians" },
];

const CHANNEL_OPTIONS = ["WEB", "EMAIL", "BOTH"];
const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH"];

function AdminBroadcastPage() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    audienceRoles: ["USER"],
    channel: "WEB",
    priority: "NORMAL",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const page = await getAdminHistory({ page: 0, size: 25 });
      setHistory(Array.isArray(page?.content) ? page.content : []);
    } catch (e) {
      setError(e.message || "Unable to load notification history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const s = await getNotificationSettings();
      setSettings(s);
    } catch (e) {
      setError(e.message || "Unable to load notification settings.");
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadSettings();
  }, [loadHistory, loadSettings]);

  const toggleRole = (roleId) => {
    setForm((prev) => {
      const isOn = prev.audienceRoles.includes(roleId);
      const next = isOn
        ? prev.audienceRoles.filter((r) => r !== roleId)
        : [...prev.audienceRoles, roleId];
      return { ...prev, audienceRoles: next };
    });
  };

  const canSubmit = useMemo(
    () =>
      form.title.trim().length > 0 &&
      form.message.trim().length > 0 &&
      form.audienceRoles.length > 0 &&
      !submitting,
    [form, submitting],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await sendAdminBroadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        audienceRoles: form.audienceRoles,
        channel: form.channel,
        priority: form.priority,
      });
      setNotice(`Delivered to ${res?.deliveredTo ?? 0} recipient(s).`);
      setForm((prev) => ({ ...prev, title: "", message: "" }));
      await loadHistory();
    } catch (e) {
      setError(e.message || "Unable to send notification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const updated = await updateNotificationSettings({ [key]: value });
      setSettings(updated);
    } catch (e) {
      setError(e.message || "Unable to update setting.");
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="New notification"
        description="Send targeted notifications to admins, users or technicians. All changes are audited."
      />

      {notice ? (
        <section className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </section>
      ) : null}

      {error ? (
        <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card subtitle="Compose" title="Manual broadcast">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-text">
              Subject
              <input
                className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                maxLength={150}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                type="text"
                value={form.title}
              />
            </label>

            <label className="block text-sm font-medium text-text">
              Message
              <textarea
                className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                maxLength={4000}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                required
                rows={5}
                value={form.message}
              />
            </label>

            <fieldset className="rounded-xl border border-border p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-text/60">
                Audience
              </legend>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const on = form.audienceRoles.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                        on ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-text"
                      }`}
                    >
                      <span>{role.label}</span>
                      <input
                        checked={on}
                        className="h-4 w-4 accent-primary"
                        onChange={() => toggleRole(role.id)}
                        type="checkbox"
                      />
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-text/60">Select any combination of the three role targets.</p>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-text">
                Channel
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                  onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
                  value={form.channel}
                >
                  {CHANNEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-text">
                Priority
                <select
                  className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  value={form.priority}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Button disabled={!canSubmit} type="submit" variant="primary">
              <Send className="mr-1.5 inline h-4 w-4" aria-hidden />
              {submitting ? "Sending…" : "Send notification"}
            </Button>
          </form>
        </Card>

        <Card subtitle="System notification settings" title="Delivery controls">
          {settings == null ? (
            <p className="text-sm text-text/60">Loading settings…</p>
          ) : (
            <div className="space-y-3">
              <SettingRow
                disabled={settingsSaving}
                icon={Send}
                label="Web (in-app) notifications"
                onChange={(v) => handleSettingChange("webEnabled", v)}
                value={settings.webEnabled}
              />
              <SettingRow
                disabled={settingsSaving}
                icon={Mail}
                label="Email notifications"
                onChange={(v) => handleSettingChange("emailEnabled", v)}
                value={settings.emailEnabled}
              />
              <SettingRow
                disabled={settingsSaving}
                icon={ShieldCheck}
                label="Browser push supported"
                onChange={(v) => handleSettingChange("browserPushSupported", v)}
                value={settings.browserPushSupported}
              />
              <hr className="border-border" />
              <p className="text-xs font-semibold uppercase tracking-wide text-text/60">
                Category toggles
              </p>
              <SettingRow
                disabled={settingsSaving}
                label="Booking notifications"
                onChange={(v) => handleSettingChange("bookingCategoryEnabled", v)}
                value={settings.bookingCategoryEnabled}
              />
              <SettingRow
                disabled={settingsSaving}
                label="Ticket notifications"
                onChange={(v) => handleSettingChange("ticketCategoryEnabled", v)}
                value={settings.ticketCategoryEnabled}
              />
              <SettingRow
                disabled={settingsSaving}
                label="Admin broadcast / system notifications"
                onChange={(v) => handleSettingChange("systemCategoryEnabled", v)}
                value={settings.systemCategoryEnabled}
              />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card subtitle="Audit log" title="Recent notifications">
          {historyLoading ? (
            <p className="text-sm text-text/60">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-text/60">No notifications have been sent yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-tint/80 text-left text-xs font-semibold uppercase tracking-wide text-text/60">
                  <tr>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Recipient role</th>
                    <th className="px-4 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {history.map((n) => (
                    <tr key={n.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-text/70">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs">{n.type}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium text-heading">{n.title}</p>
                        <p className="line-clamp-1 text-xs text-text/60">{n.message}</p>
                      </td>
                      <td className="px-4 py-2 text-xs">{n.recipientRole || "—"}</td>
                      <td className="px-4 py-2 text-xs">{n.priority || "NORMAL"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function SettingRow({ label, value, onChange, icon: Icon, disabled }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-tint/40 px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2 text-text">
        {Icon ? <Icon className="h-4 w-4 text-text/70" aria-hidden /> : null}
        {label}
      </span>
      <input
        checked={!!value}
        className="h-4 w-4 accent-primary"
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export default AdminBroadcastPage;
