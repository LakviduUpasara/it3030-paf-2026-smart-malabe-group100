import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import Button from "../../components/Button";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { PORTAL_DATA_KEYS } from "../../constants/portalDataKeys";
import { STREAM_OPTIONS, TERM_OPTIONS } from "../../constants/termStreamOptions";
import { useAdminShell } from "../../context/AdminShellContext";
import { useAuth } from "../../hooks/useAuth";
import {
  buildNotificationAudience,
  channelIncludesWeb,
  rebuildFeedFromAnnouncements,
  resolveNotificationsForUser,
} from "../../models/notification-center";
import { mergeReadIds } from "../../utils/notificationReadState";
import * as facultyService from "../../services/facultyService";
import * as degreeService from "../../services/lmsDegreeProgramService";
import * as intakeService from "../../services/intakeService";
import * as notificationAudienceService from "../../services/notificationAudienceService";
import * as portalDataService from "../../services/portalDataService";
import * as registrationService from "../../services/registrationService";

const PRIMARY = "#034AA6";
const AUDIENCE_TYPES = ["All", "Role", "Faculty", "Semester", "Degree Program"];
/** Web = in-app notification center; legacy rows may store "In-app". */
const CHANNEL_OPTIONS = [
  { value: "Web", label: "Web" },
  { value: "Email", label: "Email" },
  { value: "Both", label: "Both" },
];

function normalizeChannelForForm(stored) {
  const c = String(stored || "").trim();
  if (!c) return "Web";
  if (c === "In-app") return "Web";
  return c;
}
const PRIORITIES = ["Normal", "High"];
const STATUSES = ["Draft", "Scheduled", "Sent"];

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `ann-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyTargeting() {
  return {
    facultyCodes: [],
    degreeCodes: [],
    semesterCodes: [],
    intakeIds: [],
    streamCodes: [],
    subgroupCodes: [],
  };
}

function AdminNotificationsPage() {
  const location = useLocation();
  const isAnnouncementsRoute = location.pathname.includes("/communication/announcements");
  const pageTitle = isAnnouncementsRoute ? "Announcements" : "Targeted notifications";
  const pageDescription = isAnnouncementsRoute
    ? "Review sent broadcasts. Use Add to open a simple subject and message form—Send delivers to every user’s dashboard and email (where configured)."
    : "Choose an audience, channel, and priority. Add opens the same inline flow as other admin lists (for example, student registration).";

  const { setActiveWindow } = useAdminShell();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "ADMIN";

  const [tab, setTab] = useState("sent");
  const [announcements, setAnnouncements] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAudience, setFilterAudience] = useState("");

  /** list | add | edit — same pattern as Students admin (inline form, no modal). */
  const [viewMode, setViewMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    audienceType: "All",
    audienceLabel: "All users",
    channel: "Web",
    priority: "Normal",
    status: "Draft",
    deliveryAt: "",
    targeting: emptyTargeting(),
  });

  const [faculties, setFaculties] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [roleFaculty, setRoleFaculty] = useState("");
  const [roleDegree, setRoleDegree] = useState("");

  const simpleAnnouncementMode = useMemo(
    () =>
      isAnnouncementsRoute &&
      (viewMode === "add" || (viewMode === "edit" && editing?.audienceType === "All")),
    [isAnnouncementsRoute, viewMode, editing?.audienceType],
  );

  useEffect(() => {
    setActiveWindow("Notifications");
    return () => setActiveWindow("");
  }, [setActiveWindow]);

  useEffect(() => {
    setViewMode("list");
    setEditing(null);
  }, [tab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sent, box] = await Promise.all([
        portalDataService.loadPortalData(PORTAL_DATA_KEYS.adminSentAnnouncements),
        portalDataService.loadPortalData(PORTAL_DATA_KEYS.adminInboxNotifications),
      ]);
      const arr = Array.isArray(sent) ? sent : [];
      const inboxArr = Array.isArray(box) ? box : [];
      setAnnouncements(Array.isArray(arr) ? arr : []);
      setInbox(Array.isArray(inboxArr) ? inboxArr : []);
    } catch (e) {
      setError(e.message || "Failed to load data.");
      setAnnouncements([]);
      setInbox([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (loading || !user?.id) {
      return;
    }
    const feed = rebuildFeedFromAnnouncements(announcements);
    const viewer = { userId: user.id, appRole: user.role, role: user.role };
    const resolved = resolveNotificationsForUser(feed, viewer);
    const ids = resolved.map((x) => x.id).filter(Boolean);
    if (isSuperAdmin) {
      for (const n of inbox) {
        if (n?.id != null) {
          ids.push(`inbox-${n.id}`);
        }
      }
    }
    mergeReadIds(user.id, ids);
  }, [loading, user?.id, user?.role, announcements, inbox, isSuperAdmin]);

  useEffect(() => {
    facultyService.listFaculties().then(setFaculties).catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    if (!roleFaculty) {
      setDegrees([]);
      return;
    }
    degreeService
      .listDegreePrograms({ faculty: roleFaculty, status: "ACTIVE", page: 1, pageSize: 200 })
      .then((d) => setDegrees(d.items || []))
      .catch(() => setDegrees([]));
  }, [roleFaculty]);

  useEffect(() => {
    if (!roleFaculty || !roleDegree) {
      setIntakes([]);
      return;
    }
    intakeService
      .listIntakesPaged({
        page: 1,
        pageSize: 100,
        sort: "az",
        status: "ACTIVE",
        facultyCode: roleFaculty,
        degreeCode: roleDegree,
      })
      .then((d) => setIntakes(d.items || []))
      .catch(() => setIntakes([]));
  }, [roleFaculty, roleDegree]);

  useEffect(() => {
    const intakeId = form.targeting?.intakeIds?.[0];
    if (!intakeId || form.audienceType !== "Degree Program") {
      setSubgroups([]);
      return;
    }
    registrationService
      .listIntakeSubgroups(intakeId, { status: "ACTIVE" })
      .then((d) => setSubgroups(d.items || []))
      .catch(() => setSubgroups([]));
  }, [form.targeting?.intakeIds, form.audienceType]);

  const persistAnnouncements = async (next) => {
    await portalDataService.savePortalData(PORTAL_DATA_KEYS.adminSentAnnouncements, next);
    const feed = rebuildFeedFromAnnouncements(next);
    await portalDataService.savePortalData(PORTAL_DATA_KEYS.notificationFeed, feed);
    setAnnouncements(next);
  };

  const appendInbox = async (row) => {
    const next = [row, ...inbox];
    setInbox(next);
    await portalDataService.savePortalData(PORTAL_DATA_KEYS.adminInboxNotifications, next);
  };

  const openCreate = () => {
    setEditing(null);
    if (isAnnouncementsRoute) {
      setForm({
        title: "",
        message: "",
        audienceType: "All",
        audienceLabel: "All users",
        channel: "Both",
        priority: "Normal",
        status: "Draft",
        deliveryAt: "",
        targeting: emptyTargeting(),
      });
    } else {
      setForm({
        title: "",
        message: "",
        audienceType: "All",
        audienceLabel: "All users",
        channel: "Web",
        priority: "Normal",
        status: "Draft",
        deliveryAt: "",
        targeting: emptyTargeting(),
      });
    }
    setRoleFaculty("");
    setRoleDegree("");
    setViewMode("add");
    setActiveWindow("Create");
  };

  const openEdit = (row) => {
    setEditing(row);
    const audType = row.audienceType || "All";
    setForm({
      title: row.title,
      message: row.message,
      audienceType: audType,
      audienceLabel: audType === "All" ? row.audienceLabel || "All users" : row.audienceLabel || "",
      channel: normalizeChannelForForm(row.channel),
      priority: row.priority || "Normal",
      status: row.status || "Draft",
      deliveryAt: row.deliveryAt || "",
      targeting: { ...emptyTargeting(), ...(row.targeting || {}) },
    });
    setRoleFaculty(row.targeting?.facultyCodes?.[0] || "");
    setRoleDegree(row.targeting?.degreeCodes?.[0] || "");
    setViewMode("edit");
    setActiveWindow("Edit");
  };

  const cancelForm = () => {
    setViewMode("list");
    setEditing(null);
    setActiveWindow(tab === "sent" ? "List" : "Inbox");
  };

  const saveDraft = async () => {
    if (simpleAnnouncementMode) {
      return;
    }
    setSubmitting(true);
    try {
      const row = {
        id: editing?.id || uid(),
        title: form.title,
        message: form.message,
        audienceType: form.audienceType,
        audienceLabel: form.audienceLabel,
        channel: form.channel,
        priority: form.priority,
        status: form.status,
        deliveryAt: form.deliveryAt || null,
        targeting: form.targeting,
        tracking: editing?.tracking,
      };
      const next = editing
        ? announcements.map((a) => (a.id === editing.id ? row : a))
        : [...announcements, row];
      await persistAnnouncements(next);
      cancelForm();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendNow = async () => {
    setSubmitting(true);
    setError("");
    try {
      const broadcastSimple =
        isAnnouncementsRoute &&
        (viewMode === "add" || (viewMode === "edit" && editing?.audienceType === "All"));
      const sendForm = broadcastSimple
        ? {
            ...form,
            audienceType: "All",
            audienceLabel: "All users",
            channel: "Both",
            targeting: emptyTargeting(),
          }
        : form;

      const aud = buildNotificationAudience({
        ...sendForm,
        id: editing?.id || uid(),
        audienceType: sendForm.audienceType,
        audienceLabel: sendForm.audienceLabel,
        targeting: sendForm.targeting,
      });
      const resolved = await notificationAudienceService.resolveNotificationAudience(aud);
      const recipients = resolved.recipients || [];
      const ids = recipients.map((r) => r.userId).filter(Boolean);
      const emails = recipients.map((r) => r.primaryEmail).filter(Boolean);

      const webChannel =
        sendForm.channel === "Web" || sendForm.channel === "Both" || sendForm.channel === "In-app";
      const emailChannel = sendForm.channel === "Email" || sendForm.channel === "Both";

      if (emailChannel && isSuperAdmin) {
        await notificationAudienceService.sendNotificationEmails({
          toEmails: emails,
          subject: sendForm.title,
          htmlBody: `<p>${(sendForm.message || "").replace(/\n/g, "<br/>")}</p>`,
        });
      }

      const row = {
        id: editing?.id || uid(),
        title: sendForm.title,
        message: sendForm.message,
        audienceType: sendForm.audienceType,
        audienceLabel: sendForm.audienceLabel,
        channel: sendForm.channel,
        priority: sendForm.priority,
        status: "Sent",
        publishedAt: new Date().toISOString(),
        deliveryAt: null,
        targeting: sendForm.targeting,
        tracking: {
          resolvedRecipientUserIds: ids,
          recipientUserIds: ids,
          webCount: webChannel ? ids.length : 0,
          emailCount: emailChannel ? emails.length : 0,
        },
      };

      const next = editing
        ? announcements.map((a) => (a.id === editing.id ? row : a))
        : [...announcements, row];
      await persistAnnouncements(next);

      await appendInbox({
        id: uid(),
        type: "Delivery",
        title: `Sent: ${sendForm.title}`,
        message: `Recipients: ${ids.length}. Email: ${emailChannel ? emails.length : 0} (super admin only).`,
        time: new Date().toISOString(),
      });

      cancelForm();
    } catch (e) {
      setError(e.message || "Send failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this announcement?")) return;
    const next = announcements.filter((a) => a.id !== row.id);
    await persistAnnouncements(next);
  };

  const duplicate = (row) => {
    setEditing(null);
    const audType = row.audienceType || "All";
    if (isAnnouncementsRoute) {
      setForm({
        title: `${row.title} (copy)`,
        message: row.message,
        audienceType: "All",
        audienceLabel: "All users",
        channel: "Both",
        priority: row.priority || "Normal",
        status: "Draft",
        deliveryAt: "",
        targeting: emptyTargeting(),
      });
      setRoleFaculty("");
      setRoleDegree("");
    } else {
      setForm({
        title: `${row.title} (copy)`,
        message: row.message,
        audienceType: audType,
        audienceLabel: audType === "All" ? row.audienceLabel || "All users" : row.audienceLabel || "",
        channel: normalizeChannelForForm(row.channel),
        priority: row.priority,
        status: "Draft",
        deliveryAt: "",
        targeting: { ...emptyTargeting(), ...(row.targeting || {}) },
      });
      setRoleFaculty(row.targeting?.facultyCodes?.[0] || "");
      setRoleDegree(row.targeting?.degreeCodes?.[0] || "");
    }
    setViewMode("add");
    setActiveWindow("Create");
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return announcements.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterAudience && a.audienceType !== filterAudience) return false;
      if (!s) return true;
      return (
        (a.title && a.title.toLowerCase().includes(s)) || (a.message && a.message.toLowerCase().includes(s))
      );
    });
  }, [announcements, search, filterStatus, filterAudience]);

  const sentCount = announcements.filter((a) => a.status === "Sent").length;
  const inboxCount = inbox.length;

  const addButtonLabel = isAnnouncementsRoute ? "Add announcement" : "Add notification";

  return (
    <>
      <AdminPageHeader
        actions={
          viewMode === "list" ? (
            <Button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium text-white shadow"
              style={{ backgroundColor: PRIMARY }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {addButtonLabel}
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="inline-flex items-center gap-2" onClick={cancelForm}>
              Cancel
            </Button>
          )
        }
        description={pageDescription}
        title={pageTitle}
      />

      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-900 dark:text-rose-100">
          {error}
        </p>
      ) : null}

      {viewMode !== "list" && simpleAnnouncementMode ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editing ? "Edit announcement" : "New announcement"}
          </h2>
          <p className="mt-1 text-xs text-text/65">
            Sends to every active user: in-app notification feed and email (when SMTP is configured and you are a
            super administrator).
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Subject *</span>
              <input
                className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-text/70">Message *</span>
              <textarea
                rows={6}
                className="min-h-[120px] rounded-2xl border border-border bg-card px-3 py-2 text-sm"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </label>
          </div>
          {!isSuperAdmin ? (
            <p className="mt-3 text-xs text-text/60">Email delivery is only available to super administrators.</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              className="inline-flex items-center gap-2"
              disabled={submitting || !form.title?.trim()}
              onClick={sendNow}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Send to all users
            </Button>
            <Button type="button" variant="secondary" onClick={cancelForm}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {viewMode !== "list" && !simpleAnnouncementMode ? (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text/60">
            {editing ? "Edit" : "New"}{" "}
            {isAnnouncementsRoute ? "targeted announcement" : "notification"}
          </h2>
          <p className="mt-1 text-xs text-text/65">
            Choose audience, channel, and optional schedule. Send now delivers to the resolved users.
          </p>
          <div className="mt-4 space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-text/60">Subject</span>
            <input
              className="rounded-2xl border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#034AA6]/40"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-text/60">Message</span>
            <textarea
              rows={5}
              className="rounded-2xl border border-black/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#034AA6]/40"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-text/60">Audience</span>
            <select
              className="rounded-2xl border border-black/15 px-3 py-2"
              value={form.audienceType}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  audienceType: v,
                  audienceLabel: v === "All" ? "All users" : "",
                  targeting: v === "All" ? emptyTargeting() : f.targeting,
                }));
                if (v !== "Degree Program") {
                  setRoleFaculty("");
                  setRoleDegree("");
                }
              }}
            >
              {AUDIENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All users" : t}
                </option>
              ))}
            </select>
          </label>
          {form.audienceType === "All" ? (
            <p className="rounded-2xl border border-border bg-tint px-3 py-2 text-xs text-text/72">
              <strong>All users:</strong> every active account that matches the resolver (including students without a
              cohort row when no faculty or degree filters apply) can receive this. Choose <strong>Web</strong> for the
              in-app feed, <strong>Email</strong> for mail (super admin only), or <strong>Both</strong>.
            </p>
          ) : null}
          {form.audienceType === "Role" ? (
            <input
              className="rounded-2xl border border-black/15 px-3 py-2"
              placeholder="Roles (comma-separated): STUDENT, LECTURER"
              value={form.audienceLabel}
              onChange={(e) => setForm((f) => ({ ...f, audienceLabel: e.target.value }))}
            />
          ) : null}
          {form.audienceType === "Faculty" ? (
            <select
              multiple
              className="h-28 rounded-2xl border border-black/15 px-3 py-2"
              value={form.targeting.facultyCodes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targeting: {
                    ...f.targeting,
                    facultyCodes: Array.from(e.target.selectedOptions).map((o) => o.value),
                  },
                }))
              }
            >
              {faculties.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          ) : null}
          {form.audienceType === "Semester" ? (
            <select
              multiple
              className="h-28 rounded-2xl border border-black/15 px-3 py-2"
              value={form.targeting.semesterCodes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  targeting: {
                    ...f.targeting,
                    semesterCodes: Array.from(e.target.selectedOptions).map((o) => o.value),
                  },
                }))
              }
            >
              {TERM_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : null}
          {form.audienceType === "Degree Program" ? (
            <div className="space-y-2 rounded-2xl border border-black/10 p-3">
              <select
                className="w-full rounded-xl border border-black/15 px-2 py-2"
                value={roleFaculty}
                onChange={(e) => {
                  setRoleFaculty(e.target.value);
                  setRoleDegree("");
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...emptyTargeting(),
                      facultyCodes: e.target.value ? [e.target.value] : [],
                    },
                  }));
                }}
              >
                <option value="">Faculty</option>
                {faculties.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-black/15 px-2 py-2"
                value={roleDegree}
                onChange={(e) => {
                  setRoleDegree(e.target.value);
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      degreeCodes: e.target.value ? [e.target.value] : [],
                    },
                  }));
                }}
              >
                <option value="">Degree</option>
                {degrees.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
              <select
                multiple
                className="h-20 w-full rounded-xl border border-black/15 px-2 py-2"
                value={form.targeting.semesterCodes || []}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      semesterCodes: Array.from(e.target.selectedOptions).map((o) => o.value),
                    },
                  }))
                }
              >
                {TERM_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                multiple
                className="h-24 w-full rounded-xl border border-black/15 px-2 py-2"
                value={form.targeting.intakeIds}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      intakeIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                    },
                  }))
                }
              >
                {intakes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name || i.id}
                  </option>
                ))}
              </select>
              <select
                multiple
                className="h-20 w-full rounded-xl border border-black/15 px-2 py-2"
                value={form.targeting.streamCodes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      streamCodes: Array.from(e.target.selectedOptions).map((o) => o.value),
                    },
                  }))
                }
              >
                {STREAM_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select
                multiple
                className="h-24 w-full rounded-xl border border-black/15 px-2 py-2"
                value={form.targeting.subgroupCodes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targeting: {
                      ...f.targeting,
                      subgroupCodes: Array.from(e.target.selectedOptions).map((o) => o.value),
                    },
                  }))
                }
              >
                {subgroups.map((g) => (
                  <option key={g.code || g.subgroup} value={g.code || g.subgroup}>
                    {g.code || g.subgroup} ({g.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-text/60">Channel</span>
              <select
                className="rounded-2xl border border-black/15 px-2 py-2"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              >
                {CHANNEL_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase text-text/60">Priority</span>
              <select
                className="rounded-2xl border border-black/15 px-2 py-2"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-text/60">Schedule (optional)</span>
            <input
              type="datetime-local"
              className="rounded-2xl border border-black/15 px-3 py-2"
              value={form.deliveryAt}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAt: e.target.value, status: "Scheduled" }))}
            />
          </label>

          <p className="text-xs text-text/60">
            Email delivery requires SMTP and super admin. Audience resolution uses POST /api/v1/notifications/audience.
          </p>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={cancelForm}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={saveDraft} disabled={submitting}>
              Save draft
            </Button>
            <Button
              type="button"
              onClick={sendNow}
              disabled={submitting || !form.title?.trim()}
              className="rounded-2xl px-4 py-2 text-white"
              style={{ backgroundColor: PRIMARY }}
            >
              Send now
            </Button>
          </div>
          </div>
        </section>
      ) : null}

      {viewMode === "list" ? (
        <>
      <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-black/15 bg-[#D9D9D9]/30 p-1">
        <button
          type="button"
          onClick={() => {
            setTab("sent");
            setActiveWindow("List");
          }}
          className={`flex-1 rounded-3xl px-4 py-2 text-sm font-medium ${
            tab === "sent" ? "bg-white shadow text-heading" : "text-text/70"
          }`}
        >
          Sent announcements ({sentCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("inbox");
            setActiveWindow("Inbox");
          }}
          className={`flex-1 rounded-3xl px-4 py-2 text-sm font-medium ${
            tab === "inbox" ? "bg-white shadow text-heading" : "text-text/70"
          }`}
        >
          Received ({inboxCount})
        </button>
      </div>

      {tab === "sent" ? (
        <div className="rounded-3xl border border-black/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-surface">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              className="min-w-[200px] flex-1 rounded-3xl border border-black/15 bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#034AA6]/40"
              placeholder="Search title or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-3xl border border-black/15 bg-background px-3 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="rounded-3xl border border-black/15 bg-background px-3 py-2"
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
            >
              <option value="">All audiences</option>
              {AUDIENCE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <p className="text-text/60">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-text/60">
                    <th className="pb-2 pr-3">Subject</th>
                    <th className="pb-2 pr-3">Audience</th>
                    <th className="pb-2 pr-3">Channel</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Priority</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-black/5">
                      <td className="py-3 pr-3 font-medium">{a.title}</td>
                      <td className="py-3 pr-3 text-text/80">{a.audienceType}</td>
                      <td className="py-3 pr-3">{a.channel}</td>
                      <td className="py-3 pr-3">{a.status}</td>
                      <td className="py-3 pr-3">{a.priority}</td>
                      <td className="py-3 text-right">
                        <button type="button" className="mr-2 text-[#034AA6]" onClick={() => openEdit(a)}>
                          Edit
                        </button>
                        <button type="button" className="mr-2 text-text/70" onClick={() => duplicate(a)}>
                          Duplicate
                        </button>
                        <button type="button" className="text-rose-600" onClick={() => remove(a)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length ? <p className="py-6 text-center text-text/60">No announcements yet.</p> : null}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-black/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-surface">
          <ul className="space-y-3">
            {inbox.map((n) => (
              <li key={n.id} className="rounded-2xl border border-black/10 p-4">
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-text/80">{n.message}</p>
                <p className="mt-2 text-xs text-text/50">{n.time}</p>
              </li>
            ))}
            {!inbox.length ? <p className="text-text/60">No inbox items.</p> : null}
          </ul>
        </div>
      )}
        </>
      ) : null}
    </>
  );
}

export default AdminNotificationsPage;
