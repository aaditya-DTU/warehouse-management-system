
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { getReservedQty } from '../utils/reservationService.js';



const generateOrderNo = async () => {

  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;


  const count = await Order.countDocuments({
    orderNo: { $regex: `^SO-${datePart}-` }
  });

  const sequence = String(count + 1).padStart(3, '0');

  return `SO-${datePart}-${sequence}`;
};


const calculateAmounts = (items) => {
  return items.map(item => ({
    ...item,
    lineAmount: item.quantity * item.rate
  }));
};



export const getAllOrders = async (req, res, next) => {
  try {

    const filter = { isDeleted: false };

    if (req.query.search) {
      filter.orderNo = { $regex: req.query.search, $options: 'i' };
    }


    if (req.query.deliveryDate) {
      const date = new Date(req.query.deliveryDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.deliveryDate = { $gte: date, $lt: nextDay };
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'customerName mobileNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    next(error);
  }
};



export const getPendingDeliveries = async (req, res, next) => {
  try {

    const orders = await Order.find({
      isActive: true,
      isDeleted: false,
      isDelivered: false
    })
      .populate('customerId', 'customerName mobileNumber address')
      .sort({ deliveryDate: 1 });
   

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    next(error);
  }
};


export const getOrderById = async (req, res, next) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('customerId', 'customerName mobileNumber address');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    next(error);
  }
};


export const createOrder = async (req, res, next) => {
  try {

    const {
      customerId,
      deliveryAddress,
      deliveryDate,
      remarks,
      items,
      isActive
    } = req.body;


    if (!customerId || !deliveryAddress || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Customer, delivery address and delivery date are required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      isActive: true,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or inactive'
      });
    }

  

    const validatedItems = [];

    for (const item of items) {


      if (!item.productId || !item.quantity || item.rate === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have productId, quantity and rate'
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be greater than 0'
        });
      }

      if (item.rate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Item rate cannot be negative'
        });
      }

      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
        isDeleted: false
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found or inactive`
        });
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.productName, 
        quantity: item.quantity,
        rate: item.rate,
        lineAmount: item.quantity * item.rate  
      });
    }

    for (const item of validatedItems) {
      const product = await Product.findById(item.productId);
      const reservedQty = await getReservedQty(item.productId);
      const availableQty = product.totalQty - reservedQty;

      if (item.quantity > availableQty) {
      
        console.warn(
          `Warning: ${product.productName} - ordered ${item.quantity}, available ${availableQty}`
        );
      }
    }

    

    const orderAmount = validatedItems.reduce(
      (total, item) => total + item.lineAmount, 0
    );


    const orderNo = await generateOrderNo();

 

    const order = await Order.create({
      orderNo,
      customerId,
      customerName: customer.customerName,
      deliveryAddress,
      deliveryDate,
      remarks: remarks || '',
      items: validatedItems,
      orderAmount,
      isActive: isActive !== undefined ? isActive : true,
      isDelivered: false
    });


    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    next(error);
  }
};



export const updateOrder = async (req, res, next) => {
  try {

    const {
      deliveryAddress,
      deliveryDate,
      remarks,
      items,
      isActive
    } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    if (order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a delivered order'
      });
    }


    if (deliveryAddress) order.deliveryAddress = deliveryAddress;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (remarks !== undefined) order.remarks = remarks;
    if (isActive !== undefined) order.isActive = isActive;

    if (items && items.length > 0) {

      const validatedItems = [];

      for (const item of items) {

        if (!item.productId || !item.quantity || item.rate === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have productId, quantity and rate'
          });
        }

        const product = await Product.findOne({
          _id: item.productId,
          isActive: true,
          isDeleted: false
        });

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found or inactive'
          });
        }

        validatedItems.push({
          productId: item.productId,
          productName: product.productName,
          quantity: item.quantity,
          rate: item.rate,
          lineAmount: item.quantity * item.rate
        });
      }

      order.items = validatedItems;

      order.orderAmount = validatedItems.reduce(
        (total, item) => total + item.lineAmount, 0
      );
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

 
    if (order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a delivered order'
      });
    }

  
    order.isDeleted = true;
    order.isActive = false;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};


export const getStockSummaryForOrder = async (req, res, next) => {
  try {

    const products = await Product.find({ isActive: true, isDeleted: false });

    const stockSummary = await Promise.all(
      products.map(async (product) => {
        const reservedQty = await getReservedQty(product._id);
        const availableQty = product.totalQty - reservedQty;

        return {
          productId: product._id,
          productName: product.productName,
          unit: product.unit,
          totalQty: product.totalQty,
          reservedQty,
          availableQty
        };
      })
    );

    res.status(200).json({
      success: true,
      stockSummary
    });

  } catch (error) {
    next(error);
  }
};