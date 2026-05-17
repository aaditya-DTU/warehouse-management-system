import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from './config/db.js';
import User from './models/User.js';

await connectDB();


const existing = await User.findOne({ username: 'admin' });

if (existing) {
  console.log('  Admin user already exists. Deleting and recreating...');
  await User.deleteOne({ username: 'admin' });
}


const passwordHash = await bcrypt.hash('admin123', 10);

await User.create({
  username: 'admin',
  email: 'admin@wms.com',
  passwordHash: passwordHash,
  role: 'ADMIN',
  isActive: true,      
  isDeleted: false     
});

console.log(' Admin user created successfully');
console.log('   Username : admin');
console.log('   Password : admin123');
console.log('   Role     : ADMIN');
console.log('   isActive : true');


await mongoose.disconnect();
process.exit();