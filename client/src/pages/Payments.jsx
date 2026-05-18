import { useState } from "react";

export default function Payments({ paymentDues, setPaymentDues }) {
  const [paymentInputs, setPaymentInputs] = useState({});

  const handleAddPayment = (dueId) => {
    const inputData = paymentInputs[dueId];

    if (!inputData || !inputData.amount) {
      alert("Enter amount");
      return;
    }

    const updatedDues = paymentDues.map((due) => {
      if (due.id !== dueId) return due;

      const newPaid = due.paidAmount + inputData.amount;
      const newBalance = due.orderAmount - newPaid;

      let newStatus = "NOT_PAID";
      if (newPaid === 0) newStatus = "NOT_PAID";
      else if (newBalance > 0) newStatus = "PARTIALLY_PAID";
      else newStatus = "FULLY_PAID";

      return {
        ...due,
        paidAmount: newPaid,
        balanceAmount: newBalance,
        status: newStatus,
      };
    });

    setPaymentDues(updatedDues);

    setPaymentInputs({
      ...paymentInputs,
      [dueId]: { amount: "" },
    });
  };

  const statusBadgeClass = (status) => {
    if (status === "FULLY_PAID") return "badge-fully_paid";
    if (status === "PARTIALLY_PAID") return "badge-partially_paid";
    return "badge-not_paid";
  };

  return (
    <div className="page-shell">
      <section className="module-panel">
        <div className="list-toolbar" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <p className="section-kicker">Payment dues</p>
            <h3>{paymentDues.length} dues</h3>
          </div>
        </div>

        {paymentDues.length === 0 && (
          <div className="empty-state">
            <h3>No payment dues yet</h3>
            <p>Payment records will appear after successful deliveries.</p>
          </div>
        )}

        <div className="entity-grid">
          {paymentDues.map((due) => (
            <article key={due.id} className="entity-card">
              <div className="card-row">
                <div>
                  <strong>Order: {due.orderId}</strong>
                  <p>{due.customerName}</p>
                </div>
                <span className={statusBadgeClass(due.status)}>
                  {due.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="info-grid">
                <div>
                  <span className="info-label">Total</span>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    ₹{due.orderAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="info-label">Paid</span>
                  <p style={{ color: '#1a6645', fontWeight: 600 }}>
                    ₹{due.paidAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="info-label">Balance</span>
                  <p style={{ color: due.balanceAmount > 0 ? 'var(--accent-dark)' : '#1a6645', fontWeight: 600 }}>
                    ₹{due.balanceAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="list-divider" />

              <div className="two-column-grid" style={{ alignItems: 'flex-end' }}>
                <label className="form-field" style={{ marginBottom: 0 }}>
                  <span>Amount to pay</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentInputs[due.id]?.amount || ""}
                    onChange={(e) =>
                      setPaymentInputs({
                        ...paymentInputs,
                        [due.id]: {
                          amount: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>

                <button
                  type="button"
                  className="ghost-button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleAddPayment(due.id)}
                >
                  Add Payment
                </button>
              </div>

              {due.status === "FULLY_PAID" && (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                  disabled={due.status !== "FULLY_PAID"}
                >
                  Download Invoice
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}