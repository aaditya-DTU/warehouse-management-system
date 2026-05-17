import { useState } from "react";

function Products({ products, setProducts }) {
  const [name, setName] = useState("");
  const [mrp, setMrp] = useState("");
  const [unit, setUnit] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleCreateProduct = () => {
    const numericMrp = Number(mrp);

    if (!name ||!unit|| numericMrp <= 0) return;
    
    const newProduct = {
      id: Date.now(),
      name,
      mrp: numericMrp,
      unit,
      isActive,

      totalQty: 0,
      reservedQty:0,
      avaliableQty:0,

      createdAt: new Date(),
    };

    setProducts([...products, newProduct]);

    setName("");
    setMrp("");
    setUnit("");
    setIsActive(true);
  };

  return (
    <div className="products">
      <h1>Products</h1>

      <div className="product-form">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="MRP"
          value={mrp}
          onChange={(e) => setMrp(e.target.value)}
        />

        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option>Select Unit</option>
          <option value="kg">kg</option>
          <option value="litre">litre</option>
          <option value="piece">piece</option>
        </select>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span>Is Active</span>
      </label>

      <button onClick={handleCreateProduct}>Add Product</button>

      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <strong>{product.name}</strong>
            <div>MRP: ₹{product.mrp}</div>
            <div>Unit: {product.unit}</div>
            <div>Total Qty: {product.totalQty}</div>
            <div>Reserved Qty: {product.reservedQty}</div>
            <div>Available Qty: {product.availableQty}</div>
            <div
              className={product.isActive ? "badge-active" : "badge-inactive"}
            >
              {product.isActive ? "Active" : "Inactive"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
