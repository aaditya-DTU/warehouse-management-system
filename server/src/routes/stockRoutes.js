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

// Reads — ADMIN and STAFF can view stock levels
router.get('/', allowRoles('ADMIN', 'STAFF'), getStockList);
 
// Audit trail — ADMIN only (internal change history)
// Must stay ABOVE '/:productId' or Express will treat "audit" as a productId.
router.get('/audit', allowRoles('ADMIN'), getAuditLogs);
 
router.get('/:productId', allowRoles('ADMIN', 'STAFF'), getProductStock);
 
// Writes — ADMIN only
router.put('/:productId', allowRoles('ADMIN'), updateTotalQty);

export default router;