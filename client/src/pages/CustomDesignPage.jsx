import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  category: "T-Shirts",
  quantity: "",
  designIdea: "",
  deadline: ""
};

export default function CustomDesignPage() {
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/custom-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit request");

      setMessage("Thanks. Your custom design request has been received. We will contact you soon.");
      setFormData(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section custom-design-page">
      <div className="container">
        <section className="custom-design-hero">
          <p className="eyebrow">Lakminda Fashion Studio</p>
          <h1>Custom Designs for Your Brand, Event, or Team</h1>
          <p>
            Tell us your idea, preferred category, quantity, and timeline. Our team will reply with concept details,
            pricing, and production plan.
          </p>
        </section>

        <section className="custom-design-layout">
          <form className="custom-design-form" onSubmit={handleSubmit}>
            <h2>Request Custom Design</h2>
            <div className="custom-design-grid">
              <input name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} required />
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Pants">Pants</option>
                <option value="Tracksuits">Tracksuits</option>
                <option value="Kids Wear">Kids Wear</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="number"
                min="1"
                name="quantity"
                placeholder="Required quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
            </div>
            <textarea
              name="designIdea"
              rows={5}
              placeholder="Describe your design idea, colors, logos, and size breakdown"
              value={formData.designIdea}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Request"}
            </button>
            {message ? <p className="admin-success">{message}</p> : null}
            {error ? <p className="admin-error">{error}</p> : null}
          </form>

          <aside className="custom-design-info">
            <h3>How It Works</h3>
            <ol>
              <li>Submit your concept and quantity requirement.</li>
              <li>Our team shares draft direction and quotation.</li>
              <li>Approve sample details and confirm production.</li>
              <li>We deliver according to your timeline.</li>
            </ol>
            <div className="custom-design-note">
              <p>
                Need urgent production? Mention your deadline in the form and our team will prioritize availability.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
