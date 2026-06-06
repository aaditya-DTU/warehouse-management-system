import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";

const initialForm = {
  customerName: "",
  mobileNumber: "",
  email: "",
  address: "",
  isActive: true,
};

const normalizeCustomer = (customer) => ({
  ...customer,
  id: customer._id,
  name: customer.customerName,
  phone: customer.mobileNumber,
  location: customer.address,
});

function Customers({ customers, setCustomers, isLoading, refreshCustomers }) {
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.customerName, customer.mobileNumber, customer.email, customer.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [customers, searchText]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateCustomer = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !formData.customerName.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.address.trim()
    ) {
      setErrorMessage("Customer name, mobile number, and address are required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        isActive: formData.isActive,
      };

      const response = await api.post("/customers", payload);
      setCustomers((current) => [normalizeCustomer(response.data.customer), ...current]);
      await refreshCustomers();
      setFormData(initialForm);
      setSuccessMessage("Customer created successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to create customer. Please review the form and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell customers-page">
      <section className="split-panel">
        <form className="entity-form-card" onSubmit={handleCreateCustomer}>
          <div className="section-heading">
            <p className="section-kicker">Create customer</p>
            <h3>Add a new business contact</h3>
          </div>

          <label className="form-field">
            <span>Customer name</span>
            <input
              ref={firstInputRef}
              value={formData.customerName}
              onChange={(event) =>
                handleChange("customerName", event.target.value)
              }
              placeholder="Ramesh Traders"
            />
          </label>

          <label className="form-field">
            <span>Mobile number</span>
            <input
              value={formData.mobileNumber}
              onChange={(event) =>
                handleChange("mobileNumber", event.target.value)
              }
              placeholder="9876543210"
            />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="optional@email.com"
            />
          </label>

          <label className="form-field">
            <span>Address</span>
            <textarea
              rows="4"
              value={formData.address}
              onChange={(event) => handleChange("address", event.target.value)}
              placeholder="Enter delivery address"
            />
          </label>

          {/* <label className="toggle-row">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) => handleChange("isActive", event.target.checked)}
            />
            <span>Mark customer as active</span>
          </label> */}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Saving customer..." : "Add customer"}
          </button>
        </form>
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Customer records</p>
            <h3>{customers.length} total customers</h3>
          </div>

          <label className="search-field">
            <span>Search</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by name, mobile, email, or address"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading customers...</h3>
            <p>Fetching your customer records from the backend.</p>
          </div>
        ) : null}

        {!isLoading && errorMessage && customers.length === 0 ? (
          <div className="empty-state error-state">
            <h3>Customers are unavailable</h3>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {!isLoading && !filteredCustomers.length ? (
          <div className="empty-state">
            <h3>No matching customers found</h3>
            <p>
              {searchText
                ? "Try a different search term or add a new customer."
                : "Start by adding your first customer record."}
            </p>
          </div>
        ) : null}

        {!isLoading && filteredCustomers.length ? (
          <div className="customer-list">
            {filteredCustomers.map((customer) => (
              <article key={customer._id} className="customer-card">
                <div className="card-row">
                  <div>
                    <strong>{customer.customerName}</strong>
                    <p>{customer.address}</p>
                  </div>
                  <span
                    className={
                      customer.isActive ? "badge-active" : "badge-inactive"
                    }
                  >
                    {customer.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="info-grid">
                  <div>
                    <span className="info-label">Mobile</span>
                    <p>{customer.mobileNumber}</p>
                  </div>
                  <div>
                    <span className="info-label">Email</span>
                    <p>{customer.email || "Not provided"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Customers;