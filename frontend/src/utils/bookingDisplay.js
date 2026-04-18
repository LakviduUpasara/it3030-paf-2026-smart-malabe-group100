/** Maps REST booking DTOs to admin / approval queue display fields. */
export function normalizeBookingQueueRow(b) {
  const facility = b.resourceName || b.facility || `Resource #${b.resourceId}`;
  const requestedBy = b.requesterName || b.requesterEmail || b.requestedBy || "—";
  let date = b.date;
  let time = b.time;
  if (b.startTime) {
    const start = new Date(b.startTime);
    date = start.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    if (b.endTime) {
      const end = new Date(b.endTime);
      time = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  }
  const attendees = b.expectedAttendees ?? b.attendees ?? 0;
  return { ...b, facility, requestedBy, date, time, attendees };
}
