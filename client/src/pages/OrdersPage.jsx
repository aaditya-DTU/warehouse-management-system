import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
} from "../utils/formatters";

let lineItemSequence = 0;

const createLineItem = () => ({
  id: `line-item-${lineItemSequence += 1}`,
  productId: "",
  quantity: 1,
  rate: "",
});

export default function OrdersPage({
  isLoading,
  orders,
  customers,
  products,
  stockItems,
  refreshOrders,
  refreshStockItems,
}) {
  const firstFieldRef = useRef(null);
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([createLineItem()]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const activeCustomers = customers.filter((customer) => customer.isActive);
  const activeProducts = products.filter((product) => product.isActive);
  const stockLookup = Object.fromEntries(stockItems.map((item) => [item.productId, item]));

  const orderAmount = useMemo(
    () =>
      items.reduce((total, item) => {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        return total + quantity * rate;
      }, 0),
    [items],
  );

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) =>
      [order.orderNo, order.customerName, order.deliveryAddress]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [orders, searchText]);

  const handleCustomerChange = (nextCustomerId) => {
    setCustomerId(nextCustomerId);
    const customer = activeCustomers.find((entry) => entry._id === nextCustomerId);
    setDeliveryAddress(customer?.address || "");
  };

  const handleAddItem = () => {
    setItems((current) => [...current, createLineItem()]);
  };

  const updateItem = (itemId, field, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        if (field === "productId") {
          const product = activeProducts.find((entry) => entry._id === value);
          return {
            ...item,
            productId: value,
            rate: product?.defaultRate ?? "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  const removeItem = (itemId) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validItems = items.filter((item) => item.productId && Number(item.quantity) > 0);

    if (!customerId || !deliveryAddress.trim() || !deliveryDate) {
      setErrorMessage("Customer, delivery address, and delivery date are required.");
      return;
    }

    if (!validItems.length) {
      setErrorMessage("Add at least one valid product item.");
      return;
    }

    setIsSaving(true);

    try {
      await api.post("/orders", {
        customerId,
        deliveryAddress: deliveryAddress.trim(),
        deliveryDate,
        remarks: remarks.trim(),
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })),
      });

      await Promise.all([refreshOrders(), refreshStockItems()]);
      setCustomerId("");
      setDeliveryAddress("");
      setDeliveryDate(new Date().toISOString().slice(0, 10));
      setRemarks("");
      setItems([createLineItem()]);
      setSuccessMessage("Order created successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to create order right now. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">
        <form className="entity-form-card" onSubmit={handleCreateOrder}>
          <div className="section-heading">
            <p className="section-kicker">Sales order</p>
            <h3>Create a new order</h3>
          </div>

          <label className="form-field">
            <span>Customer</span>
            <select
              ref={firstFieldRef}
              value={customerId}
              onChange={(event) => handleCustomerChange(event.target.value)}
            >
              <option value="">Select customer</option>
              {activeCustomers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </label>

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
              <span>Order total</span>
              <input value={formatCurrency(orderAmount)} readOnly />
            </label>
          </div>

          <label className="form-field">
            <span>Delivery address</span>
            <textarea
              rows="3"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Enter delivery address"
            />
          </label>

          <label className="form-field">
            <span>Remarks</span>
            <textarea
              rows="2"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Optional delivery note"
            />
          </label>

          <div className="stack-section">
            <div className="inline-heading">
              <strong>Items</strong>
              <button
                type="button"
                className="ghost-button"
                onClick={handleAddItem}
              >
                Add item
              </button>
            </div>

            {items.map((item) => {
              const selectedProduct = activeProducts.find(
                (product) => product._id === item.productId,
              );
              const stock = item.productId ? stockLookup[item.productId] : null;

              return (
                <div key={item.id} className="line-item-card">
                  <label className="form-field">
                    <span>Product</span>
                    <select
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(item.id, "productId", event.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {activeProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="three-column-grid">
                    <label className="form-field">
                      <span>Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, "quantity", event.target.value)
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>Rate</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(event) =>
                          updateItem(item.id, "rate", event.target.value)
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>Available stock</span>
                      <input
                        readOnly
                        value={
                          selectedProduct
                            ? `${stock?.availableQty ?? 0} ${selectedProduct.unit}`
                            : "-"
                        }
                      />
                    </label>
                  </div>

                  {items.length > 1 ? (
                    <button
                      type="button"
                      className="ghost-button danger-button"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove item
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Saving order..." : "Create order"}
          </button>
        </form>
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Order register</p>
            <h3>{orders.length} total orders</h3>
          </div>

          <label className="search-field">
            <span>Search</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by order number, customer, or address"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading orders...</h3>
            <p>Fetching current order history from the backend.</p>
          </div>
        ) : null}

        {!isLoading && !filteredOrders.length ? (
          <div className="empty-state">
            <h3>No orders to display</h3>
            <p>{searchText ? "Try a different search." : "Create the first order."}</p>
          </div>
        ) : null}

        {!isLoading && filteredOrders.length ? (
          <div className="entity-grid">
            {filteredOrders.map((order) => {
              const status = order.isCancelled
                ? "CANCELLED"
                : order.isDelivered
                  ? "DELIVERED"
                  : "PENDING";

              return (
                <article key={order._id} className="entity-card">
                  <div className="card-row">
                    <div>
                      <strong>{order.orderNo}</strong>
                      <p>
                        {order.customerName} · Delivery {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                    <span className={`badge-${status.toLowerCase()}`}>
                      {formatStatusLabel(status)}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div>
                      <span className="info-label">Order amount</span>
                      <p>{formatCurrency(order.orderAmount)}</p>
                    </div>
                    <div>
                      <span className="info-label">Items</span>
                      <p>{order.items.length}</p>
                    </div>
                  </div>

                  <div className="list-divider" />

                  <div className="mini-list">
                    {order.items.map((item) => (
                      <div key={item._id} className="mini-list-row">
                        <span>{item.productName}</span>
                        <span>
                          {item.quantity} × {formatCurrency(item.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}