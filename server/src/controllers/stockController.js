
import Product from "../models/Product.js";
import StockAuditLog from "../models/StockAuditLog.js";
import { getReservedQty } from "../utils/reservationService.js";

export const getStockList = async (req, res, next) => {
  try {

    const products = await Product.find({ isDeleted: false }).sort({
      productName: 1,
    });

  
    const stockList = await Promise.all(
      products.map(async (product) => {
        const reservedQty = await getReservedQty(product._id);
        const availableQty = product.totalQty - reservedQty;

        return {
          productId: product._id,
          productName: product.productName,
          unit: product.unit,
          totalQty: product.totalQty,
          reservedQty,
          availableQty,
          isActive: product.isActive,
          lastModified: product.updatedAt,
        };
      }),
    );

    res.status(200).json({
      success: true,
      stockList,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductStock = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reservedQty = await getReservedQty(product._id);
    const availableQty = product.totalQty - reservedQty;

    res.status(200).json({
      success: true,
      stock: {
        productId: product._id,
        productName: product.productName,
        unit: product.unit,
        totalQty: product.totalQty,
        reservedQty,
        availableQty,
        lastModified: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTotalQty = async (req, res, next) => {
  try {
    const { totalQty } = req.body;

 

    if (totalQty === undefined || totalQty === null) {
      return res.status(400).json({
        success: false,
        message: "Total Qty is required",
      });
    }

    if (typeof totalQty !== "number" || isNaN(totalQty)) {
      return res.status(400).json({
        success: false,
        message: "Total Qty must be a number",
      });
    }

    if (totalQty < 0) {
      return res.status(400).json({
        success: false,
        message: "Total Qty cannot be negative",
      });
    }


    const product = await Product.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }


    const reservedQty = await getReservedQty(product._id);

    if (totalQty < reservedQty) {
      return res.status(400).json({
        success: false,
        message: `Cannot set Total Qty to ${totalQty}. Reserved Qty is ${reservedQty}. Total Qty must be at least ${reservedQty}.`,
      });
    }

    const oldTotalQty = product.totalQty;

    product.totalQty = totalQty;
    await product.save();

    await StockAuditLog.create({
      productId: product._id,
      productName: product.productName,
      oldTotalQty,
      newTotalQty: totalQty,
      changedByUserId: req.user.userId,
      changedByUsername: req.user.username || "Admin",
      changedAt: new Date(),
    });


    const availableQty = totalQty - reservedQty;

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      stock: {
        productId: product._id,
        productName: product.productName,
        totalQty: product.totalQty,
        reservedQty,
        availableQty,
        lastModified: product.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getAuditLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.productId) {
      filter.productId = req.query.productId;
    }

    const logs = await StockAuditLog.find(filter)
      .sort({ changedAt: -1 }) 
      .limit(200); 

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
