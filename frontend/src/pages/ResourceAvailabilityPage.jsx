import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Notification from "../components/Notification";
import { checkResourceAvailability } from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { FiSearch, FiCalendar, FiClock } from "react-icons/fi";

function getTodayIsoDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function formatEnumLabel(value = "") {
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

/** YYYY-MM-DD (local) -> Java DayOfWeek name */
function dateStringToDayOfWeek(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const map = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return map[dt.getDay()];
}

function formatCatalogWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return "No weekly windows in catalogue (add availability in Resource portfolio).";
  }
  return windows
    .map((w) => {
      const st = w.startTime?.slice(0, 5) || "?";
      const et = w.endTime?.slice(0, 5) || "?";
      return `${formatEnumLabel(w.dayOfWeek)} ${st}–${et}`;
    })
    .join("; ");
}

function normalizeTypeLabel(type) {
  if (type == null) {
    return "Other";
  }
  if (typeof type === "object" && type.name) {
    return String(type.name).replace(/_/g, " ");
  }
  return String(type).replace(/_/g, " ");
}

function mapApiResources(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  return list.map((r) => ({
    id: r.id,
    name: r.name || `Resource ${r.id}`,
    type: normalizeTypeLabel(r.type),
    availabilityWindows: Array.isArray(r.availabilityWindows)
      ? r.availabilityWindows.map((w) => ({
          ...w,
          dayOfWeek:
            typeof w.dayOfWeek === "object" && w.dayOfWeek?.name
              ? w.dayOfWeek.name
              : w.dayOfWeek,
        }))
      : [],
    status: typeof r.status === "string" ? r.status : r.status?.name || "ACTIVE",
  }));
}

/** Local Date -> ISO local date-time (no timezone) for Spring LocalDateTime */
function formatLocalDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}:${s}`;
}

function buildHourlySlots(selectedDateStr) {
  const [year, month, day] = selectedDateStr.split("-").map(Number);
  const base = new Date(year, month - 1, day);
  const slots = [];
  for (let hour = 9; hour < 17; hour += 1) {
    const startTime = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, 0, 0);
    const endTime = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour + 1, 0, 0);
    slots.push({
      time: `${hour}:00 - ${hour + 1}:00`,
      startTime,
      endTime,
      available: undefined,
      message: "",
    });
  }
  return slots;
}

function ResourceAvailabilityPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => getTodayIsoDate());
  const [resourceId, setResourceId] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [summaryMessage, setSummaryMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getResources();
        if (!active) {
          return;
        }
        setResources(mapApiResources(data));
        setResourcesError(null);
      } catch (e) {
        if (active) {
          setResources([]);
          setResourcesError(e?.message || "Unable to load resources from the server.");
        }
      } finally {
        if (active) {
          setResourcesLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const getGroupLabel = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes("lab")) {
      return "Labs";
    }
    if (t.includes("room") || t.includes("hall")) {
      return "Rooms";
    }
    if (t.includes("equipment") || t.includes("projector")) {
      return "Equipment";
    }
    return type || "Resources";
  };

  const groupResourcesByType = () => {
    const grouped = resources.reduce((acc, resource) => {
      const type = resource.type || "Other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(resource);
      return acc;
    }, {});

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const selectedResource = resources.find((r) => String(r.id) === String(resourceId));
  const todayMin = getTodayIsoDate();

  const handleCheckAvailability = async () => {
    if (!selectedDate || !resourceId) {
      setNotification({ type: "warning", message: "Please select date and resource" });
      return;
    }

    if (selectedDate < todayMin) {
      setNotification({ type: "warning", message: "Choose today or a future date." });
      setSelectedDate(todayMin);
      return;
    }

    setLoading(true);
    setSummaryMessage("");
    try {
      const slots = buildHourlySlots(selectedDate);
      const rid = String(resourceId);

      const checked = await Promise.all(
        slots.map(async (slot) => {
          const startIso = formatLocalDateTime(slot.startTime);
          const endIso = formatLocalDateTime(slot.endTime);
          try {
            const payload = await checkResourceAvailability(rid, startIso, endIso);
            const reason = payload?.reasonCode ? `[${payload.reasonCode}] ` : "";
            return {
              ...slot,
              available: !!payload?.available,
              message: `${reason}${payload?.message || ""}`.trim(),
            };
          } catch (err) {
            return {
              ...slot,
              available: false,
              message: err.response?.data?.message || err.message || "Check failed",
            };
          }
        }),
      );

      setTimeSlots(checked);
      const open = checked.filter((s) => s.available).length;
      const resource = resources.find((r) => String(r.id) === String(resourceId));
      const windows = resource?.availabilityWindows || [];
      const dow = dateStringToDayOfWeek(selectedDate);

      let summary =
        open === 0
          ? "No hourly slots are available on this date. Each slot was checked with the API (weekly catalogue windows and approved bookings)."
          : `${open} of ${checked.length} hourly slots are available.`;

      if (windows.length > 0 && !windows.some((w) => w.dayOfWeek === dow)) {
        summary += ` This date is ${formatEnumLabel(dow)}; catalogue lists ${formatCatalogWindows(windows)} — unavailable slots usually mean that weekday is not in the schedule (server message on each slot).`;
      }

      setSummaryMessage(summary);
      setNotification({
        type: open > 0 ? "success" : "warning",
        message:
          open > 0
            ? `${open} slot${open === 1 ? "" : "s"} available between 9:00 and 17:00.`
            : "No free slots for the selected day (see summary and per-slot messages).",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error.response?.data?.message || error.message || "Failed to check availability",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = (slot) => {
    const selectedResource = resources.find((resource) => String(resource.id) === String(resourceId));

    const bookingData = {
      resourceId: String(resourceId),
      resourceName: selectedResource?.name || `Resource ${resourceId}`,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      lockResourceSelection: true,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate("/bookings/new");
  };

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Resource availability</h1>
      {resourcesLoading ? (
        <p className="mb-4 text-sm text-gray-600">Loading resources…</p>
      ) : null}
      {resourcesError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{resourcesError}</div>
      ) : null}
      {!resourcesLoading && !resourcesError && resources.length === 0 ? (
        <p className="mb-4 text-sm text-amber-800">
          No resources are available yet. Add resources in the admin catalogue to check availability.
        </p>
      ) : null}

      <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
          <FiSearch className="text-blue-500" /> Check availability
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Pick any allowed date: every hour from 9:00–17:00 is checked against the API (same rules as{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">GET /api/v1/resources/&#123;id&#125;/availability</code>{" "}
          / <code className="rounded bg-gray-100 px-1 text-xs">GET /api/v1/bookings/check</code>
          — weekly catalogue windows and approved bookings). The catalogue line under the resource is a reminder, not a
          block.
        </p>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
              <FiSearch className="text-gray-500" /> Resource
            </label>
            <select
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select resource</option>
              {groupResourcesByType().map(([type, resourcesInGroup]) => (
                <optgroup key={type} label={`${getGroupLabel(type)} (${resourcesInGroup.length})`}>
                  {resourcesInGroup.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
              <FiCalendar className="text-gray-500" /> Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleCheckAvailability}
            disabled={loading}
            className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Checking…" : "Check availability"}
          </button>
        </div>
      </div>

      {timeSlots.length > 0 ? (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FiClock className="text-blue-500" /> Time slots (9:00–17:00)
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {timeSlots.map((slot, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-md"
              >
                <p className="mb-3 text-lg font-semibold text-gray-900">{slot.time}</p>
                <p className="mb-1 text-sm text-gray-500">
                  {slot.available === undefined
                    ? "—"
                    : slot.available
                      ? "Available for booking"
                      : "Not available"}
                </p>
                {slot.message && !slot.available ? (
                  <p className="mb-3 line-clamp-2 text-xs text-gray-400">{slot.message}</p>
                ) : (
                  <div className="mb-3" />
                )}
                <button
                  type="button"
                  onClick={() => handleBookSlot(slot)}
                  disabled={!slot.available}
                  className={`w-full rounded-lg px-4 py-2 font-semibold transition-colors ${
                    slot.available
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  {slot.available ? "Book now" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {summaryMessage ? (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-100 p-6 shadow-md">
          <h3 className="mb-2 text-lg font-bold text-gray-900">Summary</h3>
          <p className="text-gray-800">{summaryMessage}</p>
          <p className="mt-2 text-sm text-gray-600">
            Resource ID: {resourceId || "—"} | Date: {selectedDate || "—"}
          </p>
        </div>
      ) : null}

      {notification ? (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      ) : null}
    </div>
  );
}

export default ResourceAvailabilityPage;
