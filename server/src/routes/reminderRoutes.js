import express from 'express';
import {
  getReminderLogs,
  sendManualReminder,
  triggerCronManually,
  getReminderStats,
} from '../controllers/reminderController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowRoles from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles('ADMIN'));

router.get('/stats', getReminderStats);
router.get('/', getReminderLogs);
router.post('/send', sendManualReminder);
router.post('/run-cron', triggerCronManually);

export default router;