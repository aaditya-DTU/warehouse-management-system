
import mongoose from 'mongoose';
import Order from '../models/Order.js';

export const getReservedQty = async (productId) => {

  const result = await Order.aggregate([
    {
     
      $match: {
        isActive: true,
        isDeleted: false,
        isDelivered: false
      }
    },
    {

      $unwind: '$items'
    },
    {
     
      $match: {
        'items.productId': new mongoose.Types.ObjectId(productId)
      }
    },
    {
      $group: {
        _id: null,
        totalReserved: { $sum: '$items.quantity' }
      }
    }
  ]);


  return result.length > 0 ? result[0].totalReserved : 0;
};



export const getReservedQtyForProducts = async (productIds) => {

  const result = await Order.aggregate([
    {
      $match: {
        isActive: true,
        isDeleted: false,
        isDelivered: false
      }
    },
    {
      $unwind: '$items'
    },
    {
    
      $match: {
        'items.productId': {
          $in: productIds.map(id => new mongoose.Types.ObjectId(id))
        }
      }
    },
    {
     
      $group: {
        _id: '$items.productId',
        totalReserved: { $sum: '$items.quantity' }
      }
    }
  ]);


  const reservedMap = {};
  result.forEach(item => {
    reservedMap[item._id.toString()] = item.totalReserved;
  });

  return reservedMap;
};


export const getAvailableQty = async (product) => {
  const reservedQty = await getReservedQty(product._id);
  return product.totalQty - reservedQty;
};