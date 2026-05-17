
import mongoose from 'mongoose';

const paymentEntrySchema = new mongoose.Schema(
  {
    paymentDueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentDue',
      required: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },

    orderNo: {
      type: String,
      required: true
    },

    amountPaid: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0']
    },

    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI'],
      required: true
    },

    upiTxnId: {
      type: String,
      default: ''
    },

    paidAt: {
      type: Date,
      default: Date.now
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const PaymentEntry = mongoose.model('PaymentEntry', paymentEntrySchema);

export default PaymentEntry;