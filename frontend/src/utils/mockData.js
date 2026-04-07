import { ROLES } from "./roleUtils";

export const mockBookings = [
  {
    id: "BK-104",
    facility: "Innovation Lab 2",
    date: "2026-04-12",
    time: "09:00 - 11:00",
    purpose: "IoT prototype workshop",
    status: "Approved",
  },
  {
    id: "BK-118",
    facility: "Main Auditorium",
    date: "2026-04-18",
    time: "14:00 - 16:00",
    purpose: "Student society briefing",
    status: "Pending",
  },
  {
    id: "BK-123",
    facility: "Seminar Room C",
    date: "2026-04-22",
    time: "10:00 - 11:30",
    purpose: "Final project rehearsal",
    status: "Approved",
  },
];

export const mockPendingBookings = [
  {
    id: "BK-221",
    facility: "Lecture Theatre A",
    date: "2026-04-14",
    time: "13:00 - 15:00",
    requestedBy: "Computing Student Union",
    attendees: 120,
    status: "Pending",
  },
  {
    id: "BK-224",
    facility: "Media Studio",
    date: "2026-04-16",
    time: "08:00 - 10:00",
    requestedBy: "Digital Media Club",
    attendees: 16,
    status: "Pending",
  },
];

export const mockResources = [
  {
    id: "RS-10",
    name: "Library Collaboration Room",
    type: "Room",
    location: "Library L2",
    capacity: 10,
    status: "Available",
  },
  {
    id: "RS-18",
    name: "Drone Research Lab",
    type: "Lab",
    location: "Engineering Block",
    capacity: 24,
    status: "Reserved",
  },
  {
    id: "RS-24",
    name: "Portable PA System",
    type: "Asset",
    location: "Media Stores",
    capacity: 1,
    status: "Maintenance",
  },
];

export const mockTickets = [
  {
    id: "TK-311",
    title: "Projector not powering on",
    category: "Equipment",
    location: "Lecture Hall B2",
    priority: "High",
    status: "Open",
    assignee: "Facilities Team",
  },
  {
    id: "TK-318",
    title: "Air conditioning issue",
    category: "Maintenance",
    location: "Administration Wing",
    priority: "Medium",
    status: "In Progress",
    assignee: "HVAC Technician",
  },
  {
    id: "TK-326",
    title: "Wi-Fi access point unstable",
    category: "Network",
    location: "Innovation Hub",
    priority: "Low",
    status: "Resolved",
    assignee: "IT Support",
  },
];

export const mockAssignedTickets = [
  {
    id: "TK-401",
    title: "Door access scanner fault",
    location: "Research Center Entrance",
    priority: "High",
    status: "Assigned",
  },
  {
    id: "TK-404",
    title: "Water leak near generator room",
    location: "Utilities Block",
    priority: "Critical",
    status: "In Progress",
  },
];

export const mockNotifications = [
  {
    id: "NT-90",
    title: "Booking approved",
    message: "Your Innovation Lab 2 booking was approved.",
    createdAt: "2026-04-07T08:30:00",
    read: false,
  },
  {
    id: "NT-91",
    title: "Ticket updated",
    message: "Technician assigned to TK-311.",
    createdAt: "2026-04-07T07:10:00",
    read: false,
  },
  {
    id: "NT-92",
    title: "Maintenance reminder",
    message: "Portable PA System is unavailable until Friday.",
    createdAt: "2026-04-06T16:40:00",
    read: true,
  },
];

export function buildMockGoogleUser(role) {
  if (role === ROLES.ADMIN) {
    return {
      name: "Alicia Fernando",
      email: "admin@smartcampus.edu",
      role: ROLES.ADMIN,
      provider: "google",
    };
  }

  if (role === ROLES.TECHNICIAN) {
    return {
      name: "Nimal Silva",
      email: "technician@smartcampus.edu",
      role: ROLES.TECHNICIAN,
      provider: "google",
    };
  }

  return {
    name: "Kavindu Perera",
    email: "user@smartcampus.edu",
    role: ROLES.USER,
    provider: "google",
  };
}

export function buildCreatedBooking(payload) {
  return {
    id: `BK-${Math.floor(Math.random() * 900 + 100)}`,
    facility: payload.facility,
    date: payload.date,
    time: payload.time,
    purpose: payload.purpose,
    status: "Pending",
  };
}

