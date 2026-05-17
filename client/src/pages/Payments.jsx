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

  return (
    <div>
      <h1 className="page-title">Payments</h1>

      {paymentDues.length === 0 && <p>No payment dues yet</p>}

      {paymentDues.map((due) => (
        <div key={due.id} className="order-card">
          <h3>Order: {due.orderId}</h3>
          <p>Customer: {due.customerName}</p>
          <p>Total: {due.orderAmount}</p>
          <p>Paid: {due.paidAmount}</p>
          <p>Balance: {due.balanceAmount}</p>
          <p>Status: {due.status}</p>

          <input
            type="number"
            placeholder="Enter Amount"
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

          <button onClick={() => handleAddPayment(due.id)}>
            Add Payment
          </button>

          <button disabled={due.status !== "FULLY_PAID"}>
            Download Invoice
          </button>
        </div>
      ))}
    </div>
  );
}