
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
router.use(allowRoles("ADMIN"));

router.get("/active", getActiveCustomers);

router.get("/", getAllCustomers);

router.get("/:id", getCustomerById);

router.post("/", createCustomer);

router.put("/:id", updateCustomer);

router.delete("/:id", deleteCustomer);

export default router;
