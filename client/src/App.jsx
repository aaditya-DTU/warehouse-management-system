import { HashRouter } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import "./App.css";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import api, {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from "./api/axios";

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [authError, setAuthError] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(Boolean(getStoredAuth()));
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [appError, setAppError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [paymentDues, setPaymentDues] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const loadCustomers = async () => {
    const response = await api.get("/customers");
    setCustomers(
      (response.data.customers || []).map((customer) => ({
        ...customer,
        id: customer._id,
        name: customer.customerName,
        phone: customer.mobileNumber,
        location: customer.address,
      })),
    );
  };

  const loadProducts = async () => {
    const response = await api.get("/products");
    setProducts(
      (response.data.products || []).map((product) => ({
        ...product,
        id: product._id,
        name: product.productName,
      })),
    );
  };

  const loadOrders = async () => {
    const response = await api.get("/orders");
    setOrders(response.data.orders || []);
  };

  const loadDeliveries = async () => {
    const response = await api.get("/deliveries");
    setDeliveries(response.data.deliveries || []);
  };

  const loadPaymentDues = async () => {
    const response = await api.get("/payments");
    setPaymentDues(response.data.paymentDues || []);
  };

  const loadStockItems = async () => {
    const response = await api.get("/stock");
    setStockItems(response.data.stockList || []);
  };

  useEffect(() => {
    const verifySession = async () => {
      const storedAuth = getStoredAuth();

      if (!storedAuth?.token) {
        setIsAuthChecking(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const nextAuth = {
          token: storedAuth.token,
          user: response.data.user,
        };

        setAuth(nextAuth);
        setStoredAuth(nextAuth);
      } catch {
        if (window.location.hash !== "#/") {
          window.location.hash = "#/";
        }
        clearStoredAuth();
        setAuth(null);
        setAuthError("Your session expired. Please login again.");
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (!auth?.token) {
      if (window.location.hash !== "#/") {
        window.location.hash = "#/";
      }
      return;
    }

    // Wraps each individual data load so that one endpoint returning a 403
    // (e.g. a role that isn't permitted on that particular resource) doesn't
    // wipe out every other successfully-loaded section of the app. Failures
    // are logged for debugging but do not block the rest of the UI.
    const tryLoad = async (loader, label) => {
      try {
        await loader();
      } catch (error) {
        console.error(`Unable to load ${label}:`, error.response?.data?.message || error.message);
      }
    };

    const loadAppData = async () => {
      setIsAppLoading(true);
      setAppError("");

      await Promise.all([
        tryLoad(loadCustomers, "customers"),
        tryLoad(loadProducts, "products"),
        tryLoad(loadOrders, "orders"),
        tryLoad(loadDeliveries, "deliveries"),
        tryLoad(loadPaymentDues, "payment dues"),
        tryLoad(loadStockItems, "stock items"),
      ]);

      setIsAppLoading(false);
    };

    loadAppData();
  }, [auth?.token]);

  const handleLogin = async (credentials) => {
    setIsLoggingIn(true);
    setAuthError("");

    try {
      const response = await api.post("/auth/login", credentials);
      const nextAuth = {
        token: response.data.token,
        user: response.data.user,
      };

      setAuth(nextAuth);
      setStoredAuth(nextAuth);
    } catch (error) {
      setAuthError(
        error.response?.data?.message || "Unable to login. Please try again.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (window.location.hash !== "#/") {
      window.location.hash = "#/";
    }
    clearStoredAuth();
    setAuth(null);
    setCustomers([]);
    setProducts([]);
    setOrders([]);
    setDeliveries([]);
    setPaymentDues([]);
    setStockItems([]);
    setAppError("");
  };

  if (isAuthChecking) {
    return (
      <div className="screen-state">
        <div className="state-card">
          <p className="section-kicker">Checking session</p>
          <h1>Connecting to your workspace</h1>
          <p>Loading your admin access and preparing the dashboard.</p>
        </div>
      </div>
    );
  }

  if (!auth?.token) {
    return (
      <Login onLogin={handleLogin} isSubmitting={isLoggingIn} error={authError} />
    );
  }

  return (
    <HashRouter>
      <MainLayout
        user={auth.user}
        onLogout={handleLogout}
        isAppLoading={isAppLoading}
        appError={appError}
        customers={customers}
        setCustomers={setCustomers}
        refreshCustomers={loadCustomers}
        products={products}
        setProducts={setProducts}
        refreshProducts={loadProducts}
        orders={orders}
        setOrders={setOrders}
        refreshOrders={loadOrders}
        deliveries={deliveries}
        setDeliveries={setDeliveries}
        refreshDeliveries={loadDeliveries}
        paymentDues={paymentDues}
        setPaymentDues={setPaymentDues}
        refreshPaymentDues={loadPaymentDues}
        stockItems={stockItems}
        refreshStockItems={loadStockItems}
      />
    </HashRouter>
  );
}

export default App;