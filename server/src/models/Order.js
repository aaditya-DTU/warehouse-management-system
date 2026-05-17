
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", 
      required: [true, "Product is required"],
    },

    productName: {
      type: String,
      required: true,
      
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },

    lineAmount: {
      type: Number,
      required: true,
   
    },
  },
  { _id: true }, 
);


const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true, 
    },

    orderDate: {
      type: Date,
      default: Date.now, 
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    customerName: {
      type: String,
      required: true,
    },

    deliveryAddress: {
      type: String,
      required: [true, "Delivery address is required"],
      trim: true,
   
    },

    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required"],
    },

    remarks: {
      type: String,
      default: "", 
    },

    items: [orderItemSchema],


    orderAmount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
 
    },


    isDeleted: {
      type: Boolean,
      default: false,
    },

    isDelivered: {
      type: Boolean,
      default: false,
      
    },

isCancelled: {
  type: Boolean,
  default: false,
 
}
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
