import express from 'express';
import {
  getAllDeliveries,
  getDeliveryById,
  updateDelivery,
  deleteDelivery
} from '../controllers/deliveryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowRoles from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'STAFF'), getAllDeliveries);

router.get('/:id', allowRoles('ADMIN', 'STAFF'), getDeliveryById);

router.post('/', allowRoles('ADMIN', 'STAFF'), updateDelivery);

router.delete('/:id', allowRoles('ADMIN'), deleteDelivery);

export default router;