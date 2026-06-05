import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell({ orders, paymentDues }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wms-dismissed-alerts") || "[]");
    } catch {
      return [];
    }
  });

  const panelRef = useRef(null);
  const navigate = useNavigate();
  const allAlerts = useNotifications(orders, paymentDues);
  const alerts = allAlerts.filter((a) => !dismissed.includes(a.id));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dismiss = (id, e) => {
    e.stopPropagation();
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("wms-dismissed-alerts", JSON.stringify(next));
  };

  const dismissAll = () => {
    const next = allAlerts.map((a) => a.id);
    setDismissed(next);
    localStorage.setItem("wms-dismissed-alerts", JSON.stringify(next));
    setOpen(false);
  };

  const handleAlertClick = (link) => {
    setOpen(false);
    navigate(link);
  };

  const count = alerts.length;

  return (
    <div className="notif-wrapper" ref={panelRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="notif-badge">{count > 9 ? "9+" : count}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span>Alerts</span>
            {count > 0 && (
              <button type="button" className="notif-dismiss-all" onClick={dismissAll}>
                Clear all
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="notif-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true"
                style={{ opacity: 0.35, margin: "0 auto 0.5rem", display: "block" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>All caught up</p>
            </div>
          ) : (
            <ul className="notif-list">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`notif-item notif-${alert.severity}`}
                  onClick={() => handleAlertClick(alert.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleAlertClick(alert.link)}
                >
                  <div className="notif-item-dot" aria-hidden="true" />
                  <div className="notif-item-body">
                    <p className="notif-item-title">{alert.title}</p>
                    <p className="notif-item-message">{alert.message}</p>
                    <p className="notif-item-detail">{alert.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="notif-item-close"
                    onClick={(e) => dismiss(alert.id, e)}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}