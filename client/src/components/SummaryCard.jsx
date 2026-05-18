import { Link } from "react-router-dom";

export default function SummaryCard({ title, value, to }) {
  return (
    <Link to={to} className="summary-card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value ?? "No data yet"}</div>
    </Link>
  );
}