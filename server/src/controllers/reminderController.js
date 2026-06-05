import ReminderLog from '../models/ReminderLog.js';
import PaymentDue from '../models/PaymentDue.js';
import { sendReminder, runDailyReminders } from '../utils/reminderService.js';

// GET /api/reminders — full log with optional filters
export const getReminderLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.orderId) filter.orderId = req.query.orderId;

    const logs = await ReminderLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

// POST /api/reminders/send — manual send for one payment due
export const sendManualReminder = async (req, res, next) => {
  try {
    const { paymentDueId, channel = 'SMS' } = req.body;

    if (!paymentDueId) {
      return res.status(400).json({
        success: false,
        message: 'paymentDueId is required',
      });
    }

    if (!['SMS', 'WHATSAPP'].includes(channel)) {
      return res.status(400).json({
        success: false,
        message: 'channel must be SMS or WHATSAPP',
      });
    }

    const log = await sendReminder({
      paymentDueId,
      channel,
      triggeredBy: 'MANUAL',
    });

    res.status(201).json({
      success: true,
      message: `${channel} reminder sent successfully`,
      log,
    });
  } catch (error) {
    // Return a clean error — don't leak Twilio internals
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/reminders/run-cron — manually trigger the full daily batch (admin)
export const triggerCronManually = async (req, res, next) => {
  try {
    const results = await runDailyReminders();
    res.status(200).json({
      success: true,
      message: 'Daily reminder batch completed',
      results,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reminders/stats — summary counts for dashboard
export const getReminderStats = async (req, res, next) => {
  try {
    const [totalSent, totalFailed, sentToday, pendingDues] = await Promise.all([
      ReminderLog.countDocuments({ status: 'SENT' }),
      ReminderLog.countDocuments({ status: 'FAILED' }),
      ReminderLog.countDocuments({
        status: 'SENT',
        sentAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      PaymentDue.countDocuments({
        paymentStatus: { $in: ['NOT_PAID', 'PARTIALLY_PAID'] },
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: { totalSent, totalFailed, sentToday, pendingDues },
    });
  } catch (error) {
    next(error);
  }
};