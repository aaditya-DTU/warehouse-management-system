
import express from "express";
import {
  getAllCustomers,
  getActiveCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customersController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import allowRoles from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Reads — ADMIN and STAFF (staff needs customer info while working orders/deliveries)
router.get("/active", allowRoles("ADMIN", "STAFF"), getActiveCustomers);
router.get("/", allowRoles("ADMIN", "STAFF"), getAllCustomers);
router.get("/:id", allowRoles("ADMIN", "STAFF"), getCustomerById);
 
// Writes — ADMIN only
router.post("/", allowRoles("ADMIN"), createCustomer);
router.put("/:id", allowRoles("ADMIN"), updateCustomer);
router.delete("/:id", allowRoles("ADMIN"), deleteCustomer);

export default router;
