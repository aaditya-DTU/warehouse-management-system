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
    <div>
      <h1 className="page-title">Stock</h1>

      {products.length === 0 && <p>No products available</p>}

      {products.length > 0 && (
        <table style={{ width: "100%", marginTop: "20px" }}>
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
                <td>{index + 1}</td>

                <td>{product.name}</td>

                {/* total qty editable only in edit mode */}
                <td>
                  {editingId === product.id ? (
                    <input
                      type="number"
                      value={editedQty}
                      onChange={(e) => setEditedQty(e.target.value)}
                    />
                  ) : (
                    product.totalQty
                  )}
                </td>

                {/* read-only reserved */}
                <td>{product.reservedQty}</td>

                {/* read-only available */}
                <td>{product.availableQty}</td>

                {/* last modified display */}
                <td>
                  {product.lastModified
                    ? new Date(product.lastModified).toLocaleString()
                    : "-"}
                </td>

                <td>
                  {editingId === product.id ? (
                    <>
                      <button onClick={() => handleUpdate(product.id)}>
                        Save
                      </button>
                      <button onClick={handleCancel}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => handleEditClick(product)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
