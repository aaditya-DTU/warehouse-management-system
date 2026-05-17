
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
router.use(allowRoles('ADMIN'));


router.get('/', getStockList);

router.get('/audit', getAuditLogs);

router.get('/:productId', getProductStock);

router.put('/:productId', updateTotalQty);

export default router;