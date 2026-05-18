import express from "express";
import { getReport } from "../controllers/reportsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import allowRoles from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles("ADMIN"));

router.get("/", getReport);

export default router;