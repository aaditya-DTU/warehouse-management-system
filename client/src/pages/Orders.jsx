import { useState } from "react";

function Orders({ orders, setOrders, products, customers  }) {
  
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1 }]);

  const selectedCustomer = customers.find(
    (c) => c.id === Number(customerId)
  );

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1 }]);
  };

  const handleDelete = (indexToDelete) => {
    setItems(items.filter((_, index) => index !== indexToDelete));
  };

  const orderAmount = items.reduce((total, item) => {
    const product = products.find((p) => p.id === item.productId);

    if (!product || !item.quantity) return total;

    return total + product.defaultRate * Number(item.quantity);
  }, 0);

  const handleCreateOrder = () => {
    if (!customerId || !selectedCustomer) {
      alert("Select customer");
      return;
    }

    const validItems = items.filter((item) => item.productId);

    if (validItems.length === 0) {
      alert("Add at least one product");
      return;
    }

    const newOrder = {
      id: Date.now(),

      // ✅ from customer master
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      mobileNumber: selectedCustomer.mobileNumber,
      deliveryAddress: selectedCustomer.address,

      items: validItems.map((item) => {
        const product = products.find(
          (p) => p.id === item.productId
        );

        return {
          productId: product.id,
          productName: product.name,
          quantity: Number(item.quantity),
          rate: product.defaultRate,
        };
      }),

      orderAmount,
      createdAt: new Date(),
    };

    setOrders([...orders, newOrder]);

    // reset
    setCustomerId("");
    setItems([{ productId: "", quantity: 1 }]);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="page-shell">
      <section className="split-panel">
        <div className="entity-form-card">
          <div className="section-heading">
            <p className="section-kicker">Sales order</p>
            <h3>Create a new order</h3>
          </div>

          <label className="form-field">
            <span>Customer</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <div className="stack-section">
            <div className="inline-heading">
              <strong>Items</strong>
              <button type="button" className="ghost-button" onClick={handleAddItem}>
                Add item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="line-item-card">
                <label className="form-field">
                  <span>Product</span>
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].productId = Number(e.target.value);
                      setItems(updated);
                    }}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="two-column-grid">
                  <label className="form-field" style={{ marginBottom: 0 }}>
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].quantity = Number(e.target.value);
                        setItems(updated);
                      }}
                    />
                  </label>

                  {items.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="ghost-button danger-button"
                        style={{ width: '100%' }}
                        onClick={() => handleDelete(index)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="detail-card" style={{ marginTop: '0.5rem' }}>
            <div className="info-grid" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', gridTemplateColumns: '1fr' }}>
              <div>
                <span className="info-label">Order Total</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.2rem' }}>
                  ₹{orderAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            style={{ marginTop: '0.5rem' }}
            onClick={handleCreateOrder}
          >
            Create Order
          </button>
        </div>
      </section>

      {/* ─── ORDER LIST ─── */}
      {orders.length > 0 && (
        <section className="module-panel">
          <div className="list-toolbar" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <p className="section-kicker">Order register</p>
              <h3>{orders.length} orders</h3>
            </div>
          </div>

          <div className="entity-grid">
            {orders.map((order) => (
              <article key={order.id} className="entity-card">
                <div className="card-row">
                  <div>
                    <strong>{order.customerName}</strong>
                    <p>{order.deliveryAddress}</p>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-dark)', fontSize: '0.95rem' }}>
                    ₹{order.orderAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="list-divider" />

                <div className="mini-list">
                  {order.items.map((item, index) => (
                    <div key={index} className="mini-list-row">
                      <span>{item.productName}</span>
                      <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Orders;