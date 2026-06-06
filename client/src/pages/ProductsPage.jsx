import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { formatCurrency, formatDate } from "../utils/formatters";

const initialForm = {
  productName: "",
  unit: "",
  defaultRate: "",
  totalQty: "",
  isActive: true,
};

export default function ProductsPage({
  products,
  stockItems,
  isLoading,
  refreshProducts,
  refreshStockItems,
}) {
  const firstInputRef = useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const stockLookup = useMemo(
    () => Object.fromEntries(stockItems.map((item) => [item.productId, item])),
    [stockItems],
  );

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.productName, product.unit]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [products, searchText]);

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !formData.productName.trim() ||
      !formData.unit ||
      formData.defaultRate === ""
    ) {
      setErrorMessage("Product name, unit, and default rate are required.");
      return;
    }

    const numericRate = Number(formData.defaultRate);
    const numericQty = formData.totalQty === "" ? 0 : Number(formData.totalQty);

    if (Number.isNaN(numericRate) || numericRate < 0) {
      setErrorMessage("Default rate must be a valid non-negative number.");
      return;
    }

    if (Number.isNaN(numericQty) || numericQty < 0) {
      setErrorMessage("Total stock must be 0 or more.");
      return;
    }

    setIsSaving(true);

    try {
      await api.post("/products", {
        productName: formData.productName.trim(),
        unit: formData.unit,
        defaultRate: numericRate,
        totalQty: numericQty,
        isActive: formData.isActive,
      });

      await Promise.all([refreshProducts(), refreshStockItems()]);
      setFormData(initialForm);
      setSuccessMessage("Product created successfully.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to create product right now. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="split-panel">
        <form className="entity-form-card" onSubmit={handleCreateProduct}>
          <div className="section-heading">
            <p className="section-kicker">Product master</p>
            <h3>Add a warehouse product</h3>
          </div>

          <label className="form-field">
            <span>Product name</span>
            <input
              ref={firstInputRef}
              value={formData.productName}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  productName: event.target.value,
                }))
              }
              placeholder="Refined Sunflower Oil"
            />
          </label>

          <label className="form-field">
            <span>Unit</span>
            <select
              value={formData.unit}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  unit: event.target.value,
                }))
              }
            >
              <option value="">Select unit</option>
              <option value="kg">kg</option>
              <option value="litre">litre</option>
              <option value="piece">piece</option>
              <option value="box">box</option>
            </select>
          </label>

          <label className="form-field">
            <span>Default rate</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.defaultRate}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  defaultRate: event.target.value,
                }))
              }
              placeholder="0"
            />
          </label>

          <div className="two-column-grid">
            <label className="form-field">
              <span>Total stock (opening qty)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.totalQty}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    totalQty: event.target.value,
                  }))
                }
                placeholder="0"
              />
            </label>

            <label className="form-field">
              <span>Available stock</span>
              <input
                readOnly
                value={
                  formData.totalQty !== ""
                    ? `${Number(formData.totalQty)} (no reservations yet)`
                    : "—"
                }
              />
            </label>
          </div>

          {/* <label className="toggle-row">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            <span>Keep product active for ordering</span>
          </label> */}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? (
            <p className="form-success">{successMessage}</p>
          ) : null}

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving ? "Saving product..." : "Add product"}
          </button>
        </form>
      </section>

      <section className="module-panel">
        <div className="list-toolbar">
          <div>
            <p className="section-kicker">Catalog</p>
            <h3>{products.length} total products</h3>
          </div>

          <label className="search-field">
            <span>Search</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by product name or unit"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading products...</h3>
            <p>
              Pulling product master and stock information from the backend.
            </p>
          </div>
        ) : null}

        {!isLoading && !filteredProducts.length ? (
          <div className="empty-state">
            <h3>No products to display</h3>
            <p>
              {searchText
                ? "Try a broader search term."
                : "Create your first product to begin building the catalog."}
            </p>
          </div>
        ) : null}

        {!isLoading && filteredProducts.length ? (
          <div className="entity-grid">
            {filteredProducts.map((product) => {
              const stock = stockLookup[product._id] || {};

              return (
                <article key={product._id} className="entity-card">
                  <div className="card-row">
                    <div>
                      <strong>{product.productName}</strong>
                      <p>
                        {product.unit} unit · Created{" "}
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                    <span
                      className={
                        product.isActive ? "badge-active" : "badge-inactive"
                      }
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div>
                      <span className="info-label">Default rate</span>
                      <p>{formatCurrency(product.defaultRate)}</p>
                    </div>
                    <div>
                      <span className="info-label">Available stock</span>
                      <p>
                        {stock.availableQty ?? 0} {product.unit}
                      </p>
                    </div>
                    <div>
                      <span className="info-label">Reserved stock</span>
                      <p>
                        {stock.reservedQty ?? 0} {product.unit}
                      </p>
                    </div>
                    <div>
                      <span className="info-label">Total stock</span>
                      <p>
                        {stock.totalQty ?? product.totalQty ?? 0} {product.unit}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
