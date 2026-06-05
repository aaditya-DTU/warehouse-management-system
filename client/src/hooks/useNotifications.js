import { useMemo } from "react";

export function useNotifications(orders = [], paymentDues = []) {
  return useMemo(() => {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Overdue deliveries — delivery date passed, not delivered, not cancelled
    orders.forEach((order) => {
      if (order.isDelivered || order.isCancelled || !order.isActive) return;
      const deliveryDate = new Date(order.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        const daysLate = Math.floor((today - deliveryDate) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `delivery-${order._id}`,
          type: "delivery",
          severity: daysLate >= 3 ? "high" : "medium",
          title: "Overdue delivery",
          message: `${order.orderNo} · ${order.customerName}`,
          detail: `${daysLate} day${daysLate !== 1 ? "s" : ""} overdue`,
          link: "/deliveries",
        });
      }
    });

    // Unpaid dues — delivered but nothing paid yet, 3+ days old
    paymentDues.forEach((due) => {
      if (due.paymentStatus === "FULLY_PAID") return;
      const created = new Date(due.createdAt);
      const daysOld = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

      if (due.paymentStatus === "NOT_PAID" && daysOld >= 3) {
        alerts.push({
          id: `payment-overdue-${due._id}`,
          type: "payment",
          severity: daysOld >= 7 ? "high" : "medium",
          title: "Payment not received",
          message: `${due.orderNo} · ${due.customerName}`,
          detail: `${daysOld} days since delivery`,
          link: "/payments",
        });
      }

      // Partial payment reminder — balance still remaining, 5+ days
      if (due.paymentStatus === "PARTIALLY_PAID" && daysOld >= 5) {
        alerts.push({
          id: `payment-partial-${due._id}`,
          type: "payment",
          severity: "low",
          title: "Balance pending",
          message: `${due.orderNo} · ${due.customerName}`,
          detail: `₹${due.balanceAmount?.toLocaleString("en-IN")} remaining`,
          link: "/payments",
        });
      }
    });

    // Sort: high → medium → low
    const order = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return alerts;
  }, [orders, paymentDues]);
}