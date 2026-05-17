import { useState } from "react";

export default function Deliveries({
  orders,
  products,
  deliveries,
  setDeliveries,
  setProducts,
  paymentDues,
  setPaymentDues,
  onViewPayment,
}) {
  // =========================
  // STATE
  // =========================
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [reason, setReason] = useState("");

  // =========================
  // ONLY PENDING ORDERS
  // =========================
  const pendingOrders = orders.filter((order) => {
    const delivered = deliveries.find(
      (d) => d.orderId === order.id && d.status === "DELIVERED"
    );
    return !delivered;
  });

  // selected order object
  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  );

  // check if already delivered (for View Payment button)
  const isDelivered = deliveries.find(
    (d) => d.orderId === selectedOrderId && d.status === "DELIVERED"
  );

  // =========================
  // SAVE DELIVERY
  // =========================
  const handleUpdateDelivery = () => {
    if (!selectedOrderId) {
      alert("Select order");
      return;
    }

    if (!deliveryStatus) {
      alert("Select delivery status");
      return;
    }

    // reason required
    if (
      (deliveryStatus === "PENDING" ||
        deliveryStatus === "NOT_DELIVERED") &&
      !reason
    ) {
      alert("Select reason");
      return;
    }

    // =========================
    // IF DELIVERED → STOCK MOVE
    // =========================
    if (deliveryStatus === "DELIVERED") {
      // check stock first
      for (let item of selectedOrder.items) {
        const product = products.find(
          (p) => p.id === item.productId
        );

        if (product.availableQty < item.quantity) {
          alert(`Not enough stock for ${product.name}`);
          return;
        }
      }

      // reduce stock
      const updatedProducts = products.map((product) => {
        const item = selectedOrder.items.find(
          (i) => i.productId === product.id
        );

        if (!item) return product;

        const newTotal = product.totalQty - item.quantity;
        const newReserved = product.reservedQty - item.quantity;
        const newAvailable = newTotal - newReserved;

        return {
          ...product,
          totalQty: newTotal,
          reservedQty: newReserved,
          availableQty: newAvailable,
        };
      });

      setProducts(updatedProducts);

      // create payment due (only once)
      const exists = paymentDues.find(
        (p) => p.orderId === selectedOrder.id
      );

      if (!exists) {
        const newPaymentDue = {
          id: selectedOrder.id,
          orderId: selectedOrder.id,
          customerName: selectedOrder.customerName,
          orderAmount: selectedOrder.orderAmount,
          paidAmount: 0,
          balanceAmount: selectedOrder.orderAmount,
          status: "NOT_PAID",
        };

        setPaymentDues([...paymentDues, newPaymentDue]);
      }
    }

    // save delivery record
    const newDelivery = {
      id: `${selectedOrderId}-${deliveries.length + 1}`,
      orderId: selectedOrderId,
      status: deliveryStatus,
      reason: deliveryStatus === "DELIVERED" ? "" : reason,
      deliveryDate,
    };

    setDeliveries([...deliveries, newDelivery]);

    alert("Delivery updated");
  };

  // =========================
  // UI
  // =========================
  return (
    <div>
      <h1>Deliveries</h1>

      {/* ================= SECTION 1 ================= */}
      <h3>Choose Order</h3>
      <select
        value={selectedOrderId}
        onChange={(e) => setSelectedOrderId(Number(e.target.value))}
      >
        <option value="">-- Select Pending Order --</option>
        {pendingOrders.map((order) => (
          <option key={order.id} value={order.id}>
            {order.id} - {order.customerName}
          </option>
        ))}
      </select>

      {/* ================= SECTION 2 ================= */}
      {selectedOrder && (
        <>
          <h3>Order Details</h3>

          <div>
            <label>Order No</label>
            <input value={selectedOrder.id} readOnly />
          </div>

          <div>
            <label>Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* customer mini table */}
          <h4>Customer Details</h4>
          <table border="1">
            <tbody>
              <tr>
                <td>Name</td>
                <td>{selectedOrder.customerName}</td>
              </tr>
              <tr>
                <td>Contact</td>
                <td>{selectedOrder.mobileNumber}</td>
              </tr>
              <tr>
                <td>Address</td>
                <td>{selectedOrder.deliveryAddress}</td>
              </tr>
            </tbody>
          </table>

          {/* product mini table */}
          <h4>Product Details</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ================= SECTION 3 ================= */}
      {selectedOrder && (
        <>
          <h3>Delivery Status</h3>

          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value)}
          >
            <option value="">-- Select Status --</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_DELIVERED">Not Delivered</option>
          </select>

          {(deliveryStatus === "PENDING" ||
            deliveryStatus === "NOT_DELIVERED") && (
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">-- Select Reason --</option>
              <option value="DOOR_CLOSED">Door closed</option>
              <option value="CUSTOMER_NOT_AVAILABLE">
                Customer not available
              </option>
              <option value="CUSTOMER_REFUSED">Customer refused</option>
              <option value="PAYMENT_ISSUE">Payment issue</option>
              <option value="VEHICLE_ISSUE">Vehicle issue</option>
              <option value="OTHER">Other</option>
            </select>
          )}

          <br />
          <br />

          <button onClick={handleUpdateDelivery}>
            Update Delivery
          </button>

          {/* disabled until delivered */}
          <button
            disabled={!isDelivered}
            onClick={() => onViewPayment?.(selectedOrderId)}
          >
            View Payment
          </button>
        </>
      )}
    </div>
  );
}
