
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true         
    },

    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true
     
    },

    defaultRate: {
      type: Number,
      required: [true, 'Default rate is required'],
      min: [0, 'Rate cannot be negative']
    
    },

    isActive: {
      type: Boolean,
      default: true
   
    },

    totalQty: {
      type: Number,
      default: 0,
      min: [0, 'Total quantity cannot be negative']
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

const Product = mongoose.model('Product', productSchema);

export default Product;