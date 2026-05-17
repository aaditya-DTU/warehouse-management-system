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
    <div className="orders">
      <h1>Create Order</h1>

      {/* ✅ CUSTOMER DROPDOWN */}
      <select
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      >
        <option value="">-- Select Customer --</option>

        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

     
      {items.map((item, index) => (
        <div key={index} className="item-row">
          <select
            value={item.productId}
            onChange={(e) => {
              const updated = [...items];
              updated[index].productId = Number(e.target.value);
              setItems(updated);
            }}
          >
            <option value="">-- Select Product --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

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

          <button onClick={() => handleDelete(index)}>
            Remove
          </button>
        </div>
      ))}

      <button onClick={handleAddItem}>Add Item</button>

      <p>
        <strong>Order Total: ₹{orderAmount}</strong>
      </p>

      <button onClick={handleCreateOrder}>Create Order</button>

      {/* ================= ORDER LIST ================= */}
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>{order.customerName}</h3>
            <p>₹{order.orderAmount}</p>

            <ul>
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.productName} - {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;