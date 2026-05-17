import mongoose from 'mongoose';

const paymentDueSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true    
    },

    orderNo: {
      type: String,
      required: true
    },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    orderTotalAmount: {
      type: Number,
      required: true
    },

    paidAmount: {
      type: Number,
      default: 0
    },


    balanceAmount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ['NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID'],
      default: 'NOT_PAID'
    },

    ownerStaffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const PaymentDue = mongoose.model('PaymentDue', paymentDueSchema);

export default PaymentDue;
