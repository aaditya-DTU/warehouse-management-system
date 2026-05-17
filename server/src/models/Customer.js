
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true, 
      default: "", 
    },


    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,

    },

    
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
