
import PaymentDue from '../models/PaymentDue.js';
import PaymentEntry from '../models/PaymentEntry.js';
import Order  from '../models/Order.js';
import { generateInvoicePDF } from '../utils/invoiceService.js';


export const getAllPaymentDues = async (req, res, next) => {
  try {

    const filter = {};

   
    if (req.user.role === 'STAFF') {
      filter.ownerStaffUserId = req.user.userId;
    }

    if (req.query.status) {
      filter.paymentStatus = req.query.status;
    }

    const paymentDues = await PaymentDue.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: paymentDues.length,
      paymentDues
    });

  } catch (error) {
    next(error);
  }
};


export const getPaymentDueById = async (req, res, next) => {
  try {

    const filter = { _id: req.params.id };

    if (req.user.role === 'STAFF') {
      filter.ownerStaffUserId = req.user.userId;
    }

    const paymentDue = await PaymentDue.findOne(filter);

    if (!paymentDue) {
      return res.status(404).json({
        success: false,
        message: 'Payment Due not found'
      });
    }

    const entries = await PaymentEntry.find({
      paymentDueId: paymentDue._id
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      paymentDue,
      entries
    });

  } catch (error) {
    next(error);
  }
};


export const getPaymentDueByOrderId = async (req, res, next) => {
  try {

    const filter = { orderId: req.params.orderId };

    if (req.user.role === 'STAFF') {
      filter.ownerStaffUserId = req.user.userId;
    }

    const paymentDue = await PaymentDue.findOne(filter);

    if (!paymentDue) {
      return res.status(404).json({
        success: false,
        message: 'No Payment Due found for this order'
      });
    }

    const entries = await PaymentEntry.find({
      paymentDueId: paymentDue._id
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      paymentDue,
      entries
    });

  } catch (error) {
    next(error);
  }
};


export const addPaymentEntry = async (req, res, next) => {
  try {

    const { paymentDueId, amountPaid, paymentMode, upiTxnId } = req.body;


    if (!paymentDueId || !amountPaid || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Payment Due ID, amount and payment mode are required'
      });
    }

    if (amountPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (!['CASH', 'UPI'].includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode must be CASH or UPI'
      });
    }

    if (paymentMode === 'UPI' && !upiTxnId) {
      return res.status(400).json({
        success: false,
        message: 'UPI Transaction ID is required for UPI payments'
      });
    }


    const filter = { _id: paymentDueId };

    if (req.user.role === 'STAFF') {
      filter.ownerStaffUserId = req.user.userId;
    }

    const paymentDue = await PaymentDue.findOne(filter);

    if (!paymentDue) {
      return res.status(404).json({
        success: false,
        message: 'Payment Due not found'
      });
    }


    if (paymentDue.paymentStatus === 'FULLY_PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order is already fully paid'
      });
    }


    if (amountPaid > paymentDue.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds balance. Remaining balance is ${paymentDue.balanceAmount}`
      });
    }


    const entry = await PaymentEntry.create({
      paymentDueId:    paymentDue._id,
      orderId:         paymentDue.orderId,
      orderNo:         paymentDue.orderNo,
      amountPaid,
      paymentMode,
      upiTxnId:        upiTxnId || '',
      paidAt:          new Date(),
      createdByUserId: req.user.userId
    });


    const newPaidAmount    = paymentDue.paidAmount + amountPaid;
    const newBalanceAmount = paymentDue.orderTotalAmount - newPaidAmount;

    let newStatus;
    if (newPaidAmount <= 0) {
      newStatus = 'NOT_PAID';
    } else if (newPaidAmount < paymentDue.orderTotalAmount) {
      newStatus = 'PARTIALLY_PAID';
    } else {
      newStatus = 'FULLY_PAID';
    }

    paymentDue.paidAmount    = newPaidAmount;
    paymentDue.balanceAmount = newBalanceAmount;
    paymentDue.paymentStatus = newStatus;
    await paymentDue.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      entry,
      paymentDue: {
        paidAmount:    paymentDue.paidAmount,
        balanceAmount: paymentDue.balanceAmount,
        paymentStatus: paymentDue.paymentStatus
      }
    });

  } catch (error) {
    next(error);
  }
};


export const downloadInvoice = async (req, res, next) => {
  try {

    const filter = { _id: req.params.id };

    if (req.user.role === 'STAFF') {
      filter.ownerStaffUserId = req.user.userId;
    }

    const paymentDue = await PaymentDue.findOne(filter);

    if (!paymentDue) {
      return res.status(404).json({
        success: false,
        message: 'Payment Due not found'
      });
    }

    if (paymentDue.paymentStatus !== 'FULLY_PAID') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is available only after full payment is received'
      });
    }

    const entries = await PaymentEntry.find({
      paymentDueId: paymentDue._id
    }).sort({ createdAt: 1 });

    const order = await Order.findById(paymentDue.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    generateInvoicePDF(paymentDue, entries, order, res);

  } catch (error) {
    next(error);
  }
};


export const blockEdit = (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Payment entries cannot be edited'
  });
};

export const blockDelete = (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Payment entries cannot be deleted'
  });
};