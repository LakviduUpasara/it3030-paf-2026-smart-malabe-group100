import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import Card from "./Card";
import {
  createTechnician,
  deleteTechnician,
  getTechnicians,
  updateTechnician,
} from "../services/adminService";

const emptyForm = { fullName: "", email: "", password: "" };

function AdminTechniciansPanel() {
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTechnicians = async () => {
    const res = await getTechnicians();
    setTechnicians(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loadTechnicians()
      .catch((err) => {
        if (active) setError(err.message || "Failed to load technicians.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTechnicians = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return technicians;
    }
    return technicians.filter((tech) => {
      const name = String(tech.fullName || "").toLowerCase();
      const email = String(tech.email || "").toLowerCase();
      const id = String(tech.id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || id.includes(q);
    });
  }, [technicians, searchQuery]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await updateTechnician(editingId, payload);
        setSuccess("Technician updated.");
      } else {
        await createTechnician({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setSuccess("Technician added.");
      }
      setForm(emptyForm);
      setEditingId("");
      await loadTechnicians();
    } catch (err) {
      setError(err.message || "Save failed.");
    }
  };

  const onEdit = (tech) => {
    setError("");
    setSuccess("");
    setEditingId(tech.id);
    setForm({
      fullName: tech.fullName || "",
      email: tech.email || "",
      password: "",
    });
  };

  const onCancelEdit = () => {
    setEditingId("");
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const onDelete = async (tech) => {
    if (
      !window.confirm(
        `Delete technician "${tech.fullName || tech.email}"? Tickets assigned to them will be unassigned; in-progress tickets return to Open.`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await deleteTechnician(tech.id);
      if (editingId === tech.id) {
        onCancelEdit();
      }
      setSuccess("Technician removed.");
      await loadTechnicians();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="page-stack admin-technicians-panel">
        <p className="supporting-text">Loading technicians…</p>
      </div>
    );
  }

  return (
    <div className="page-stack admin-technicians-panel">
      {error ? <p className="alert alert-error">{error}</p> : null}
      {success ? <p className="alert alert-success">{success}</p> : null}
      <Card
        title={editingId ? "Edit technician" : "Add technician"}
        subtitle="Technicians can log in and work tickets assigned to them."
      >
        <form className="form-grid" onSubmit={onSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>{editingId ? "New password (optional)" : "Password"}</span>
            <input
              required={!editingId}
              type="password"
              autoComplete={editingId ? "new-password" : "new-password"}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={editingId ? "Leave blank to keep current password" : ""}
            />
          </label>
          <div className="field">
            <div className="button-row">
              <Button type="submit">{editingId ? "Save changes" : "Add technician"}</Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={onCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </Card>

      <Card title="Technicians">
        {technicians.length > 0 ? (
          <div className="my-tickets-filters" aria-label="Search technicians">
            <div className="my-tickets-filters-search-row">
              <label className="my-tickets-filters-search">
                <span>Search</span>
                <input
                  autoComplete="off"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Name, email, or user ID"
                  type="search"
                  value={searchQuery}
                />
              </label>
            </div>
            {searchQuery.trim() ? (
              <div className="my-tickets-filters-controls">
                <Button type="button" variant="ghost" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="list-stack">
          {technicians.length === 0 ? (
            <p className="supporting-text">No technicians yet. Add one above.</p>
          ) : filteredTechnicians.length === 0 ? (
            <p className="supporting-text my-tickets-filter-empty">
              No technicians match your search. Try a different term or{" "}
              <button className="link-button" onClick={() => setSearchQuery("")} type="button">
                clear search
              </button>
              .
            </p>
          ) : (
            filteredTechnicians.map((tech) => (
              <article className="my-ticket-item" key={tech.id}>
                <div className="my-ticket-main">
                  <strong>{tech.fullName || "—"}</strong>
                  <p className="supporting-text">{tech.email}</p>
                </div>
                <div className="button-row">
                  <Button type="button" variant="secondary" onClick={() => onEdit(tech)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => onDelete(tech)}>
                    Delete
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export default AdminTechniciansPanel;
