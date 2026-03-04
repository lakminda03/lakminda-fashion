import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
        }
        throw new Error(data.message || "Login failed");
      }

      setAuthSession({
        role: "user",
        name: data.user.name,
        email: data.user.email,
        token: data.token,
        userId: data.user.id,
        persistent: true
      });
      navigate("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <h1>User Login</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <label className="auth-check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {error ? <p className="admin-error">{error}</p> : null}
        {needsVerification ? (
          <p className="muted">
            Verify your email first:{" "}
            <Link to={`/verify-email?email=${encodeURIComponent(formData.email)}`}>Open verification page</Link>
          </p>
        ) : null}
        <p className="muted">
          Forgot password? <Link to="/forgot-password">Reset it</Link>
        </p>
        <p className="muted">
          New user? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
}
