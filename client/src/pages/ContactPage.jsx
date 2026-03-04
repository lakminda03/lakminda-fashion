import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: ""
};

export default function ContactPage() {
  const [formData, setFormData] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSent(false);
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send message");
      setSent(true);
      setFormData(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section contact-page">
      <div className="container">
        <section className="contact-hero">
          <p className="eyebrow">Lakminda Fashion Support</p>
          <h1>Contact Us</h1>
          <p>For orders, custom designs, delivery updates, and support, send us a message and our team will reply.</p>
        </section>

        <section className="contact-layout">
          <form className="contact-form" onSubmit={handleSubmit}>
            <h2>Send a Message</h2>
            <div className="contact-grid">
              <input name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} />
              <input name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
            </div>
            <textarea
              name="message"
              rows={6}
              placeholder="Write your message"
              value={formData.message}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </button>
            {sent ? <p className="admin-success">Message sent. We will contact you soon.</p> : null}
            {error ? <p className="admin-error">{error}</p> : null}
          </form>

          <aside className="contact-info">
            <h3>Contact Details</h3>
            <p>
              <strong>Email:</strong> support@lakmindafashion.com
            </p>
            <p>
              <strong>Phone:</strong> +94 77 123 4567
            </p>
            <p>
              <strong>Address:</strong> Colombo, Sri Lanka
            </p>
            <p>
              <strong>Business Hours:</strong> Mon - Sat, 9:00 AM - 6:00 PM
            </p>
            <div className="contact-note">
              For urgent order issues, include your order number in the subject line.
            </div>
            <div className="contact-map">
              <p>
                <strong>Shop Location</strong>
              </p>
              <iframe
                title="Lakminda Fashion Shop Location"
                src="https://www.google.com/maps?q=Colombo%2C%20Sri%20Lanka&z=13&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
