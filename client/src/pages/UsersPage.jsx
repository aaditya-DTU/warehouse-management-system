import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const initialForm = {
  username: "",
  email: "",
  password: "",
  role: "STAFF",
  isActive: true,
};

export default function UsersPage() {
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [resetUserId, setResetUserId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    firstInputRef.current?.focus();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setListError("");
    try {
      const response = await api.get("/users");
      setUsers(response.data.users || []);
    } catch (error) {
      setListError(
        error.response?.data?.message || "Unable to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMessage("Username, email, and password are required.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/users", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: formData.role,
        isActive: formData.isActive,
      });

      setFormData(initialForm);
      setSuccessMessage("User created successfully.");
      await loadUsers();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to create user. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      await loadUsers();
    } catch (error) {
      setListError(
        error.response?.data?.message || "Unable to update user status.",
      );
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetUserId || !resetPassword.trim()) {
      setResetError("Select a user and enter a new password.");
      return;
    }

    setIsResetting(true);
    try {
      await api.put(`/users/${resetUserId}`, { password: resetPassword.trim() });
      setResetPassword("");
      setResetUserId("");
      setResetSuccess("Password reset successfully.");
    } catch (error) {
      setResetError(
        error.response?.data?.message || "Unable to reset password.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">
        {/* ── CREATE USER ── */}
        <form className="entity-form-card" onSubmit={handleCreateUser}>
          <div className="section-heading">
            <p className="section-kicker">User management</p>
            <h3>Create a new user</h3>
          </div>

          <label className="form-field">
            <span>Username</span>
            <input
              ref={firstInputRef}
              value={formData.username}
              onChange={(event) => handleChange("username", event.target.value)}
              placeholder="john_staff"
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="john@example.com"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => handleChange("password", event.target.value)}
              placeholder="Set initial password"
            />
          </label>

          <label className="form-field">
            <span>Role</span>
            <select
              value={formData.role}
              onChange={(event) => handleChange("role", event.target.value)}
            >
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) => handleChange("isActive", event.target.checked)}
            />
            <span>Mark user as active</span>
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Creating user..." : "Create user"}
          </button>
        </form>

        {/* ── RESET PASSWORD ── */}
        <form className="entity-form-card" onSubmit={handleResetPassword}>
          <div className="section-heading">
            <p className="section-kicker">Access control</p>
            <h3>Reset user password</h3>
          </div>

          <label className="form-field">
            <span>Select user</span>
            <select
              value={resetUserId}
              onChange={(event) => setResetUserId(event.target.value)}
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} · {user.role}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>New password</span>
            <input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="Enter new password"
            />
          </label>

          {resetError ? <p className="form-error">{resetError}</p> : null}
          {resetSuccess ? <p className="form-success">{resetSuccess}</p> : null}

          <button type="submit" className="primary-button" disabled={isResetting}>
            {isResetting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </section>

      {/* ── USER LIST ── */}
      <section className="module-panel">
        <div className="list-toolbar" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <p className="section-kicker">Team members</p>
            <h3>{users.length} total users</h3>
          </div>
        </div>

        {listError ? <p className="form-error">{listError}</p> : null}

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading users...</h3>
            <p>Fetching team members from the backend.</p>
          </div>
        ) : null}

        {!isLoading && !users.length ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>Create the first user account above.</p>
          </div>
        ) : null}

        {!isLoading && users.length ? (
          <div className="entity-grid">
            {users.map((user) => (
              <article key={user._id} className="entity-card">
                <div className="card-row">
                  <div>
                    <strong>{user.username}</strong>
                    <p>{user.email}</p>
                  </div>
                  <span className={user.isActive ? "badge-active" : "badge-inactive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="info-grid">
                  <div>
                    <span className="info-label">Role</span>
                    <p>{user.role}</p>
                  </div>
                  <div>
                    <span className="info-label">Created</span>
                    <p>{new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>

                <div className="list-divider" />

                <button
                  type="button"
                  className={`ghost-button${user.isActive ? " danger-button" : ""}`}
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => handleToggleActive(user)}
                >
                  {user.isActive ? "Deactivate user" : "Activate user"}
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}