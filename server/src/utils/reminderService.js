import twilio from 'twilio';
import PaymentDue from '../models/PaymentDue.js';
import ReminderLog from '../models/ReminderLog.js';

const getClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured in .env');
  return twilio(sid, token);
};

const formatMessage = (due) => {
  const balance = Number(due.balanceAmount).toLocaleString('en-IN');
  const orderNo = due.orderNo;
  const name = due.customerName;
  return (
    `Dear ${name}, this is a payment reminder for order ${orderNo}. ` +
    `An amount of ₹${balance} is pending. ` +
    `Please arrange payment at your earliest convenience. Thank you.`
  );
};

const alreadySentToday = async (paymentDueId, channel) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const existing = await ReminderLog.findOne({
    paymentDueId,
    channel,
    sentAt: { $gte: start },
    status: 'SENT',
  });
  return !!existing;
};

export const sendReminder = async ({
  paymentDueId,
  channel = 'SMS',
  triggeredBy = 'CRON',
}) => {
  const due = await PaymentDue.findById(paymentDueId);
  if (!due) throw new Error('Payment due not found');
  if (due.paymentStatus === 'FULLY_PAID') {
    throw new Error('Order is already fully paid');
  }

  // Pull mobile from the due record (populated from delivery at creation time)
  // PaymentDue model has customerName — mobile comes from the customer via orderId
  const Order = (await import('../models/Order.js')).default;
  const Customer = (await import('../models/Customer.js')).default;

  const order = await Order.findById(due.orderId);
  if (!order) throw new Error('Order not found');

  const customer = await Customer.findById(order.customerId);
  if (!customer) throw new Error('Customer not found');

  const mobile = customer.mobileNumber?.replace(/\D/g, '');
  if (!mobile || mobile.length < 10) {
    throw new Error(`Invalid mobile number for customer ${due.customerName}`);
  }

  // Format to E.164 — assume Indian numbers if no country code
  const e164 = mobile.startsWith('91') && mobile.length === 12
    ? `+${mobile}`
    : mobile.length === 10
    ? `+91${mobile}`
    : `+${mobile}`;

  const alreadySent = await alreadySentToday(paymentDueId, channel);
  if (alreadySent) {
    throw new Error(`A ${channel} reminder was already sent today for this order`);
  }

  const messageBody = formatMessage(due);
  const client = getClient();

  let twilioSid = '';
  let status = 'SENT';
  let errorMessage = '';

  try {
    const from =
      channel === 'WHATSAPP'
        ? process.env.TWILIO_WHATSAPP_FROM
        : process.env.TWILIO_FROM_PHONE;

    const to =
      channel === 'WHATSAPP' ? `whatsapp:${e164}` : e164;

    const msg = await client.messages.create({
      body: messageBody,
      from,
      to,
    });

    twilioSid = msg.sid;
  } catch (err) {
    status = 'FAILED';
    errorMessage = err.message;
  }

  const log = await ReminderLog.create({
    paymentDueId: due._id,
    orderId: due.orderId,
    orderNo: due.orderNo,
    customerName: due.customerName,
    customerMobile: e164,
    channel,
    balanceAmount: due.balanceAmount,
    messageBody,
    status,
    twilioSid,
    errorMessage,
    sentAt: new Date(),
    triggeredBy,
  });

  if (status === 'FAILED') {
    throw new Error(`Twilio error: ${errorMessage}`);
  }

  return log;
};

// Called by cron — sends reminders for all overdue unpaid dues
export const runDailyReminders = async () => {
  const graceDays = parseInt(process.env.REMINDER_GRACE_DAYS || '3', 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - graceDays);
  cutoff.setHours(0, 0, 0, 0);

  const duesToRemind = await PaymentDue.find({
    paymentStatus: { $in: ['NOT_PAID', 'PARTIALLY_PAID'] },
    createdAt: { $lte: cutoff },
  });

  console.log(`[Reminders] Cron: found ${duesToRemind.length} dues to remind`);

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const due of duesToRemind) {
    try {
      await sendReminder({
        paymentDueId: due._id,
        channel: 'SMS',
        triggeredBy: 'CRON',
      });
      results.sent++;
    } catch (err) {
      if (err.message.includes('already sent today')) {
        results.skipped++;
      } else {
        results.failed++;
        console.error(`[Reminders] Failed for ${due.orderNo}: ${err.message}`);
      }
    }
  }

  console.log(`[Reminders] Done — sent: ${results.sent}, failed: ${results.failed}, skipped: ${results.skipped}`);
  return results;
};