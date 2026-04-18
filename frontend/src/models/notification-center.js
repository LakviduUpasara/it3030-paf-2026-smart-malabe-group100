/**
 * Client-side notification feed matching (aligned with server audience dimensions).
 * Viewer profile may be partial; explicit recipientUserIds always wins.
 */

function norm(s) {
  return s == null ? "" : String(s).trim();
}

function hasAny(list) {
  return Array.isArray(list) && list.length > 0;
}

function containsCi(list, value) {
  if (!hasAny(list) || value == null) return true;
  const v = norm(value);
  return list.some((x) => norm(x).toLowerCase() === v.toLowerCase());
}

function containsId(list, id) {
  if (!hasAny(list) || id == null) return true;
  return list.some((x) => norm(x) === norm(id));
}

/**
 * @param {object} audience — roles, userRoles, facultyCodes, degreeCodes, semesterCodes, streamCodes, intakeIds, subgroupCodes, recipientUserIds
 * @param {object} viewer — { userId, userRole?, appRole?, facultyCodes?, degreeCodes?, semesterCodes?, streamCodes?, intakeIds?, subgroupCodes? }
 */
export function matchesAudience(audience, viewer) {
  if (!audience || !viewer) return false;
  const uid = norm(viewer.userId);
  if (hasAny(audience.recipientUserIds)) {
    return audience.recipientUserIds.some((x) => norm(x) === uid);
  }

  const appRole = norm(viewer.appRole || viewer.role).toUpperCase();
  if (hasAny(audience.roles)) {
    const ok = audience.roles.some((r) => norm(r).toUpperCase() === appRole);
    if (!ok) return false;
  }
  if (hasAny(audience.userRoles)) {
    const ok = audience.userRoles.some((r) => norm(r).toUpperCase() === appRole);
    if (!ok) return false;
  }

  if (hasAny(audience.facultyCodes) && viewer.facultyCodes) {
    if (!viewer.facultyCodes.some((fc) => containsCi(audience.facultyCodes, fc))) return false;
  } else if (hasAny(audience.facultyCodes) && !viewer.facultyCodes) {
    if (appRole === "STUDENT" || appRole === "LECTURER" || appRole === "LAB_ASSISTANT") return false;
  }

  if (hasAny(audience.degreeCodes) && viewer.degreeCodes) {
    if (!viewer.degreeCodes.some((dc) => containsCi(audience.degreeCodes, dc))) return false;
  } else if (hasAny(audience.degreeCodes) && !viewer.degreeCodes) {
    if (appRole === "STUDENT") return false;
  }

  if (hasAny(audience.semesterCodes) && viewer.semesterCodes) {
    if (!viewer.semesterCodes.some((sc) => containsCi(audience.semesterCodes, sc))) return false;
  } else if (hasAny(audience.semesterCodes) && !viewer.semesterCodes) {
    /* allow if not scoped */
  }

  if (hasAny(audience.streamCodes) && viewer.streamCodes) {
    if (!viewer.streamCodes.some((sc) => containsCi(audience.streamCodes, sc))) return false;
  } else if (hasAny(audience.streamCodes) && !viewer.streamCodes) {
    if (appRole === "STUDENT") return false;
  }

  if (hasAny(audience.intakeIds) && viewer.intakeIds) {
    if (!viewer.intakeIds.some((id) => containsId(audience.intakeIds, id))) return false;
  } else if (hasAny(audience.intakeIds) && !viewer.intakeIds) {
    if (appRole === "STUDENT") return false;
  }

  if (hasAny(audience.subgroupCodes) && viewer.subgroupCodes) {
    if (!viewer.subgroupCodes.some((sg) => containsCi(audience.subgroupCodes, sg))) return false;
  } else if (hasAny(audience.subgroupCodes) && !viewer.subgroupCodes) {
    if (appRole === "STUDENT") return false;
  }

  return true;
}

/**
 * @param {object[]} feed — NotificationFeedItem[]
 * @param {object} viewer
 */
export function resolveNotificationsForUser(feed, viewer) {
  if (!Array.isArray(feed)) return [];
  return feed.filter((item) => {
    const aud = item.audience || {};
    return matchesAudience(aud, viewer);
  });
}


export function toNotificationFeedItem(announcement, audience, recipientUserIds) {
  const publishedAt = announcement.publishedAt || announcement.deliveryAt || new Date().toISOString();
  return {
    id: `feed-${announcement.id}`,
    type: "Announcement",
    title: announcement.title,
    message: announcement.message,
    time: publishedAt,
    publishedAt,
    unread: true,
    targetLabel: announcement.audienceLabel || "",
    audience: { ...audience, recipientUserIds: recipientUserIds || [] },
    channel: announcement.channel,
    recipientUserIds: recipientUserIds || [],
    recipientCount: recipientUserIds?.length ?? 0,
  };
}

/** In-app / Web feed (not email-only). */
export function channelIncludesWeb(channel) {
  const c = norm(channel).toLowerCase();
  return c === "in-app" || c === "web" || c === "both";
}

export function rebuildFeedFromAnnouncements(announcements) {
  const items = [];
  for (const a of announcements || []) {
    if (norm(a.status) !== "Sent") continue;
    if (!channelIncludesWeb(a.channel)) continue;
    const aud = buildNotificationAudience(a);
    const rids = (a.tracking?.resolvedRecipientUserIds || a.tracking?.recipientUserIds || []).filter(Boolean);
    items.push(toNotificationFeedItem(a, aud, rids));
  }
  return items;
}

export function buildNotificationAudience(announcement) {
  const type = norm(announcement.audienceType);
  const base = {
    roles: [],
    userRoles: [],
    facultyCodes: [],
    degreeCodes: [],
    semesterCodes: [],
    streamCodes: [],
    intakeIds: [],
    subgroupCodes: [],
    recipientUserIds: [],
  };

  if (type === "All") {
    return {
      ...base,
      roles: ["USER", "STUDENT", "LECTURER", "LAB_ASSISTANT", "ADMIN", "LOST_ITEM_ADMIN", "TECHNICIAN", "MANAGER"],
    };
  }

  if (type === "Role") {
    const roles = parseAudienceRoles(announcement.audienceLabel);
    return { ...base, roles };
  }

  if (type === "Faculty") {
    const codes = announcement.targeting?.facultyCodes || [];
    return { ...base, roles: ["STUDENT", "LECTURER", "LAB_ASSISTANT"], facultyCodes: codes };
  }

  if (type === "Semester") {
    const sem = announcement.targeting?.semesterCodes || [];
    return { ...base, roles: ["STUDENT"], semesterCodes: sem.length ? sem : [] };
  }

  if (type === "Degree Program") {
    const t = announcement.targeting || {};
    return {
      ...base,
      roles: ["STUDENT"],
      facultyCodes: t.facultyCodes || [],
      degreeCodes: t.degreeCodes || [],
      semesterCodes: t.semesterCodes || [],
      intakeIds: t.intakeIds || [],
      streamCodes: t.streamCodes || [],
      subgroupCodes: t.subgroupCodes || [],
    };
  }

  return base;
}

/**
 * Parses comma/semicolon-separated role tokens. Returns [] when empty (caller may apply defaults).
 */
export function parseAudienceRolesFromLabel(label) {
  const s = norm(label);
  if (!s) return [];
  return s
    .split(/[,;/]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.toUpperCase().replace(/\s+/g, "_"));
}

function parseAudienceRoles(label) {
  const parsed = parseAudienceRolesFromLabel(label);
  return parsed.length ? parsed : ["STUDENT"];
}
