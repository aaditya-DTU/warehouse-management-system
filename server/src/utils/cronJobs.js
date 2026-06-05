import cron from 'node-cron';
import { runDailyReminders } from './reminderService.js';

export const initCronJobs = () => {
  const hour = process.env.REMINDER_CRON_HOUR || '9';

  // Runs every day at configured hour (default 9 AM)
  cron.schedule(`0 ${hour} * * *`, async () => {
    console.log('[Cron] Starting daily payment reminders...');
    try {
      await runDailyReminders();
    } catch (err) {
      console.error('[Cron] Reminder job crashed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log(`[Cron] Payment reminder job scheduled at ${hour}:00 IST daily`);
};