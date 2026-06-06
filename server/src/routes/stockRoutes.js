import express from 'express';
import {
  getStockList,
  getProductStock,
  updateTotalQty,
  getAuditLogs
} from '../controllers/stockController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowRoles from '../middlewares/rbacMiddleware.js';

const router = express.Router();


router.use(authMiddleware);
// router.use(allowRoles('ADMIN'));


router.get('/',allowRoles('ADMIN', 'STAFF'), getStockList);

router.get('/audit',allowRoles('ADMIN'), getAuditLogs);

router.get('/:productId',allowRoles('ADMIN', 'STAFF'), getProductStock);

router.put('/:productId', allowRoles('ADMIN'), updateTotalQty);

export default router;