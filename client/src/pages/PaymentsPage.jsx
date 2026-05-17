import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import {
  formatCurrency,
  formatDateTime,
  formatStatusLabel,
} from "../utils/formatters";

export default function PaymentsPage({
  isLoading,
  paymentDues,
  refreshPaymentDues,
}) {
  const firstEditableRef = useRef(null);
  const [selectedDueId, setSelectedDueId] = useState("");
  const [paymentEntries, setPaymentEntries] = useState([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    firstEditableRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selectedDueId && paymentDues.length) {
      setSelectedDueId(paymentDues[0]._id);
    }
  }, [paymentDues, selectedDueId]);

  useEffect(() => {
    if (!selectedDueId) {
      setPaymentEntries([]);
      return;
    }

    const loadPaymentEntries = async () => {
      setDetailLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get(`/payments/${selectedDueId}`);
        setPaymentEntries(response.data.entries || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Unable to load payment details.",
        );
      } finally {
        setDetailLoading(false);
      }
    };

    loadPaymentEntries();
  }, [selectedDueId]);

  const selectedDue = paymentDues.find((due) => due._id === selectedDueId);

  const handleAddPayment = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedDueId || !amountPaid) {
      setErrorMessage("Select a payment due and enter an amount.");
      return;
    }

    if (paymentMode === "UPI" && !upiTxnId.trim()) {
      setErrorMessage("UPI transaction ID is required for UPI payments.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/payments", {
        paymentDueId: selectedDueId,
        amountPaid: Number(amountPaid),
        paymentMode,
        upiTxnId: upiTxnId.trim(),
      });

      await refreshPaymentDues();
      const response = await api.get(`/payments/${selectedDueId}`);
      setPaymentEntries(response.data.entries || []);
      setAmountPaid("");
      setPaymentMode("CASH");
      setUpiTxnId("");
      setSuccessMessage("Payment recorded successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to record payment right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedDueId) {
      return;
    }

    setErrorMessage("");

    try {
      const response = await api.get(`/payments/${selectedDueId}/invoice`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${selectedDue?.orderNo || "invoice"}.pdf`;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to download invoice.",
      );
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">
        <form className="entity-form-card" onSubmit={handleAddPayment}>
          <div className="section-heading">
            <p className="section-kicker">Receive payment</p>
            <h3>Record a customer payment</h3>
          </div>

          <label className="form-field">
            <span>Payment due</span>
            <select
              value={selectedDueId}
              onChange={(event) => setSelectedDueId(event.target.value)}
            >
              <option value="">Select due</option>
              {paymentDues.map((due) => (
                <option key={due._id} value={due._id}>
                  {due.orderNo} · {due.customerName}
                </option>
              ))}
            </select>
          </label>

          {selectedDue ? (
            <div className="detail-card">
              <div className="info-grid">
                <div>
                  <span className="info-label">Total</span>
                  <p>{formatCurrency(selectedDue.orderTotalAmount)}</p>
                </div>
                <div>
                  <span className="info-label">Balance</span>
                  <p>{formatCurrency(selectedDue.balanceAmount)}</p>
                </div>
                <div>
                  <span className="info-label">Paid</span>
                  <p>{formatCurrency(selectedDue.paidAmount)}</p>
                </div>
                <div>
                  <span className="info-label">Status</span>
                  <p>{formatStatusLabel(selectedDue.paymentStatus)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="two-column-grid">
            <label className="form-field">
              <span>Amount paid</span>
              <input
                ref={firstEditableRef}
                type="number"
                min="1"
                step="0.01"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.target.value)}
                placeholder="0"
              />
            </label>

            <label className="form-field">
              <span>Payment mode</span>
              <select
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </label>
          </div>

          {paymentMode === "UPI" ? (
            <label className="form-field">
              <span>UPI transaction ID</span>
              <input
                value={upiTxnId}
                onChange={(event) => setUpiTxnId(event.target.value)}
                placeholder="Enter transaction reference"
              />
            </label>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <div className="button-row">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Saving payment..." : "Add payment"}
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={selectedDue?.paymentStatus !== "FULLY_PAID"}
              onClick={handleDownloadInvoice}
            >
              Download invoice
            </button>
          </div>
        </form>
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Due register</p>
            <h3>{paymentDues.length} payment dues</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading payment dues...</h3>
            <p>Fetching outstanding and settled order payments.</p>
          </div>
        ) : null}

        {!isLoading && !paymentDues.length ? (
          <div className="empty-state">
            <h3>No payment dues yet</h3>
            <p>Payment records will appear after successful deliveries.</p>
          </div>
        ) : null}

        {!isLoading && paymentDues.length ? (
          <div className="split-detail-grid">
            <div className="entity-grid compact-grid">
              {paymentDues.map((due) => (
                <article
                  key={due._id}
                  className={`entity-card selectable-card${
                    selectedDueId === due._id ? " selected" : ""
                  }`}
                  onClick={() => setSelectedDueId(due._id)}
                >
                  <div className="card-row">
                    <div>
                      <strong>{due.orderNo}</strong>
                      <p>{due.customerName}</p>
                    </div>
                    <span
                      className={`badge-${String(due.paymentStatus).toLowerCase()}`}
                    >
                      {formatStatusLabel(due.paymentStatus)}
                    </span>
                  </div>
                  <div className="info-grid">
                    <div>
                      <span className="info-label">Balance</span>
                      <p>{formatCurrency(due.balanceAmount)}</p>
                    </div>
                    <div>
                      <span className="info-label">Paid</span>
                      <p>{formatCurrency(due.paidAmount)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="detail-card">
              <div className="section-heading">
                <p className="section-kicker">Payment history</p>
                <h3>{selectedDue?.orderNo || "Select a due"}</h3>
              </div>

              {detailLoading ? (
                <div className="empty-state">
                  <h3>Loading entries...</h3>
                  <p>Fetching payment history for the selected due.</p>
                </div>
              ) : null}

              {!detailLoading && !paymentEntries.length ? (
                <div className="empty-state">
                  <h3>No entries yet</h3>
                  <p>Recorded payments will appear here.</p>
                </div>
              ) : null}

              {!detailLoading && paymentEntries.length ? (
                <div className="mini-list">
                  {paymentEntries.map((entry) => (
                    <div key={entry._id} className="mini-list-row bordered-row">
                      <div>
                        <strong>{formatCurrency(entry.amountPaid)}</strong>
                        <p className="muted-copy">
                          {formatStatusLabel(entry.paymentMode)}
                          {entry.upiTxnId ? ` · ${entry.upiTxnId}` : ""}
                        </p>
                      </div>
                      <span>{formatDateTime(entry.paidAt)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
