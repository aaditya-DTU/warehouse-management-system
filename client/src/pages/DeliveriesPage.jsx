import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
} from "../utils/formatters";

const deliveryReasons = [
  "DOOR_CLOSED",
  "CUSTOMER_NOT_AVAILABLE",
  "CUSTOMER_REFUSED",
  "PAYMENT_ISSUE",
  "VEHICLE_ISSUE",
  "Other",
];

export default function DeliveriesPage({
  isLoading,
  orders,
  deliveries,
  refreshOrders,
  refreshDeliveries,
  refreshPaymentDues,
  refreshStockItems,
}) {
  const firstFieldRef = useRef(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [reason, setReason] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.isActive && !order.isDelivered && !order.isCancelled,
      ),
    [orders],
  );

  const selectedOrder = pendingOrders.find((order) => order._id === selectedOrderId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedOrderId || !deliveryDate || !deliveryStatus) {
      setErrorMessage("Order, delivery date, and delivery status are required.");
      return;
    }

    if (deliveryStatus === "NOT_DELIVERED" && !reason) {
      setErrorMessage("Select a reason for not delivered orders.");
      return;
    }

    if (reason === "Other" && !reasonText.trim()) {
      setErrorMessage("Add a custom explanation when reason is Other.");
      return;
    }

    setIsSaving(true);

    try {
      await api.post("/deliveries", {
        orderId: selectedOrderId,
        deliveryDate,
        deliveryStatus,
        reason,
        reasonText: reasonText.trim(),
      });

      await Promise.all([
        refreshOrders(),
        refreshDeliveries(),
        refreshPaymentDues(),
        refreshStockItems(),
      ]);

      setSelectedOrderId("");
      setDeliveryDate(new Date().toISOString().slice(0, 10));
      setDeliveryStatus("");
      setReason("");
      setReasonText("");
      setSuccessMessage("Delivery updated successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to update delivery right now. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">
        <form className="entity-form-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <p className="section-kicker">Delivery action</p>
            <h3>Update dispatch outcome</h3>
          </div>

          <label className="form-field">
            <span>Pending order</span>
            <select
              ref={firstFieldRef}
              value={selectedOrderId}
              onChange={(event) => setSelectedOrderId(event.target.value)}
            >
              <option value="">Select order</option>
              {pendingOrders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNo} · {order.customerName}
                </option>
              ))}
            </select>
          </label>

          {selectedOrder ? (
            <div className="detail-card">
              <div className="info-grid">
                <div>
                  <span className="info-label">Customer</span>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="info-label">Order amount</span>
                  <p>{formatCurrency(selectedOrder.orderAmount)}</p>
                </div>
              </div>

              <div className="mini-list">
                {selectedOrder.items.map((item) => (
                  <div key={item._id} className="mini-list-row">
                    <span>{item.productName}</span>
                    <span>{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="two-column-grid">
            <label className="form-field">
              <span>Delivery date</span>
              <input
                type="date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={deliveryStatus}
                onChange={(event) => {
                  setDeliveryStatus(event.target.value);
                  setReason("");
                  setReasonText("");
                }}
              >
                <option value="">Select status</option>
                <option value="DELIVERED">Delivered</option>
                <option value="NOT_DELIVERED">Not delivered</option>
                <option value="CANCELLED">Cancelled</option>
                {/* <option value="OUT_FOR_DELIVERY">Out for delivery</option> */}
              </select>
            </label>
          </div>

          {deliveryStatus === "NOT_DELIVERED" || deliveryStatus === "CANCELLED" ? (
            <label className="form-field">
              <span>Reason</span>
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="">Select reason</option>
                {deliveryReasons.map((entry) => (
                  <option key={entry} value={entry}>
                    {formatStatusLabel(entry)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {reason === "Other" ? (
            <label className="form-field">
              <span>Reason details</span>
              <textarea
                rows="3"
                value={reasonText}
                onChange={(event) => setReasonText(event.target.value)}
                placeholder="Describe the delivery issue"
              />
            </label>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Updating delivery..." : "Update delivery"}
          </button>
        </form>
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Delivery history</p>
            <h3>{deliveries.length} delivery records</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading deliveries...</h3>
            <p>Fetching recent dispatch activity from the backend.</p>
          </div>
        ) : null}

        {!isLoading && !deliveries.length ? (
          <div className="empty-state">
            <h3>No deliveries recorded yet</h3>
            <p>Delivery activity will appear here as orders are processed.</p>
          </div>
        ) : null}

        {!isLoading && deliveries.length ? (
          <div className="entity-grid">
            {deliveries.map((delivery) => (
              <article key={delivery._id} className="entity-card">
                <div className="card-row">
                  <div>
                    <strong>{delivery.orderNo}</strong>
                    <p>
                      {delivery.customerName} · {formatDate(delivery.deliveryDate)}
                    </p>
                  </div>
                  <span
                    className={`badge-${String(delivery.deliveryStatus).toLowerCase()}`}
                  >
                    {formatStatusLabel(delivery.deliveryStatus)}
                  </span>
                </div>

                <div className="info-grid">
                  <div>
                    <span className="info-label">Mobile</span>
                    <p>{delivery.customerMobile}</p>
                  </div>
                  <div>
                    <span className="info-label">Updated</span>
                    <p>{formatDateTime(delivery.updatedAt)}</p>
                  </div>
                </div>

                {delivery.reason ? (
                  <>
                    <div className="list-divider" />
                    <p className="muted-copy">
                      {formatStatusLabel(delivery.reason)}
                      {delivery.reasonText ? ` · ${delivery.reasonText}` : ""}
                    </p>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}