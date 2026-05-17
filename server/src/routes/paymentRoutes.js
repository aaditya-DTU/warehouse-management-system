import express from 'express';
import {
  getAllPaymentDues,
  getPaymentDueById,
  getPaymentDueByOrderId,
  addPaymentEntry,
  downloadInvoice,
  blockEdit,
  blockDelete
} from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowRoles     from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', allowRoles('ADMIN', 'STAFF'), getAllPaymentDues);

router.get('/order/:orderId', allowRoles('ADMIN', 'STAFF'), getPaymentDueByOrderId);

router.get('/:id', allowRoles('ADMIN', 'STAFF'), getPaymentDueById);

router.post('/', allowRoles('ADMIN', 'STAFF'), addPaymentEntry);

router.get('/:id/invoice', allowRoles('ADMIN', 'STAFF'), downloadInvoice);

router.put('/:id',    allowRoles('ADMIN', 'STAFF'), blockEdit);
router.delete('/:id', allowRoles('ADMIN', 'STAFF'), blockDelete);

export default router;