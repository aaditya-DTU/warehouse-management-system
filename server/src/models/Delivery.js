
import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },

    orderNo: {
      type: String,
      required: true
    },

    deliveryDate: {
      type: Date,
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

  
    customerMobile: {
      type: String,
      required: true
     
    },

    deliveryAddress: {
      type: String,
      required: true
    },

    
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'NOT_DELIVERED', 'CANCELLED'],
      default: 'PENDING'
    },

    reason: {
      type: String,
      default: ''
    },

    reasonText: {
      type: String,
      default: ''
    },

    deliveredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Delivery = mongoose.model('Delivery', deliverySchema);

export default Delivery;