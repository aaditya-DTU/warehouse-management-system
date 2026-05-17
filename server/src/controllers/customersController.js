

import Customer from "../models/Customer.js";

export const getAllCustomers = async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

   
    if (req.query.search) {
      filter.$or = [
        { customerName: { $regex: req.query.search, $options: "i" } },
        { mobileNumber: { $regex: req.query.search, $options: "i" } },
      ];
   
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find(
      { isActive: true, isDeleted: false },
      { customerName: 1, mobileNumber: 1, address: 1 },
    ).sort({ customerName: 1 });

    res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    next(error);
  }
};


export const createCustomer = async (req, res, next) => {
  try {
    const { customerName, mobileNumber, email, address, isActive } = req.body;

    
    if (!customerName || !mobileNumber || !address) {
      return res.status(400).json({
        success: false,
        message: "Customer name, mobile number and address are required",
      });
    }

    const existing = await Customer.findOne({
      mobileNumber,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A customer with this mobile number already exists",
      });
    }

    const customer = await Customer.create({
      customerName,
      mobileNumber,
      email: email || "",
      address,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { customerName, mobileNumber, email, address, isActive } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customerName) customer.customerName = customerName;
    if (mobileNumber) customer.mobileNumber = mobileNumber;
    if (email !== undefined) customer.email = email;
    if (address) customer.address = address;
    if (isActive !== undefined) customer.isActive = isActive;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.isDeleted = true;
    customer.isActive = false;
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
