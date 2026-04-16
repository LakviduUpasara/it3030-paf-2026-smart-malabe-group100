import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import NotificationCenter from "../components/notifications/NotificationCenter";
import LoadingSpinner from "../components/LoadingSpinner";
import { PORTAL_DATA_KEYS } from "../constants/portalDataKeys";
import { useAuth } from "../hooks/useAuth";
import { resolveNotificationsForUser } from "../models/notification-center";
import { getNotifications } from "../services/notificationService";
import * as portalDataService from "../services/portalDataService";

function NotificationsPage() {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [legacy, setLegacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [feedRaw, legacyData] = await Promise.all([
          portalDataService.loadPortalData(PORTAL_DATA_KEYS.notificationFeed).catch(() => []),
          getNotifications().catch(() => []),
        ]);
        const feed = Array.isArray(feedRaw) ? feedRaw : [];
        if (active) {
          setFeedItems(feed);
          setLegacy(Array.isArray(legacyData) ? legacyData : []);
        }
      } catch (e) {
        if (active) setError(e.message || "Failed to load notifications.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const viewer = useMemo(
    () => ({
      userId: user?.id,
      appRole: user?.role,
      role: user?.role,
    }),
    [user],
  );

  const resolved = useMemo(
    () => resolveNotificationsForUser(feedItems, viewer),
    [feedItems, viewer],
  );

  const displayed = useMemo(() => {
    const merged = [
      ...resolved.map((n) => ({ ...n, source: "feed" })),
      ...legacy.map((n) => ({ ...n, source: "legacy", type: "System" })),
    ];
    if (tab === "announcements") {
      return merged.filter((n) => n.type === "Announcement" || n.source === "legacy");
    }
    if (tab === "system") {
      return merged.filter((n) => n.type === "System" || n.source === "legacy");
    }
    return merged;
  }, [resolved, legacy, tab]);

  if (loading) {
    return <LoadingSpinner label="Loading notifications..." />;
  }

  return (
    <Card title="Notifications" subtitle="Announcements and operational updates">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "announcements", "system"].map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              tab === t ? "bg-tint font-medium" : "text-text/70"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <NotificationCenter items={displayed} emptyLabel="No notifications to show." />
    </Card>
  );
}

export default NotificationsPage;
