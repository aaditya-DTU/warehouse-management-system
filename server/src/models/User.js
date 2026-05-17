

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,         
      trim: true            
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,      
      trim: true
    },

    
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },

    role: {
      type: String,
      enum: ['ADMIN', 'STAFF'],   
      required: [true, 'Role is required']
    },

    isActive: {
      type: Boolean,
      default: true             
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

const User = mongoose.model('User', userSchema);

export default User;