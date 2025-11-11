// backend/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory events store
// Each event: {
//   id, title, date, location, hostName,
//   guests: [ { id, name, phone, status, contribution } ]
// }
let events = [];

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "OwanbePal backend is running 🎉",
    timestamp: new Date().toISOString(),
  });
});

// Get all events
app.get("/api/events", (req, res) => {
  res.json({
    success: true,
    events,
  });
});

// Create new event
app.post("/api/events", (req, res) => {
  const { title, date, location, hostName } = req.body || {};

  if (!title || !date || !location) {
    return res.status(400).json({
      success: false,
      message: "title, date and location are required",
    });
  }

  const newEvent = {
    id: Date.now().toString(),
    title,
    date,
    location,
    hostName: hostName || "",
    guests: [], // start with empty guests
  };

  events.push(newEvent);

  res.status(201).json({
    success: true,
    event: newEvent,
  });
});

// Update event (title, date, location, hostName only)
app.put("/api/events/:id", (req, res) => {
  const eventId = req.params.id;
  const { title, date, location, hostName } = req.body || {};

  const index = events.findIndex((evt) => evt.id === eventId);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const existingEvent = events[index];

  events[index] = {
    ...existingEvent,
    title: title ?? existingEvent.title,
    date: date ?? existingEvent.date,
    location: location ?? existingEvent.location,
    hostName: hostName ?? existingEvent.hostName,
  };

  res.json({
    success: true,
    event: events[index],
  });
});

// Delete event (and its guests)
app.delete("/api/events/:id", (req, res) => {
  const eventId = req.params.id;
  const existingLength = events.length;

  events = events.filter((evt) => evt.id !== eventId);

  if (events.length === existingLength) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  res.json({
    success: true,
    message: "Event deleted",
  });
});

//
// 👇 Guest routes
//

// Get guests for an event
app.get("/api/events/:id/guests", (req, res) => {
  const eventId = req.params.id;
  const event = events.find((evt) => evt.id === eventId);

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  res.json({
    success: true,
    guests: event.guests || [],
  });
});

// Add guest to an event
app.post("/api/events/:id/guests", (req, res) => {
  const eventId = req.params.id;
  const { name, phone, status, contribution } = req.body || {};

  const event = events.find((evt) => evt.id === eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Guest name is required",
    });
  }

  const newGuest = {
    id: Date.now().toString(),
    name: name.trim(),
    phone: (phone || "").trim(),
    status: status || "Invited",
    contribution: (contribution || "").trim(),
  };

  if (!Array.isArray(event.guests)) {
    event.guests = [];
  }
  event.guests.push(newGuest);

  res.status(201).json({
    success: true,
    guest: newGuest,
    guests: event.guests,
  });
});

// Update guest on an event
app.put("/api/events/:eventId/guests/:guestId", (req, res) => {
  const { eventId, guestId } = req.params;
  const { name, phone, status, contribution } = req.body || {};

  const event = events.find((evt) => evt.id === eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  if (!Array.isArray(event.guests)) {
    event.guests = [];
  }

  const index = event.guests.findIndex((g) => g.id === guestId);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Guest not found",
    });
  }

  const existing = event.guests[index];

  event.guests[index] = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    phone: phone !== undefined ? phone.trim() : existing.phone,
    status: status !== undefined ? status : existing.status,
    contribution:
      contribution !== undefined ? contribution.trim() : existing.contribution,
  };

  res.json({
    success: true,
    guest: event.guests[index],
    guests: event.guests,
  });
});

// Delete guest from an event
app.delete("/api/events/:eventId/guests/:guestId", (req, res) => {
  const { eventId, guestId } = req.params;

  const event = events.find((evt) => evt.id === eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const before = event.guests?.length || 0;
  event.guests = (event.guests || []).filter((g) => g.id !== guestId);
  const after = event.guests.length;

  if (before === after) {
    return res.status(404).json({
      success: false,
      message: "Guest not found",
    });
  }

  res.json({
    success: true,
    message: "Guest removed",
    guests: event.guests,
  });
});

app.listen(PORT, () => {
  console.log(`OwanbePal backend listening on http://localhost:${PORT}`);
});
