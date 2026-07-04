import { useState } from "react";
import api from "../api/axios";

export default function ProfilePage({ user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const initials = (user?.username || "U")
    .slice(0, 2)
    .toUpperCase();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccessMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">

        {/* Profile card */}
        <div className="entity-form-card">
          <div className="section-heading">
            <p className="section-kicker">Account</p>
            <h3>Your profile</h3>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1.25rem",
            background: "rgba(255,255,255,0.6)",
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "700",
              color: "white",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
                {user?.username}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                {user?.email || "No email set"}
              </p>
              <span className={user?.role === "ADMIN" ? "badge-active" : "badge-pending"}
                style={{ marginTop: "6px", display: "inline-flex" }}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="info-grid" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
            <div>
              <span className="info-label">Username</span>
              <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{user?.username}</p>
            </div>
            <div>
              <span className="info-label">Role</span>
              <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Change password card */}
        <form className="entity-form-card" onSubmit={handlePasswordChange}>
          <div className="section-heading">
            <p className="section-kicker">Security</p>
            <h3>Change password</h3>
          </div>

          <label className="form-field">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </label>

          <label className="form-field">
            <span>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </label>

          <label className="form-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </label>

          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}