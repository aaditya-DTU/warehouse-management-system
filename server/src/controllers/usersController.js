
import bcrypt from 'bcrypt';
import User from '../models/User.js';


export const getAllUsers = async (req, res, next) => {
  try {

    const users = await User.find({ isDeleted: false }).select('-passwordHash');

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    next(error);
  }
};



export const getUserById = async (req, res, next) => {
  try {

    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false
    }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
};



export const createUser = async (req, res, next) => {
  try {

    const { username, email, password, role, isActive } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password and role are required'
      });
    }

    if (!['ADMIN', 'STAFF'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be ADMIN or STAFF'
      });
    }

 
    const existingUsername = await User.findOne({ username, isDeleted: false });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const existingEmail = await User.findOne({ email, isDeleted: false });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash,
      role,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    next(error);
  }
};



export const updateUser = async (req, res, next) => {
  try {

    const { username, email, password, role, isActive } = req.body;

    const user = await User.findOne({ _id: req.params.id, isDeleted: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;


    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    next(error);
  }
};



export const deleteUser = async (req, res, next) => {
  try {

    const user = await User.findOne({ _id: req.params.id, isDeleted: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

  
    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};