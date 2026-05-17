
import mongoose from "mongoose";

const stockAuditLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

   
    productName: {
      type: String,
      required: true,
    },


    oldTotalQty: {
      type: Number,
      required: true,
    },

 
    newTotalQty: {
      type: Number,
      required: true,
    },


    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    
    changedByUsername: {
      type: String,
      required: true,
    },

 
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const StockAuditLog = mongoose.model("StockAuditLog", stockAuditLogSchema);

export default StockAuditLog;
