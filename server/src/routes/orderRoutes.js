import express from "express";
import {
  getAllOrders,
  getPendingDeliveries,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getStockSummaryForOrder,
} from "../controllers/ordersController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import allowRoles from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/pending-deliveries",
  allowRoles("ADMIN", "STAFF"),
  getPendingDeliveries,
);
 
router.get("/stock-summary", allowRoles("ADMIN"), getStockSummaryForOrder);
 
// STAFF needs read access here too — App.jsx's global `orders` state (used by
// DeliveriesPage's pending-order dropdown) is populated from this endpoint.
router.get("/", allowRoles("ADMIN", "STAFF"), getAllOrders);
 
router.get("/:id", allowRoles("ADMIN", "STAFF"), getOrderById);
 
router.post("/", allowRoles("ADMIN"), createOrder);
 
router.put("/:id", allowRoles("ADMIN"), updateOrder);
 
router.delete("/:id", allowRoles("ADMIN"), deleteOrder);

export default router;
