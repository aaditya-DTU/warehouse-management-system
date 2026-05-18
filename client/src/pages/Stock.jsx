import { useState } from "react";

export default function Stock({ products, setProducts }) {
  const [editingId, setEditingId] = useState(null);
  const [editedQty, setEditedQty] = useState("");

  // start editing a row
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditedQty(product.totalQty);
  };

  // cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditedQty("");
  };

  // save updated total qty with business validations
  const handleUpdate = (id) => {
    const numericQty = Number(editedQty);

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== id) return product;

        // ❌ validation: must be number and >= 0
        if (isNaN(numericQty) || numericQty < 0) {
          alert("Total Qty must be 0 or more");
          return product;
        }

        // ❌ validation: cannot be less than reserved
        if (numericQty < product.reservedQty) {
          alert("Total Qty cannot be less than Reserved Qty");
          return product;
        }

        // ✅ recalculate available qty
        const availableQty = numericQty - product.reservedQty;

        return {
          ...product,
          totalQty: numericQty,
          availableQty,
          lastModified: new Date(), // audit timestamp
        };
      }),
    );

    setEditingId(null);
    setEditedQty("");
  };

  return (
    <div className="page-shell">
      <section className="module-panel">
        <div className="list-toolbar" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <p className="section-kicker">Inventory</p>
            <h3>Live stock control</h3>
          </div>
        </div>

        {products.length === 0 && (
          <div className="empty-state">
            <h3>No products available</h3>
            <p>Stock rows will appear once products are created.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="table-card table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Product Name</th>
                  <th>Total Qty</th>
                  <th>Reserved Qty</th>
                  <th>Available Qty</th>
                  <th>Last Modified</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{index + 1}</td>

                    <td style={{ fontWeight: 600 }}>{product.name}</td>

                    {/* total qty editable only in edit mode */}
                    <td>
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editedQty}
                          onChange={(e) => setEditedQty(e.target.value)}
                          style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.88rem' }}
                        />
                      ) : (
                        product.totalQty
                      )}
                    </td>

                    {/* read-only reserved */}
                    <td>{product.reservedQty}</td>

                    {/* read-only available */}
                    <td>
                      <span style={{
                        color: (product.availableQty || 0) <= 5 ? '#8f2727' : 'inherit',
                        fontWeight: (product.availableQty || 0) <= 5 ? 700 : 400,
                      }}>
                        {product.availableQty}
                      </span>
                    </td>

                    {/* last modified display */}
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {product.lastModified
                        ? new Date(product.lastModified).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      {editingId === product.id ? (
                        <div className="button-row" style={{ gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="ghost-button"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                            onClick={() => handleUpdate(product.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="ghost-button danger-button"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ghost-button"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                          onClick={() => handleEditClick(product)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}