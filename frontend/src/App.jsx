import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [healthMessage, setHealthMessage] = useState("Checking backend...");
  const [healthError, setHealthError] = useState("");

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState("");
  const [eventSuccess, setEventSuccess] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    location: "",
    hostName: ""
  });

  const [editingId, setEditingId] = useState(null);

  // Selected event for "Event Details" screen
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Guest list per event, stored from backend
  // Shape: { [eventId]: [ { id, name, phone, status, contribution } ] }
  const [guestsByEvent, setGuestsByEvent] = useState({});

  // Guest form state
  const [newGuest, setNewGuest] = useState({
    name: "",
    phone: "",
    status: "Invited",
    contribution: ""
  });

  // Which guest is being edited (null = adding new guest)
  const [editingGuestId, setEditingGuestId] = useState(null);

  // Guest filter: All, Invited, Confirmed, Declined
  const [guestFilterStatus, setGuestFilterStatus] = useState("All");

  // Run once on load
  useEffect(() => {
    // Health check
    fetch("http://localhost:4000/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthMessage(data.message || "Backend is up");
      })
      .catch((err) => {
        console.error(err);
        setHealthError("Could not reach backend. Is it running?");
      });

    // Load events
    fetchEvents();
  }, []);

  // Reset guest form whenever we switch selected event
  useEffect(() => {
    setNewGuest({
      name: "",
      phone: "",
      status: "Invited",
      contribution: ""
    });
    setEditingGuestId(null);
    setGuestFilterStatus("All");
  }, [selectedEvent]);

  const fetchEvents = () => {
    setLoadingEvents(true);
    setEventError("");
    setEventSuccess("");

    fetch("http://localhost:4000/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.events || []);
        } else {
          setEventError(data.message || "Failed to load events");
        }
      })
      .catch((err) => {
        console.error(err);
        setEventError("Could not load events from backend.");
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      date: "",
      location: "",
      hostName: ""
    });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEventError("");
    setEventSuccess("");

    if (!editingId) {
      // CREATE
      fetch("http://localhost:4000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newEvent)
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            setEventError(data.message || "Failed to create event");
            return;
          }

          setEvents((prev) => [...prev, data.event]);
          resetForm();
          setEventSuccess("Event created successfully 🎉");
        })
        .catch((err) => {
          console.error(err);
          setEventError("Could not send event to backend.");
        });
    } else {
      // UPDATE
      fetch(`http://localhost:4000/api/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newEvent)
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            setEventError(data.message || "Failed to update event");
            return;
          }

          setEvents((prev) =>
            prev.map((event) => (event.id === editingId ? data.event : event))
          );

          resetForm();
          setEventSuccess("Event updated ✅");
        })
        .catch((err) => {
          console.error(err);
          setEventError("Could not update event.");
        });
    }
  };

  const handleDeleteEvent = (id) => {
    setEventError("");
    setEventSuccess("");

    fetch(`http://localhost:4000/api/events/${id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setEventError(data.message || "Failed to delete event");
          return;
        }

        setEvents((prev) => prev.filter((event) => event.id !== id));

        if (editingId === id) {
          resetForm();
        }
        if (selectedEvent && selectedEvent.id === id) {
          setSelectedEvent(null);
        }

        // Also clear guests cache for that event
        setGuestsByEvent((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        setEventSuccess("Event deleted ✅");
      })
      .catch((err) => {
        console.error(err);
        setEventError("Could not delete event.");
      });
  };

  const handleEditClick = (event) => {
    setEventError("");
    setEventSuccess("");
    setSelectedEvent(null); // if user was on details, go back to form mode

    setEditingId(event.id);
    setNewEvent({
      title: event.title,
      date: event.date,
      location: event.location,
      hostName: event.hostName || ""
    });
  };

  // Fetch guests from backend for a specific event
  const fetchGuestsForEvent = (eventId) => {
    fetch(`http://localhost:4000/api/events/${eventId}/guests`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setEventError(data.message || "Failed to load guests");
          return;
        }
        setGuestsByEvent((prev) => ({
          ...prev,
          [eventId]: data.guests || []
        }));
        // keep events in sync for stats on dashboard
        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === eventId ? { ...evt, guests: data.guests || [] } : evt
          )
        );
      })
      .catch((err) => {
        console.error(err);
        setEventError("Could not load guests.");
      });
  };

  // Open details screen
  const handleViewClick = (event) => {
    setEventError("");
    setEventSuccess("");
    setEditingId(null); // stop editing if you go to details
    setSelectedEvent(event);
    fetchGuestsForEvent(event.id);
  };

  // Back from details to dashboard
  const handleBackToList = () => {
    setSelectedEvent(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    setEventError("");
    setEventSuccess("");
  };

  // Guest handlers

  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setNewGuest((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const trimmedName = newGuest.name.trim();
    if (!trimmedName) return;

    const payload = {
      name: trimmedName,
      phone: newGuest.phone,
      status: newGuest.status,
      contribution: newGuest.contribution
    };

    // If we have an editingGuestId, update; otherwise create
    if (editingGuestId) {
      fetch(
        `http://localhost:4000/api/events/${selectedEvent.id}/guests/${editingGuestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            setEventError(data.message || "Failed to update guest");
            return;
          }

          setGuestsByEvent((prev) => ({
            ...prev,
            [selectedEvent.id]: data.guests || []
          }));

          setEvents((prev) =>
            prev.map((evt) =>
              evt.id === selectedEvent.id
                ? { ...evt, guests: data.guests || [] }
                : evt
            )
          );

          setNewGuest({
            name: "",
            phone: "",
            status: "Invited",
            contribution: ""
          });
          setEditingGuestId(null);
          setEventSuccess("Guest updated ✅");
        })
        .catch((err) => {
          console.error(err);
          setEventError("Could not update guest.");
        });
    } else {
      // CREATE guest
      fetch(`http://localhost:4000/api/events/${selectedEvent.id}/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) {
            setEventError(data.message || "Failed to add guest");
            return;
          }

          setGuestsByEvent((prev) => ({
            ...prev,
            [selectedEvent.id]: data.guests || []
          }));

          setEvents((prev) =>
            prev.map((evt) =>
              evt.id === selectedEvent.id
                ? { ...evt, guests: data.guests || [] }
                : evt
            )
          );

          setNewGuest({
            name: "",
            phone: "",
            status: "Invited",
            contribution: ""
          });

          setEventSuccess("Guest added 🎉");
        })
        .catch((err) => {
          console.error(err);
          setEventError("Could not add guest.");
        });
    }
  };

  const handleDeleteGuest = (eventId, guestId) => {
    fetch(
      `http://localhost:4000/api/events/${eventId}/guests/${guestId}`,
      {
        method: "DELETE"
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setEventError(data.message || "Failed to remove guest");
          return;
        }

        setGuestsByEvent((prev) => ({
          ...prev,
          [eventId]: data.guests || []
        }));

        setEvents((prev) =>
          prev.map((evt) =>
            evt.id === eventId ? { ...evt, guests: data.guests || [] } : evt
          )
        );

        // if we were editing that guest, reset form
        if (editingGuestId === guestId) {
          setEditingGuestId(null);
          setNewGuest({
            name: "",
            phone: "",
            status: "Invited",
            contribution: ""
          });
        }

        setEventSuccess("Guest removed ✅");
      })
      .catch((err) => {
        console.error(err);
        setEventError("Could not remove guest.");
      });
  };

  const handleEditGuestClick = (guest) => {
    setEditingGuestId(guest.id);
    setNewGuest({
      name: guest.name || "",
      phone: guest.phone || "",
      status: guest.status || "Invited",
      contribution: guest.contribution || ""
    });
  };

  const handleCancelGuestEdit = () => {
    setEditingGuestId(null);
    setNewGuest({
      name: "",
      phone: "",
      status: "Invited",
      contribution: ""
    });
  };

  // 👉 SECOND SCREEN: Event Details + Guest list
  if (selectedEvent) {
    const allGuests = guestsByEvent[selectedEvent.id] || [];
    const filteredGuests =
      guestFilterStatus === "All"
        ? allGuests
        : allGuests.filter((g) => g.status === guestFilterStatus);

    const totalGuests = allGuests.length;
    const confirmedGuests = allGuests.filter(
      (g) => g.status === "Confirmed"
    ).length;

    return (
      <div className="app-root">
        <div className="details-shell">
          <header className="details-header">
            <button
              type="button"
              className="btn btn-back"
              onClick={handleBackToList}
            >
              ← Back to events
            </button>
            <span className="brand-pill">OwanbePal</span>
          </header>

          <main className="details-main">
            <section className="details-card">
              <h1 className="details-title">{selectedEvent.title}</h1>
              <p className="details-meta">
                <span>{selectedEvent.date}</span> •{" "}
                <span>{selectedEvent.location}</span>
              </p>
              <p className="details-host">
                Hosted by{" "}
                <strong>{selectedEvent.hostName || "Unknown Host"}</strong>
              </p>

              <div className="details-tag-row">
                <span className="tag tag-owanbe">Owanbe 🎊</span>
                <span className="details-badge">Event details</span>
              </div>
            </section>

            <section className="details-section">
              <h2>Event overview</h2>
              <p>
                This is the details view for your event. In a future version,
                this screen can show budgets, playlists, spraying and more.
              </p>

              <div className="details-grid">
                <div className="details-stat">
                  <span className="stat-label">Guests</span>
                  <span className="stat-value">
                    {totalGuests || "—"}
                  </span>
                  <span className="stat-caption">
                    Total people on your guest list
                  </span>
                </div>
                <div className="details-stat">
                  <span className="stat-label">Confirmed</span>
                  <span className="stat-value">
                    {confirmedGuests || "—"}
                  </span>
                  <span className="stat-caption">
                    Guests marked as &quot;Confirmed&quot;
                  </span>
                </div>
                <div className="details-stat">
                  <span className="stat-label">Contributions</span>
                  <span className="stat-value">—</span>
                  <span className="stat-caption">
                    Coming soon: spraying / gifts
                  </span>
                </div>
              </div>
            </section>

            {/* Guest list section */}
            <section className="details-section">
              <div className="guest-header-row">
                <h2>Guest list</h2>
                <div className="guest-filter-wrap">
                  <span className="guest-count-label">
                    {totalGuests} guests • {confirmedGuests} confirmed
                  </span>
                  <select
                    className="guest-filter"
                    value={guestFilterStatus}
                    onChange={(e) => setGuestFilterStatus(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Invited">Invited</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              {filteredGuests.length === 0 ? (
                <p className="muted-text">
                  No guests in this view. Try a different filter or add a new
                  guest 🎉
                </p>
              ) : (
                <div className="guest-table">
                  <div className="guest-row guest-row-header">
                    <span>Guest</span>
                    <span>Status</span>
                    <span>Contribution</span>
                    <span></span>
                  </div>
                  {filteredGuests.map((guest) => (
                    <div className="guest-row" key={guest.id}>
                      <span className="guest-name-cell">
                        <span className="guest-avatar">
                          {guest.name?.[0]?.toUpperCase() || "?"}
                        </span>
                        <span className="guest-name-block">
                          <span className="guest-name">{guest.name}</span>
                          {guest.phone && (
                            <span className="guest-phone">{guest.phone}</span>
                          )}
                        </span>
                      </span>
                      <span
                        className={`guest-status guest-status-${guest.status.toLowerCase()}`}
                      >
                        {guest.status}
                      </span>
                      <span>{guest.contribution || "—"}</span>
                      <span className="guest-actions">
                        <button
                          type="button"
                          className="btn btn-chip btn-edit"
                          onClick={() => handleEditGuestClick(guest)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-chip btn-delete"
                          onClick={() =>
                            handleDeleteGuest(selectedEvent.id, guest.id)
                          }
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form className="guest-form" onSubmit={handleGuestSubmit}>
                {editingGuestId && (
                  <div className="guest-editing-label">
                    Editing guest –{" "}
                    <button
                      type="button"
                      className="link-button"
                      onClick={handleCancelGuestEdit}
                    >
                      cancel
                    </button>
                  </div>
                )}

                <div className="guest-form-row">
                  <input
                    type="text"
                    name="name"
                    value={newGuest.name}
                    onChange={handleGuestInputChange}
                    placeholder="Guest name *"
                    required
                  />
                  <input
                    type="text"
                    name="phone"
                    value={newGuest.phone}
                    onChange={handleGuestInputChange}
                    placeholder="Phone (optional)"
                  />
                </div>
                <div className="guest-form-row">
                  <select
                    name="status"
                    value={newGuest.status}
                    onChange={handleGuestInputChange}
                  >
                    <option value="Invited">Invited</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Declined">Declined</option>
                  </select>
                  <input
                    type="text"
                    name="contribution"
                    value={newGuest.contribution}
                    onChange={handleGuestInputChange}
                    placeholder="Contribution (e.g. ₦50k drinks)"
                  />
                </div>
                <div className="guest-form-actions">
                  <button type="submit" className="btn btn-primary guest-submit">
                    {editingGuestId ? "Update guest ✅" : "Add guest 🎉"}
                  </button>
                  {editingGuestId && (
                    <button
                      type="button"
                      className="btn btn-secondary guest-cancel-btn"
                      onClick={handleCancelGuestEdit}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="details-section">
              <h2>Quick actions</h2>
              <div className="details-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleEditClick(selectedEvent)}
                >
                  Edit this event
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  Delete event
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  // 👉 FIRST SCREEN: Dashboard + form
  return (
    <div className="app-root">
      <div className="dashboard-shell">
        {/* Left side: list */}
        <div className="dashboard-left">
          <header className="dashboard-header">
            <div>
              <h1>OwanbePal</h1>
              <p className="header-subtitle">Host Dashboard</p>
            </div>
            <span className="brand-pill">Beta</span>
          </header>

          <div className="status-pill">
            {healthError ? (
              <span className="status-text error">{healthError}</span>
            ) : (
              <span className="status-text ok">{healthMessage}</span>
            )}
          </div>

          {eventSuccess && (
            <div className="alert alert-success">{eventSuccess}</div>
          )}
          {eventError && <div className="alert alert-error">{eventError}</div>}

          <div className="section-header">
            <h2>Your Events</h2>
            {!loadingEvents && events.length > 0 && (
              <span className="section-caption">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {loadingEvents ? (
            <p className="muted-text">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="muted-text">
              No events yet. Create your first Owanbe! 🎉
            </p>
          ) : (
            <ul className="event-list">
              {events.map((event) => {
                const guestsForEvent =
                  guestsByEvent[event.id] || event.guests || [];
                const total = guestsForEvent.length;
                const confirmed = guestsForEvent.filter(
                  (g) => g.status === "Confirmed"
                ).length;

                return (
                  <li key={event.id} className="event-card">
                    <div className="event-main">
                      <div className="event-title">{event.title}</div>
                      <div className="event-meta">
                        {event.date} • {event.location}
                      </div>
                      <div className="event-host">
                        Host: {event.hostName || "Unknown Host"}
                      </div>
                      <div className="event-stats-line">
                        <span>{total} guests</span>
                        <span className="dot-separator">•</span>
                        <span>{confirmed} confirmed</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <span className="tag tag-owanbe">Owanbe 🎊</span>
                      <div className="event-buttons">
                        <button
                          type="button"
                          className="btn btn-chip btn-view"
                          onClick={() => handleViewClick(event)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-chip btn-edit"
                          onClick={() => handleEditClick(event)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-chip btn-delete"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right side: form */}
        <div className="dashboard-right">
          <h2 className="form-title">
            {editingId ? "Edit Event" : "Create New Event"}
          </h2>
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label htmlFor="title">Event Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Tolu @ 30 – Birthday Party"
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                name="date"
                value={newEvent.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                required
                placeholder="Lagos, Abuja, London..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="hostName">Host Name</label>
              <input
                id="hostName"
                type="text"
                name="hostName"
                value={newEvent.hostName}
                onChange={handleInputChange}
                placeholder="Your name or MC name"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              {editingId ? "Update Event ✅" : "Save Event 🎉"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            )}

            <p className="form-footnote">
              * Required fields. Data is stored in memory on the server
              and will reset when the backend restarts.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
