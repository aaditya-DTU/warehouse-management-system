// deliveryController.js
// Updates:
// 1. customerMobile now included in all delivery records
// 2. CANCELLED status — closes order, frees reservation, no stock/payment effects

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Delivery from "../models/Delivery.js";
import PaymentDue from "../models/PaymentDue.js";

// ── Get All Deliveries ─────────────────────────────────────────────────────
export const getAllDeliveries = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    if (req.user.role === "STAFF") {
      filter.deliveredByUserId = req.user.userId;
    }

    if (req.query.status) {
      filter.deliveryStatus = req.query.status;
    }

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.deliveryDate = { $gte: date, $lt: nextDay };
    }

    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Single Delivery ────────────────────────────────────────────────────
export const getDeliveryById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, isDeleted: false };

    if (req.user.role === "STAFF") {
      filter.deliveredByUserId = req.user.userId;
    }

    const delivery = await Delivery.findOne(filter);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    res.status(200).json({
      success: true,
      delivery,
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Delivery ────────────────────────────────────────────────────────
// Handles all three outcomes: NOT_DELIVERED, DELIVERED, CANCELLED
export const updateDelivery = async (req, res, next) => {
  try {
    const { orderId, deliveryDate, deliveryStatus, reason, reasonText } =
      req.body;

    // ── Step 1: Basic validation ───────────────────────────────────────

    if (!orderId || !deliveryDate || !deliveryStatus) {
      return res.status(400).json({
        success: false,
        message: "Order, delivery date and delivery status are required",
      });
    }

    if (!["DELIVERED", "NOT_DELIVERED", "CANCELLED"].includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be DELIVERED, NOT_DELIVERED or CANCELLED",
      });
    }

    // ── Step 2: Reason validation for NOT_DELIVERED ────────────────────

    if (deliveryStatus === "NOT_DELIVERED") {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason is required when delivery is not completed",
        });
      }
      if (reason === "Other" && !reasonText) {
        return res.status(400).json({
          success: false,
          message: "Please describe the reason in Reason Text",
        });
      }
    }

    // ── Step 3: Fetch the order ────────────────────────────────────────

    const order = await Order.findOne({
      _id: orderId,
      isActive: true,
      isDeleted: false,
      isDelivered: false,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found, already delivered, or already cancelled",
      });
    }

    // ── Step 4: Fetch customer to get mobile number ────────────────────
    // CHANGE 1: We now fetch customer to get mobile number
    const customer = await Customer.findById(order.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ── Step 5: Check for existing delivery record ─────────────────────

    let delivery = await Delivery.findOne({ orderId, isDeleted: false });

    // ══════════════════════════════════════════════════════════════════
    // PATH A — NOT_DELIVERED
    // Just records the failed attempt. Nothing else changes.
    // ══════════════════════════════════════════════════════════════════

    if (deliveryStatus === "NOT_DELIVERED") {
      if (delivery) {
        delivery.deliveryDate = deliveryDate;
        delivery.deliveryStatus = "NOT_DELIVERED";
        delivery.reason = reason;
        delivery.reasonText = reasonText || "";
        delivery.deliveredByUserId = req.user.userId;
        // customerMobile already stored — no need to update
        await delivery.save();
      } else {
        delivery = await Delivery.create({
          orderId,
          orderNo: order.orderNo,
          deliveryDate,
          customerId: customer._id,
          customerName: order.customerName,
          customerMobile: customer.mobileNumber, // CHANGE 1
          deliveryAddress: order.deliveryAddress,
          deliveryStatus: "NOT_DELIVERED",
          reason,
          reasonText: reasonText || "",
          deliveredByUserId: req.user.userId,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Delivery recorded as Not Delivered",
        delivery,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // PATH B — CANCELLED
    // CHANGE 2: New cancellation path
    // Customer refused delivery — order fully closed
    // No stock reduction. No Payment Due. Reserved Qty freed.
    // ══════════════════════════════════════════════════════════════════

    if (deliveryStatus === "CANCELLED") {
      // Create or update delivery record as CANCELLED
      if (delivery) {
        delivery.deliveryDate = deliveryDate;
        delivery.deliveryStatus = "CANCELLED";
        delivery.reason = reason || "Customer refused delivery";
        delivery.reasonText = reasonText || "";
        delivery.deliveredByUserId = req.user.userId;
        await delivery.save();
      } else {
        delivery = await Delivery.create({
          orderId,
          orderNo: order.orderNo,
          deliveryDate,
          customerId: customer._id,
          customerName: order.customerName,
          customerMobile: customer.mobileNumber, // CHANGE 1
          deliveryAddress: order.deliveryAddress,
          deliveryStatus: "CANCELLED",
          reason: reason || "Customer refused delivery",
          reasonText: reasonText || "",
          deliveredByUserId: req.user.userId,
        });
      }

      // Close the order permanently
      // isActive = false → order no longer contributes to Reserved Qty
      // isDelivered stays false — this was not delivered
      // A new field isCancelled = true marks it as permanently closed
      order.isActive = false;
      order.isCancelled = true;
      await order.save();

      // No stock reduction
      // No Payment Due creation
      // Reserved Qty automatically freed because order isActive is now false
      // reservationService only counts orders where isActive: true

      return res.status(200).json({
        success: true,
        message:
          "Delivery cancelled. Order closed. Reserved stock freed. No payment due created.",
        delivery,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // PATH C — DELIVERED
    // Stock reduces. Order marked delivered. Payment Due created.
    // ══════════════════════════════════════════════════════════════════

    // Stock check first — check all before reducing any
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for item ${item.productName}`,
        });
      }

      if (product.totalQty - item.quantity < 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${product.totalQty}, Required: ${item.quantity}`,
        });
      }
    }

    // All products passed — now reduce stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      product.totalQty -= item.quantity;
      await product.save();
    }

    // Mark order as delivered
    order.isDelivered = true;
    await order.save();

    // Create or update delivery record
    if (delivery) {
      delivery.deliveryDate = deliveryDate;
      delivery.deliveryStatus = "DELIVERED";
      delivery.reason = "";
      delivery.reasonText = "";
      delivery.deliveredByUserId = req.user.userId;
      await delivery.save();
    } else {
      delivery = await Delivery.create({
        orderId,
        orderNo: order.orderNo,
        deliveryDate,
        customerId: customer._id,
        customerName: order.customerName,
        customerMobile: customer.mobileNumber, // CHANGE 1
        deliveryAddress: order.deliveryAddress,
        deliveryStatus: "DELIVERED",
        deliveredByUserId: req.user.userId,
      });
    }

    // Auto-create Payment Due
    const paymentDue = await PaymentDue.create({
      orderId: order._id,
      orderNo: order.orderNo,
      deliveryId: delivery._id,
      customerId: customer._id,
      customerName: order.customerName,
      orderTotalAmount: order.orderAmount,
      paidAmount: 0,
      balanceAmount: order.orderAmount,
      paymentStatus: "NOT_PAID",
      ownerStaffUserId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Delivery marked as Delivered. Stock reduced. Payment Due created.",
      delivery,
      paymentDue: {
        id: paymentDue._id,
        orderNo: paymentDue.orderNo,
        orderTotalAmount: paymentDue.orderTotalAmount,
        paymentStatus: paymentDue.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Soft Delete Delivery (Admin only) ──────────────────────────────────────
export const deleteDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Delivery not found",
      });
    }

    delivery.isDeleted = true;
    await delivery.save();

    res.status(200).json({
      success: true,
      message: "Delivery record deleted",
    });
  } catch (error) {
    next(error);
  }
};
