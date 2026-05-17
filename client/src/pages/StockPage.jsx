import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { formatDateTime } from "../utils/formatters";

export default function StockPage({
  isLoading,
  stockItems,
  refreshStockItems,
  refreshProducts,
}) {
  const editInputRef = useRef(null);
  const [editingId, setEditingId] = useState("");
  const [editedQty, setEditedQty] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditError, setAuditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const resetEditState = () => {
    setEditingId("");
    setEditedQty("");
    setIsUpdating(false);
  };

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await api.get("/stock/audit");
        setAuditLogs(response.data.logs || []);
      } catch (error) {
        setAuditError(
          error.response?.data?.message || "Unable to load stock audit logs.",
        );
      }
    };

    loadAuditLogs();
  }, []);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  const handleEditClick = (product) => {
    setEditingId(product.productId);
    setEditedQty(String(product.totalQty));
    setUpdateError("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setUpdateError("");
    setSuccessMessage("");
    resetEditState();
  };

  const handleUpdate = async () => {
    const numericQty = Number(editedQty);

    if (Number.isNaN(numericQty) || numericQty < 0) {
      setUpdateError("Total quantity must be zero or greater.");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    setSuccessMessage("");

    try {
      await api.put(`/stock/${editingId}`, {
        totalQty: numericQty,
      });

      setSuccessMessage("Stock updated successfully.");
      resetEditState();

      try {
        const [, auditResponse] = await Promise.all([
          refreshStockItems(),
          api.get("/stock/audit"),
          refreshProducts(),
        ]);
        setAuditLogs(auditResponse.data.logs || []);
      } catch {
        setUpdateError(
          "Stock was updated, but the latest stock view could not be refreshed automatically.",
        );
      }
    } catch (error) {
      setUpdateError(
        error.response?.data?.message ||
          "Unable to update stock right now. Please try again.",
      );
      setIsUpdating(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <h3>Live stock control</h3>
          </div>
        </div>

        {updateError ? <p className="form-error">{updateError}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading stock...</h3>
            <p>Fetching quantity, reservation, and availability data.</p>
          </div>
        ) : null}

        {!isLoading && !stockItems.length ? (
          <div className="empty-state">
            <h3>No stock data found</h3>
            <p>Once products are created, stock rows will appear here.</p>
          </div>
        ) : null}

        {!isLoading && stockItems.length ? (
          <div className="table-card table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Total Qty</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Last Modified</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {stockItems.map((product) => (
                  <tr key={product.productId}>
                    <td>{product.productName}</td>
                    <td>{product.unit}</td>
                    <td>
                      {editingId === product.productId ? (
                        <input
                          ref={editingId === product.productId ? editInputRef : null}
                          type="number"
                          min="0"
                          value={editedQty}
                          onChange={(event) => setEditedQty(event.target.value)}
                        />
                      ) : (
                        product.totalQty
                      )}
                    </td>
                    <td>{product.reservedQty}</td>
                    <td>{product.availableQty}</td>
                    <td>{formatDateTime(product.lastModified)}</td>
                    <td>
                      <span
                        className={
                          product.isActive ? "badge-active" : "badge-inactive"
                        }
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {editingId === product.productId ? (
                        <div className="button-row">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={handleUpdate}
                            disabled={isUpdating}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="ghost-button danger-button"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ghost-button"
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
        ) : null}
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Audit trail</p>
            <h3>Recent stock changes</h3>
          </div>
        </div>

        {auditError ? <p className="form-error">{auditError}</p> : null}

        {!auditLogs.length ? (
          <div className="empty-state">
            <h3>No stock changes recorded yet</h3>
            <p>Audit rows will appear after the first stock adjustment.</p>
          </div>
        ) : (
          <div className="table-card table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Old Qty</th>
                  <th>New Qty</th>
                  <th>Changed By</th>
                  <th>Changed At</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.productName}</td>
                    <td>{log.oldTotalQty}</td>
                    <td>{log.newTotalQty}</td>
                    <td>{log.changedByUsername}</td>
                    <td>{formatDateTime(log.changedAt)}</td>
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
