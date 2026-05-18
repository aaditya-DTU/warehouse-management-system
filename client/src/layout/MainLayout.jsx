import {
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import NavItem from "../components/NavItem";
import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import OrdersPage from "../pages/OrdersPage";
import DeliveriesPage from "../pages/DeliveriesPage";
import StockPage from "../pages/StockPage";
import PaymentsPage from "../pages/PaymentsPage";
import ProductsPage from "../pages/ProductsPage";
import UsersPage from "../pages/UsersPage";
import ReportsPage from "../pages/ReportsPage";

export default function MainLayout({
  user,
  onLogout,
  isAppLoading,
  appError,
  customers,
  setCustomers,
  refreshCustomers,
  products,
  refreshProducts,
  orders,
  refreshOrders,
  deliveries,
  refreshDeliveries,
  paymentDues,
  refreshPaymentDues,
  stockItems,
  refreshStockItems,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeMeta = {
    "/": {
      title: "Dashboard",
    },
    "/customers": {
      title: "Customers",
    },
    "/products": {
      title: "Products",
    },
    "/orders": {
      title: "Orders",
    },
    "/deliveries": {
      title: "Deliveries",
    },
    "/stock": {
      title: "Stock",
    },
    "/payments": {
      title: "Payments",
    },
    "/reports": {
      title: "Reports",
    },
    "/users": {
      title: "Users",
    },
  };
  const currentMeta = routeMeta[location.pathname] || routeMeta["/"];
  const isDashboardRoute = location.pathname === "/";

  useEffect(() => {
    if (location.pathname === "/" && location.state?.scrollToDashboard) {
      window.setTimeout(() => {
        document.getElementById("dashboard-content")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  }, [location]);

  const handleDashboardClick = () => {
    if (location.pathname === "/") {
      document.getElementById("dashboard-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    navigate("/", {
      state: {
        scrollToDashboard: true,
      },
    });
  };

  return (
    <div
      className={`app-layout${isDashboardRoute ? " dashboard-route" : " module-route"}`}
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Warehouse Operations</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className="nav-item nav-button"
            onClick={handleDashboardClick}
          >
            Dashboard
          </button>
          <NavItem to="/customers">Customers</NavItem>
          <NavItem to="/products">Products</NavItem>
          <NavItem to="/orders">Orders</NavItem>
          <NavItem to="/deliveries">Deliveries</NavItem>
          <NavItem to="/stock">Stock</NavItem>
          <NavItem to="/payments">Payments</NavItem>
          {user?.role === "ADMIN" ? (
            <>
              <NavItem to="/reports">Reports</NavItem>
              <NavItem to="/users">Users</NavItem>
            </>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <div className="user-panel">
            <strong>{user?.username || "Admin"}</strong>
            <span>{user?.role || "ADMIN"}</span>
          </div>
          <button type="button" className="secondary-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        {!isDashboardRoute ? (
          <div className="mobile-backbar">
            <Link to="/" className="back-link">
              Back to Menu
            </Link>
          </div>
        ) : null}

        <header className="content-header">
          <div>
            <h1>{currentMeta.title}</h1>
          </div>
          {isAppLoading ? (
            <span className="header-chip">Syncing data</span>
          ) : null}
        </header>

        {appError ? (
          <div className="banner banner-error">{appError}</div>
        ) : null}

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                isAppLoading={isAppLoading}
                customers={customers}
                products={products}
                orders={orders}
                deliveries={deliveries}
                paymentDues={paymentDues}
                stockItems={stockItems}
              />
            }
          />
          <Route
            path="/customers"
            element={
              <Customers
                customers={customers}
                setCustomers={setCustomers}
                isLoading={isAppLoading}
                refreshCustomers={refreshCustomers}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductsPage
                products={products}
                stockItems={stockItems}
                isLoading={isAppLoading}
                refreshProducts={refreshProducts}
                refreshStockItems={refreshStockItems}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <OrdersPage
                isLoading={isAppLoading}
                orders={orders}
                products={products}
                customers={customers}
                stockItems={stockItems}
                refreshOrders={refreshOrders}
                refreshStockItems={refreshStockItems}
              />
            }
          />
          <Route
            path="/deliveries"
            element={
              <DeliveriesPage
                isLoading={isAppLoading}
                orders={orders}
                deliveries={deliveries}
                refreshOrders={refreshOrders}
                refreshDeliveries={refreshDeliveries}
                refreshPaymentDues={refreshPaymentDues}
                refreshStockItems={refreshStockItems}
              />
            }
          />
          <Route
            path="/stock"
            element={
              <StockPage
                isLoading={isAppLoading}
                stockItems={stockItems}
                refreshStockItems={refreshStockItems}
                refreshProducts={refreshProducts}
              />
            }
          />
          <Route
            path="/payments"
            element={
              <PaymentsPage
                isLoading={isAppLoading}
                paymentDues={paymentDues}
                refreshPaymentDues={refreshPaymentDues}
              />
            }
          />
          {user?.role === "ADMIN" ? (
            <>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
            </>
          ) : null}
        </Routes>
      </main>
    </div>
  );
}