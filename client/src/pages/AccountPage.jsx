import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { clearAuthSession, getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AccountPage() {
  const session = getAuthSession();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      if (!session.token) return;
      try {
        const [meResponse, ordersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${session.token}` }
          }),
          fetch(`${API_BASE_URL}/api/orders/my`, {
            headers: { Authorization: `Bearer ${session.token}` }
          })
        ]);

        const data = await meResponse.json();
        if (!meResponse.ok) throw new Error(data.message || "Failed to fetch user");
        setUser(data.user);

        const ordersData = await ordersResponse.json();
        if (ordersResponse.ok && Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else if (!ordersResponse.ok) {
          throw new Error(ordersData.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchMe();
  }, [session.token]);

  if (session.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <h1>My Account</h1>
        <p>
          <strong>Name:</strong> {user?.name || session.name}
        </p>
        <p>
          <strong>Email:</strong> {user?.email || session.email || "-"}
        </p>
        {error ? <p className="admin-error">{error}</p> : null}
        <div className="auth-actions">
          <button type="button" onClick={clearAuthSession}>
            Logout
          </button>
          <Link to="/">Back to Home</Link>
        </div>

        <div className="account-orders">
          <h2>My Orders</h2>
          {!orders.length ? (
            <p className="muted">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <article className="account-order-card" key={order._id}>
                <p>
                  <strong>Order:</strong> {order._id}
                </p>
                <p>
                  <strong>Total:</strong> ${Number(order.total || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Payment:</strong> {order.paymentStatus}
                </p>
                <p>
                  <strong>Status:</strong> {order.orderStatus}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
