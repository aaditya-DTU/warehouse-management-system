import SummaryCard from "../components/SummaryCard";

export default function Dashboard({
  isAppLoading,
  customers,
  products,
  orders,
  paymentDues,
  stockItems,
}) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) =>
      new Date(order.createdAt || order.orderDate).toDateString() === today,
  ).length;
  const pendingDeliveries = orders.filter(
    (order) => !order.isDelivered && !order.isCancelled && order.isActive,
  ).length;
  const pendingPayments = paymentDues.filter(
    (payment) => payment.paymentStatus !== "FULLY_PAID",
  ).length;
  const lowStockItems = stockItems.filter(
    (product) => (product.availableQty || 0) <= 5,
  ).length;

  return (
    <div className="page-shell dashboard" id="dashboard-content">
      <section className="hero-panel">
        <div>
          <p className="section-kicker">Overview</p>
          <p className="hero-copy">
            Screen for orders, stock, deliveries, payments, and active business
            records.
          </p>
        </div>
        <div className="hero-metrics">
          <span>{customers.length} customers</span>
          <span>{products.length} products</span>
          <span>{orders.length} orders</span>
        </div>
      </section>

      {isAppLoading ? (
        <div className="banner">
          Refreshing live warehouse data from the backend.
        </div>
      ) : null}

      <div className="dashboard-grid">
        <SummaryCard
          title="Total orders today"
          value={todayOrders}
          to="/orders"
        />
        <SummaryCard
          title="Pending deliveries"
          value={pendingDeliveries}
          to="/deliveries"
        />
        <SummaryCard
          title="Pending payments"
          value={pendingPayments}
          to="/payments"
        />
        <SummaryCard
          title="Low stock items"
          value={lowStockItems}
          to="/stock"
        />
      </div>
    </div>
  );
}