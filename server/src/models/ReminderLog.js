import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema(
  {
    paymentDueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentDue',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderNo: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMobile: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['SMS', 'WHATSAPP'],
      required: true,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    messageBody: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED'],
      required: true,
    },
    twilioSid: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    triggeredBy: {
      type: String,
      enum: ['CRON', 'MANUAL'],
      default: 'CRON',
    },
  },
  { timestamps: true }
);

const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);
export default ReminderLog;