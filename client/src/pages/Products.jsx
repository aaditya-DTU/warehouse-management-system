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
    <div className="page-shell">
      <section className="split-panel">
        <div className="entity-form-card">
          <div className="section-heading">
            <p className="section-kicker">Product master</p>
            <h3>Add a warehouse product</h3>
          </div>

          <label className="form-field">
            <span>Product name</span>
            <input
              type="text"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>MRP (₹)</span>
            <input
              type="number"
              placeholder="0"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Unit</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">Select Unit</option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
              <option value="piece">piece</option>
            </select>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Keep product active for ordering</span>
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={handleCreateProduct}
          >
            Add Product
          </button>
        </div>
      </section>

      {products.length > 0 && (
        <section className="module-panel">
          <div className="list-toolbar" style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <p className="section-kicker">Catalog</p>
              <h3>{products.length} products</h3>
            </div>
          </div>

          <div className="entity-grid">
            {products.map((product) => (
              <article key={product.id} className="entity-card">
                <div className="card-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.unit}</p>
                  </div>
                  <span className={product.isActive ? "badge-active" : "badge-inactive"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="info-grid">
                  <div>
                    <span className="info-label">MRP</span>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      ₹{product.mrp?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="info-label">Total Qty</span>
                    <p>{product.totalQty}</p>
                  </div>
                  <div>
                    <span className="info-label">Reserved Qty</span>
                    <p>{product.reservedQty}</p>
                  </div>
                  <div>
                    <span className="info-label">Available Qty</span>
                    <p style={{ color: (product.availableQty ?? 0) <= 5 ? '#8f2727' : 'inherit', fontWeight: (product.availableQty ?? 0) <= 5 ? 600 : 400 }}>
                      {product.availableQty ?? 0}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Products;