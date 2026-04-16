import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { PORTAL_DATA_KEYS } from "../../constants/portalDataKeys";
import { STREAM_OPTIONS, TERM_OPTIONS } from "../../constants/termStreamOptions";
import { useAdminShell } from "../../context/AdminShellContext";
import { useAuth } from "../../hooks/useAuth";
import {
  buildNotificationAudience,
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
const CHANNELS = ["In-app", "Email", "Both"];
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    audienceType: "All",
    audienceLabel: "",
    channel: "In-app",
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

  useEffect(() => {
    setActiveWindow("Notifications");
    return () => setActiveWindow("");
  }, [setActiveWindow]);

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
    setForm({
      title: "",
      message: "",
      audienceType: "All",
      audienceLabel: "",
      channel: "In-app",
      priority: "Normal",
      status: "Draft",
      deliveryAt: "",
      targeting: emptyTargeting(),
    });
    setRoleFaculty("");
    setRoleDegree("");
    setModalOpen(true);
    setActiveWindow("Create");
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: row.title,
      message: row.message,
      audienceType: row.audienceType || "All",
      audienceLabel: row.audienceLabel || "",
      channel: row.channel || "In-app",
      priority: row.priority || "Normal",
      status: row.status || "Draft",
      deliveryAt: row.deliveryAt || "",
      targeting: { ...emptyTargeting(), ...(row.targeting || {}) },
    });
    setRoleFaculty(row.targeting?.facultyCodes?.[0] || "");
    setRoleDegree(row.targeting?.degreeCodes?.[0] || "");
    setModalOpen(true);
    setActiveWindow("Edit");
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setActiveWindow(tab === "sent" ? "List" : "Inbox");
  };

  const saveDraft = async () => {
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
      closeModal();
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
      const aud = buildNotificationAudience({
        ...form,
        id: editing?.id || uid(),
        audienceType: form.audienceType,
        audienceLabel: form.audienceLabel,
        targeting: form.targeting,
      });
      const resolved = await notificationAudienceService.resolveNotificationAudience(aud);
      const recipients = resolved.recipients || [];
      const ids = recipients.map((r) => r.userId).filter(Boolean);
      const emails = recipients.map((r) => r.primaryEmail).filter(Boolean);

      const webChannel = form.channel === "In-app" || form.channel === "Both";
      const emailChannel = form.channel === "Email" || form.channel === "Both";

      if (emailChannel && isSuperAdmin) {
        await notificationAudienceService.sendNotificationEmails({
          toEmails: emails,
          subject: form.title,
          htmlBody: `<p>${(form.message || "").replace(/\n/g, "<br/>")}</p>`,
        });
      }

      const row = {
        id: editing?.id || uid(),
        title: form.title,
        message: form.message,
        audienceType: form.audienceType,
        audienceLabel: form.audienceLabel,
        channel: form.channel,
        priority: form.priority,
        status: "Sent",
        publishedAt: new Date().toISOString(),
        deliveryAt: null,
        targeting: form.targeting,
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
        title: `Sent: ${form.title}`,
        message: `Recipients: ${ids.length}. Email: ${emailChannel ? emails.length : 0} (super admin only).`,
        time: new Date().toISOString(),
      });

      closeModal();
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
    setForm({
      title: `${row.title} (copy)`,
      message: row.message,
      audienceType: row.audienceType,
      audienceLabel: row.audienceLabel,
      channel: row.channel,
      priority: row.priority,
      status: "Draft",
      deliveryAt: "",
      targeting: { ...emptyTargeting(), ...(row.targeting || {}) },
    });
    setRoleFaculty(row.targeting?.facultyCodes?.[0] || "");
    setRoleDegree(row.targeting?.degreeCodes?.[0] || "");
    setModalOpen(true);
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-heading">Notifications</h1>
          <p className="mt-1 max-w-2xl text-sm text-text/72">
            Manage announcements and your delivery inbox. Targeted notifications use the same screen as this page.
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="rounded-3xl px-5 py-2.5 text-sm font-medium text-white shadow"
          style={{ backgroundColor: PRIMARY }}
        >
          New announcement
        </Button>
      </header>

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

      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-900 dark:text-rose-100">
          {error}
        </p>
      ) : null}

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
                    <th className="pb-2 pr-3">Title</th>
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit announcement" : "New announcement"}
        panelClassName="max-w-lg rounded-3xl border border-black/15 shadow-xl"
      >
        <div className="space-y-3 p-1">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-text/60">Title</span>
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
              onChange={(e) => setForm((f) => ({ ...f, audienceType: e.target.value }))}
            >
              {AUDIENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
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
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
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
      </Modal>
    </div>
  );
}

export default AdminNotificationsPage;
