import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export default function CartPage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const { cart, updateCartItem, removeCartItem, clearCart } = useCart();
  const [error, setError] = useState("");

  if (session.role !== "user" || !session.token) {
    return <Navigate to="/login" replace />;
  }

  const deliveryFee = cart.items?.length ? 1 : 0;
  const total = Number(cart.subtotal || 0) + deliveryFee;

  return (
    <main className="section">
      <div className="container cart-page">
        <div>
          <h1>My Cart</h1>
          {error ? <p className="admin-error">{error}</p> : null}
          {!cart.items?.length ? (
            <p className="muted">Your cart is empty.</p>
          ) : (
            <div className="cart-list">
              {cart.items.map((item) => (
                <article className="cart-item" key={item._id}>
                  <img src={resolveImageUrl(item.image)} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p className="muted">
                      {item.color || "-"} | {item.size || "-"}
                    </p>
                    <p>${Number(item.unitPrice).toFixed(2)}</p>
                  </div>
                  <div className="cart-item-actions">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={async (e) => {
                        const qty = Number(e.target.value);
                        if (!qty || qty < 1) return;
                        try {
                          await updateCartItem(item._id, qty);
                          setError("");
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={async () => {
                        try {
                          await removeCartItem(item._id);
                          setError("");
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <p>
            <span>Subtotal</span>
            <strong>${Number(cart.subtotal || 0).toFixed(2)}</strong>
          </p>
          <p>
            <span>Delivery</span>
            <strong>${deliveryFee.toFixed(2)}</strong>
          </p>
          <p className="total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </p>
          <button type="button" onClick={() => navigate("/checkout")} disabled={!cart.items?.length}>
            Checkout
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={async () => {
              try {
                await clearCart();
              } catch (err) {
                setError(err.message);
              }
            }}
            disabled={!cart.items?.length}
          >
            Clear Cart
          </button>
          <Link to="/" className="back-link">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}
