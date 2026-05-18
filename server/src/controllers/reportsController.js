import Order from "../models/Order.js";
import PaymentDue from "../models/PaymentDue.js";
import Delivery from "../models/Delivery.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const getDateRange = (period) => {
  const now = new Date();
  const from = new Date();

  if (period === "weekly") {
    from.setDate(now.getDate() - 6);
  } else if (period === "monthly") {
    from.setDate(now.getDate() - 29);
  } else if (period === "yearly") {
    from.setMonth(now.getMonth() - 11);
    from.setDate(1);
  } else {
    from.setDate(now.getDate() - 29); // default monthly
  }

  from.setHours(0, 0, 0, 0);
  return { from, to: now };
};

// Generates date labels for the chart x-axis
const generateLabels = (period, from, to) => {
  const labels = [];
  const cursor = new Date(from);

  if (period === "yearly") {
    // One label per month
    while (cursor <= to) {
      labels.push(
        cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (period === "monthly") {
    // One label per week (every 7 days)
    while (cursor <= to) {
      labels.push(
        cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      );
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    // weekly — one label per day
    while (cursor <= to) {
      labels.push(
        cursor.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit" })
      );
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return labels;
};

// Buckets a date value into the correct label index
const getBucketIndex = (date, period, from) => {
  const d = new Date(date);
  if (period === "yearly") {
    const monthsDiff =
      (d.getFullYear() - from.getFullYear()) * 12 +
      (d.getMonth() - from.getMonth());
    return Math.max(0, monthsDiff);
  } else if (period === "monthly") {
    const daysDiff = Math.floor((d - from) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(daysDiff / 7));
  } else {
    return Math.max(
      0,
      Math.floor((d - from) / (1000 * 60 * 60 * 24))
    );
  }
};

// ── Main Report Controller ─────────────────────────────────────────────────

export const getReport = async (req, res, next) => {
  try {
    const period = req.query.period || "monthly";

    if (!["weekly", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Period must be weekly, monthly, or yearly",
      });
    }

    const { from, to } = getDateRange(period);
    const labels = generateLabels(period, from, to);
    const bucketCount = labels.length;

    // ── Fetch data in parallel ─────────────────────────────────────────

    const [orders, paymentDues, deliveries] = await Promise.all([
      Order.find({
        isDeleted: false,
        createdAt: { $gte: from, $lte: to },
      }),
      PaymentDue.find({
        createdAt: { $gte: from, $lte: to },
      }),
      Delivery.find({
        isDeleted: false,
        createdAt: { $gte: from, $lte: to },
      }),
    ]);

    // ── Orders summary ─────────────────────────────────────────────────

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.isDelivered).length;
    const cancelledOrders = orders.filter((o) => o.isCancelled).length;
    const pendingOrders = orders.filter(
      (o) => !o.isDelivered && !o.isCancelled && o.isActive
    ).length;
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.orderAmount || 0), 0);

    // ── Revenue summary ────────────────────────────────────────────────

    const totalRevenue = paymentDues.reduce(
      (sum, p) => sum + (p.paidAmount || 0),
      0
    );
    const pendingRevenue = paymentDues.reduce(
      (sum, p) => sum + (p.balanceAmount || 0),
      0
    );
    const fullyPaid = paymentDues.filter(
      (p) => p.paymentStatus === "FULLY_PAID"
    ).length;
    const partiallyPaid = paymentDues.filter(
      (p) => p.paymentStatus === "PARTIALLY_PAID"
    ).length;
    const notPaid = paymentDues.filter(
      (p) => p.paymentStatus === "NOT_PAID"
    ).length;

    // ── Delivery summary ───────────────────────────────────────────────

    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(
      (d) => d.deliveryStatus === "DELIVERED"
    ).length;
    const failedDeliveries = deliveries.filter(
      (d) => d.deliveryStatus === "NOT_DELIVERED"
    ).length;
    const cancelledDeliveries = deliveries.filter(
      (d) => d.deliveryStatus === "CANCELLED"
    ).length;
    const deliverySuccessRate =
      totalDeliveries > 0
        ? Math.round((successfulDeliveries / totalDeliveries) * 100)
        : 0;

    // ── Chart data ─────────────────────────────────────────────────────

    // Orders per bucket
    const ordersChart = Array(bucketCount).fill(0);
    orders.forEach((o) => {
      const idx = getBucketIndex(o.createdAt, period, from);
      if (idx < bucketCount) ordersChart[idx]++;
    });

    // Revenue per bucket (paidAmount from paymentDues)
    const revenueChart = Array(bucketCount).fill(0);
    paymentDues.forEach((p) => {
      const idx = getBucketIndex(p.createdAt, period, from);
      if (idx < bucketCount) revenueChart[idx] += p.paidAmount || 0;
    });

    // Deliveries per bucket
    const deliveriesChart = Array(bucketCount).fill(0);
    deliveries
      .filter((d) => d.deliveryStatus === "DELIVERED")
      .forEach((d) => {
        const idx = getBucketIndex(d.createdAt, period, from);
        if (idx < bucketCount) deliveriesChart[idx]++;
      });

    // ── Response ───────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      period,
      from,
      to,
      summary: {
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          totalValue: totalOrderValue,
        },
        revenue: {
          collected: totalRevenue,
          pending: pendingRevenue,
          fullyPaid,
          partiallyPaid,
          notPaid,
        },
        deliveries: {
          total: totalDeliveries,
          successful: successfulDeliveries,
          failed: failedDeliveries,
          cancelled: cancelledDeliveries,
          successRate: deliverySuccessRate,
        },
      },
      charts: {
        labels,
        orders: ordersChart,
        revenue: revenueChart,
        deliveries: deliveriesChart,
      },
    });
  } catch (error) {
    next(error);
  }
};