import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async (explicitToken) => {
    const tokenToUse = explicitToken || token;
    if (!tokenToUse) {
      setError("Verification token is required.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToUse })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed");
      setMessage(data.message || "Email verified successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email to resend verification.");
      return;
    }
    setResendLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Resend failed");
      setMessage(data.message || "Verification email sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const tokenFromQuery = searchParams.get("token");
    if (tokenFromQuery) {
      handleVerify(tokenFromQuery);
    }
  }, []);

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <h1>Verify Email</h1>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleVerify();
          }}
        >
          <input
            type="text"
            placeholder="Verification token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="auth-form" style={{ marginTop: 12 }}>
          <input
            type="email"
            placeholder="Email for resend"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="button" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </button>
        </div>

        {message ? <p className="admin-success">{message}</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
        <p className="muted" style={{ marginTop: 10 }}>
          After verification, <Link to="/login">login here</Link>.
        </p>
      </section>
    </main>
  );
}
