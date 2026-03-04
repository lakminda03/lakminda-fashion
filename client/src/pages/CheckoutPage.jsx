import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../context/CartContext";
import { getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const session = getAuthSession();

  const [address, setAddress] = useState({
    fullName: session.name || "",
    phone: "",
    email: session.email || "",
    addressLine: "",
    city: "",
    postalCode: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const deliveryFee = cart.items?.length ? 1 : 0;
  const subtotal = Number(cart.subtotal || 0);
  const total = subtotal + deliveryFee;

  const handlePay = async (event) => {
    event.preventDefault();
    setError("");

    if (!stripe || !elements) {
      setError("Stripe is not ready.");
      return;
    }
    if (!cart.items?.length) {
      setError("Cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const intentResponse = await fetch(`${API_BASE_URL}/api/orders/checkout-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ shippingAddress: address })
      });
      const intentData = await intentResponse.json();
      if (!intentResponse.ok) throw new Error(intentData.message || "Failed to initialize checkout");

      const card = elements.getElement(CardElement);
      const confirm = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: address.fullName,
            email: address.email
          }
        }
      });
      if (confirm.error) throw new Error(confirm.error.message || "Payment failed");
      if (confirm.paymentIntent?.status !== "succeeded") {
        throw new Error("Payment not completed");
      }

      const placeResponse = await fetch(`${API_BASE_URL}/api/orders/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          paymentIntentId: confirm.paymentIntent.id,
          shippingAddress: address
        })
      });
      const placeData = await placeResponse.json();
      if (!placeResponse.ok) throw new Error(placeData.message || "Failed to place order");

      await fetchCart();
      navigate(`/order-success/${placeData.order._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="checkout-form">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <input
          placeholder="Full name"
          value={address.fullName}
          onChange={(e) => setAddress((prev) => ({ ...prev, fullName: e.target.value }))}
          required
        />
        <input
          placeholder="Phone"
          value={address.phone}
          onChange={(e) => setAddress((prev) => ({ ...prev, phone: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={address.email}
          onChange={(e) => setAddress((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          placeholder="Address line"
          value={address.addressLine}
          onChange={(e) => setAddress((prev) => ({ ...prev, addressLine: e.target.value }))}
          required
        />
        <input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
          required
        />
        <input
          placeholder="Postal code"
          value={address.postalCode}
          onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
          required
        />
        <input
          placeholder="Country"
          value={address.country}
          onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
          required
        />
      </div>

      <div className="card-box">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      <div className="checkout-summary">
        <p>
          <span>Subtotal</span>
          <strong>${subtotal.toFixed(2)}</strong>
        </p>
        <p>
          <span>Delivery</span>
          <strong>${deliveryFee.toFixed(2)}</strong>
        </p>
        <p>
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </p>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <button type="submit" disabled={loading || !cart.items?.length}>
        {loading ? "Processing..." : "Pay & Place Order"}
      </button>
      <Link to="/cart" className="back-link">
        Back to Cart
      </Link>
    </form>
  );
}

export default function CheckoutPage() {
  const session = getAuthSession();

  if (session.role !== "user" || !session.token) {
    return <Navigate to="/login" replace />;
  }

  if (!stripePromise) {
    return (
      <main className="section">
        <div className="container">
          <p className="admin-error">Stripe publishable key missing. Set `VITE_STRIPE_PUBLISHABLE_KEY`.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container">
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </main>
  );
}
