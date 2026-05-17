
import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (paymentDue, paymentEntries, order, res) => {

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Invoice-${paymentDue.orderNo}.pdf`
  );

  doc.pipe(res);


  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('INVOICE', { align: 'center' });

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('Warehouse Management System', { align: 'center' });

  doc.moveDown(1);


  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(1);


  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Order Details', { underline: true });

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Order No      :  ${paymentDue.orderNo}`)
    .text(`Customer      :  ${paymentDue.customerName}`)
    .text(`Order Date    :  ${new Date(order.orderDate).toLocaleDateString('en-IN')}`)
    .text(`Delivery Date :  ${new Date(order.deliveryDate).toLocaleDateString('en-IN')}`);

  doc.moveDown(1);


  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Items Ordered', { underline: true });

  doc.moveDown(0.5);


  const tableTop  = doc.y;
  const col1 = 50;   
  const col2 = 260;  
  const col3 = 340;  
  const col4 = 430;  

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Product',      col1, tableTop)
    .text('Qty',          col2, tableTop)
    .text('Rate (INR)',   col3, tableTop)
    .text('Amount (INR)', col4, tableTop);

  doc.moveDown(0.3);

  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(10);

  order.items.forEach((item) => {
    const rowY = doc.y;
    doc
      .text(item.productName,              col1, rowY, { width: 200 })
      .text(String(item.quantity),         col2, rowY)
      .text(`${item.rate.toLocaleString('en-IN')}`,       col3, rowY)
      .text(`${item.lineAmount.toLocaleString('en-IN')}`, col4, rowY);
    doc.moveDown(0.5);
  });

  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(0.5);

  doc
    .font('Helvetica-Bold')
    .text(
      `Order Total :  INR ${paymentDue.orderTotalAmount.toLocaleString('en-IN')}`,
      { align: 'right' }
    );

  doc.moveDown(1);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Payment Summary', { underline: true });

  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  paymentEntries.forEach((entry, index) => {
    doc.text(
      `Payment ${index + 1}  :  INR ${entry.amountPaid.toLocaleString('en-IN')}` +
      `  |  ${entry.paymentMode}` +
      `${entry.upiTxnId ? '  |  UPI: ' + entry.upiTxnId : ''}` +
      `  |  ${new Date(entry.paidAt).toLocaleDateString('en-IN')}`
    );
    doc.moveDown(0.3);
  });

  doc.moveDown(0.5);

  doc
    .font('Helvetica-Bold')
    .text(`Total Paid    :  INR ${paymentDue.paidAmount.toLocaleString('en-IN')}`)
    .text(`Balance       :  INR ${paymentDue.balanceAmount.toLocaleString('en-IN')}`)
    .text(`Status        :  ${paymentDue.paymentStatus}`);

  doc.moveDown(1);


  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(0.5);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('grey')
    .text(
      'This is a system-generated invoice. No signature required.',
      { align: 'center' }
    );

  
  doc.end();
};