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
    <div className="page-shell">
      <section className="split-panel">
        <div className="entity-form-card">
          <div className="section-heading">
            <p className="section-kicker">Delivery action</p>
            <h3>Choose Order</h3>
          </div>

          <label className="form-field">
            <span>Pending order</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
            >
              <option value="">Select Pending Order</option>
              {pendingOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} – {order.customerName}
                </option>
              ))}
            </select>
          </label>

          {selectedOrder && (
            <>
              <div className="detail-card">
                <div className="section-heading">
                  <p className="section-kicker">Order details</p>
                </div>

                <div className="info-grid" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <div>
                    <span className="info-label">Order No</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedOrder.id}</p>
                  </div>
                  <div>
                    <span className="info-label">Customer</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <span className="info-label">Contact</span>
                    <p>{selectedOrder.mobileNumber}</p>
                  </div>
                  <div>
                    <span className="info-label">Address</span>
                    <p>{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>

                <div className="list-divider" />

                <p className="section-kicker" style={{ marginBottom: '0.6rem' }}>Products</p>
                <div className="mini-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="mini-list-row">
                      <span>{item.productName}</span>
                      <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="form-field">
                <span>Delivery date</span>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Delivery status</span>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="PENDING">Pending</option>
                  <option value="NOT_DELIVERED">Not Delivered</option>
                </select>
              </label>

              {(deliveryStatus === "PENDING" || deliveryStatus === "NOT_DELIVERED") && (
                <label className="form-field">
                  <span>Reason</span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="">Select Reason</option>
                    <option value="DOOR_CLOSED">Door closed</option>
                    <option value="CUSTOMER_NOT_AVAILABLE">Customer not available</option>
                    <option value="CUSTOMER_REFUSED">Customer refused</option>
                    <option value="PAYMENT_ISSUE">Payment issue</option>
                    <option value="VEHICLE_ISSUE">Vehicle issue</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              )}

              <div className="button-row" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ flex: 1 }}
                  onClick={handleUpdateDelivery}
                >
                  Update Delivery
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={!isDelivered}
                  onClick={() => onViewPayment?.(selectedOrderId)}
                >
                  View Payment
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}