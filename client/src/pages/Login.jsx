import { useState } from "react";

export default function Login({ onLogin, isSubmitting, error }) {
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: "admin123",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(credentials);
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <h2>Login to the dashboard</h2>
            <p className="muted-copy">
              Login is autofilled for quick demo purpose.
            </p>
          </div>

          <label className="form-field">
            <span>Username</span>
            <input
              type="text"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              placeholder="Enter username"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Enter password"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}