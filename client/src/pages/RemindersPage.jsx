import { useEffect, useState } from "react";
import api from "../api/axios";
import { formatCurrency, formatDateTime, formatStatusLabel } from "../utils/formatters";

export default function RemindersPage({ paymentDues, isLoading }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [selectedDueId, setSelectedDueId] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [isSending, setIsSending] = useState(false);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  const unpaidDues = (paymentDues || []).filter(
    (d) => d.paymentStatus !== "FULLY_PAID"
  );

  const loadData = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterChannel) params.append("channel", filterChannel);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/reminders?${params}`),
        api.get("/reminders/stats"),
      ]);
      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      setErrorMessage("Unable to load reminder data.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filterStatus, filterChannel]);

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!selectedDueId) {
      setErrorMessage("Select a payment due first.");
      return;
    }
    setIsSending(true);
    try {
      await api.post("/reminders/send", {
        paymentDueId: selectedDueId,
        channel,
      });
      setSuccessMessage(`${channel} reminder sent successfully.`);
      setSelectedDueId("");
      loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send reminder.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRunCron = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsRunningCron(true);
    try {
      const res = await api.post("/reminders/run-cron");
      const { sent, failed, skipped } = res.data.results;
      setSuccessMessage(
        `Batch complete — ${sent} sent, ${skipped} skipped (already sent today), ${failed} failed.`
      );
      loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Batch run failed.");
    } finally {
      setIsRunningCron(false);
    }
  };

  return (
    <div className="page-shell">
      {/* ── Stats row ── */}
      {stats && (
        <div className="dashboard-grid">
          {[
            { label: "Total sent", value: stats.totalSent },
            { label: "Sent today", value: stats.sentToday },
            { label: "Failed", value: stats.totalFailed },
            { label: "Pending dues", value: stats.pendingDues },
          ].map((s) => (
            <div key={s.label} className="summary-card">
              <div className="card-title">{s.label}</div>
              <div className="card-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <section className="split-panel">
        {/* ── Send form ── */}
        <form className="entity-form-card" onSubmit={handleSend}>
          <div className="section-heading">
            <p className="section-kicker">Manual reminder</p>
            <h3>Send payment reminder</h3>
          </div>

          <label className="form-field">
            <span>Payment due</span>
            <select
              value={selectedDueId}
              onChange={(e) => setSelectedDueId(e.target.value)}
            >
              <option value="">Select unpaid due</option>
              {unpaidDues.map((due) => (
                <option key={due._id} value={due._id}>
                  {due.orderNo} · {due.customerName} ·{" "}
                  {formatCurrency(due.balanceAmount)} pending
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </label>

          {selectedDueId && (
            <div className="detail-card">
              <p className="section-kicker" style={{ marginBottom: "0.4rem" }}>
                Message preview
              </p>
              {(() => {
                const due = unpaidDues.find((d) => d._id === selectedDueId);
                if (!due) return null;
                const balance = Number(due.balanceAmount).toLocaleString("en-IN");
                return (
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                    Dear {due.customerName}, this is a payment reminder for order{" "}
                    {due.orderNo}. An amount of ₹{balance} is pending. Please
                    arrange payment at your earliest convenience. Thank you.
                  </p>
                );
              })()}
            </div>
          )}

          {errorMessage && <p className="form-error">{errorMessage}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <div className="button-row">
            <button
              type="submit"
              className="primary-button"
              disabled={isSending}
              style={{ flex: 1 }}
            >
              {isSending ? "Sending..." : `Send ${channel} reminder`}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleRunCron}
              disabled={isRunningCron}
            >
              {isRunningCron ? "Running..." : "Run batch now"}
            </button>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.5rem 0 0" }}>
            "Run batch now" sends SMS reminders to all dues older than{" "}
            {process.env.REMINDER_GRACE_DAYS || 3} days that haven't been
            reminded today. The cron also runs automatically at 9 AM IST daily.
          </p>
        </form>
      </section>

      {/* ── Log table ── */}
      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Reminder history</p>
            <h3>{logs.length} records</h3>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label className="form-field" style={{ marginBottom: 0 }}>
              <span>Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>
            <label className="form-field" style={{ marginBottom: 0 }}>
              <span>Channel</span>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
              >
                <option value="">All</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </label>
          </div>
        </div>

        {logsLoading ? (
          <div className="empty-state">
            <h3>Loading logs...</h3>
            <p>Fetching reminder history.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <h3>No reminders sent yet</h3>
            <p>Send your first reminder above or wait for the daily cron at 9 AM.</p>
          </div>
        ) : (
          <div className="table-card table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Channel</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Trigger</th>
                  <th>Sent at</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontWeight: 600 }}>{log.orderNo}</td>
                    <td>{log.customerName}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {log.customerMobile}
                    </td>
                    <td>
                      <span
                        className={
                          log.channel === "WHATSAPP"
                            ? "badge-active"
                            : "badge-pending"
                        }
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td>{formatCurrency(log.balanceAmount)}</td>
                    <td>
                      <span
                        className={
                          log.status === "SENT"
                            ? "badge-active"
                            : "badge-inactive"
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {formatStatusLabel(log.triggeredBy)}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {formatDateTime(log.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}