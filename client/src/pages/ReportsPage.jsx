import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "../utils/formatters";

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "yearly", label: "This Year" },
];

const summaryCards = (summary) => [
  {
    group: "Orders",
    items: [
      { label: "Total Orders", value: summary.orders.total },
      { label: "Delivered", value: summary.orders.delivered },
      { label: "Pending", value: summary.orders.pending },
      { label: "Cancelled", value: summary.orders.cancelled },
      { label: "Order Value", value: formatCurrency(summary.orders.totalValue) },
    ],
  },
  {
    group: "Revenue & Payments",
    items: [
      { label: "Collected", value: formatCurrency(summary.revenue.collected) },
      { label: "Pending", value: formatCurrency(summary.revenue.pending) },
      { label: "Fully Paid", value: summary.revenue.fullyPaid },
      { label: "Partially Paid", value: summary.revenue.partiallyPaid },
      { label: "Not Paid", value: summary.revenue.notPaid },
    ],
  },
  {
    group: "Deliveries",
    items: [
      { label: "Total", value: summary.deliveries.total },
      { label: "Successful", value: summary.deliveries.successful },
      { label: "Failed", value: summary.deliveries.failed },
      { label: "Cancelled", value: summary.deliveries.cancelled },
      { label: "Success Rate", value: `${summary.deliveries.successRate}%` },
    ],
  },
];

const buildChartData = (charts) =>
  charts.labels.map((label, i) => ({
    label,
    Orders: charts.orders[i],
    Revenue: charts.revenue[i],
    Deliveries: charts.deliveries[i],
  }));

// ── Simple PDF via print ───────────────────────────────────────────────────
const handleDownloadPDF = () => {
  window.print();
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReport = async (selectedPeriod) => {
    setIsLoading(true);
    setErrorMessage("");
    setReport(null);

    try {
      const response = await api.get(`/reports?period=${selectedPeriod}`);
      setReport(response.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to load report. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(period);
  }, []);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    loadReport(value);
  };

  const chartData = report ? buildChartData(report.charts) : [];

  return (
    <div className="page-shell" id="reports-print-area">

      {/* ── Header controls ── */}
      <div className="report-controls">
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`period-tab${period === p.value ? " period-tab-active" : ""}`}
              onClick={() => handlePeriodChange(p.value)}
              disabled={isLoading}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={handleDownloadPDF}
          disabled={!report || isLoading}
        >
          Download PDF
        </button>
      </div>

      {/* ── States ── */}
      {isLoading ? (
        <div className="empty-state">
          <h3>Generating report...</h3>
          <p>Pulling orders, payments, and delivery data from the backend.</p>
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <p className="form-error">{errorMessage}</p>
      ) : null}

      {/* ── Report content ── */}
      {!isLoading && report ? (
        <>
          {/* ── Summary cards ── */}
          {summaryCards(report.summary).map((group) => (
            <section key={group.group} className="module-panel">
              <div className="list-toolbar" style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <p className="section-kicker">Summary</p>
                  <h3>{group.group}</h3>
                </div>
              </div>

              <div className="report-summary-grid">
                {group.items.map((item) => (
                  <div key={item.label} className="report-stat-card">
                    <p className="report-stat-label">{item.label}</p>
                    <p className="report-stat-value">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* ── Orders chart ── */}
          <section className="module-panel">
            <div className="list-toolbar" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <p className="section-kicker">Trend</p>
                <h3>Orders over time</h3>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,33,30,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(24,33,30,0.1)",
                    fontSize: "0.85rem",
                  }}
                />
                <Bar dataKey="Orders" fill="#c26a2d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* ── Revenue chart ── */}
          <section className="module-panel">
            <div className="list-toolbar" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <p className="section-kicker">Trend</p>
                <h3>Revenue collected over time</h3>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,33,30,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(24,33,30,0.1)",
                    fontSize: "0.85rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#1e3a34"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#1e3a34" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* ── Deliveries chart ── */}
          <section className="module-panel">
            <div className="list-toolbar" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <p className="section-kicker">Trend</p>
                <h3>Successful deliveries over time</h3>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,33,30,0.07)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#5f6b66" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(24,33,30,0.1)",
                    fontSize: "0.85rem",
                  }}
                />
                <Bar dataKey="Deliveries" fill="#1e3a34" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      ) : null}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .sidebar, .content-header, .mobile-backbar, .report-controls { display: none !important; }
          .content { padding: 0 !important; height: auto !important; overflow: visible !important; }
          .page-shell { gap: 1rem !important; }
          .module-panel { break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; }
        }

        .report-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .period-tabs {
          display: flex;
          gap: 0.4rem;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(24,33,30,0.09);
          border-radius: 10px;
          padding: 0.3rem;
        }

        .period-tab {
          padding: 0.55rem 1.1rem;
          border-radius: 7px;
          font-size: 0.88rem;
          font-weight: 600;
          background: transparent;
          color: var(--text-secondary);
          border: none;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }

        .period-tab:hover:not(:disabled) {
          background: rgba(30,58,52,0.07);
          color: var(--text-primary);
        }

        .period-tab-active {
          background: var(--accent) !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(194,106,45,0.3);
        }

        .period-tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .report-stat-card {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(24,33,30,0.08);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }

        .report-stat-label {
          margin: 0 0 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-secondary);
        }

        .report-stat-value {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          font-family: 'DM Serif Display', Georgia, serif;
        }

        @media (max-width: 900px) {
          .report-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (max-width: 600px) {
          .report-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .report-controls { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}