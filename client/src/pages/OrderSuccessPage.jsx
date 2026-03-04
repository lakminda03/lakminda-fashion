import { Link, useParams } from "react-router-dom";

export default function OrderSuccessPage() {
  const { id } = useParams();

  return (
    <main className="section">
      <div className="container auth-card">
        <h1>Order Confirmed</h1>
        <p>Your order has been placed successfully.</p>
        <p className="muted">Order ID: {id}</p>
        <div className="auth-actions">
          <Link to="/account">View My Account</Link>
          <Link to="/">Continue Shopping</Link>
        </div>
      </div>
    </main>
  );
}
