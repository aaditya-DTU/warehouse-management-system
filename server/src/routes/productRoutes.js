
import express from "express";
import {
  getAllProducts,
  getActiveProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import allowRoles from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
// router.use(allowRoles("ADMIN"));

router.get("/active",allowRoles('ADMIN', 'STAFF'), getActiveProducts);

router.get("/",allowRoles('ADMIN', 'STAFF'), getAllProducts);

router.get("/:id",allowRoles('ADMIN', 'STAFF'), getProductById);

router.post("/",allowRoles('ADMIN'), createProduct);

router.put("/:id",allowRoles('ADMIN'), updateProduct);

router.delete("/:id",allowRoles('ADMIN'), deleteProduct);

export default router;
