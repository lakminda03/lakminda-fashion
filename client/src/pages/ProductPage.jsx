import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const session = getAuthSession();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectionError, setSelectionError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Product not found");
        const data = await response.json();
        setProduct(data);
        setSelectedColor(Array.isArray(data.colors) && data.colors.length ? data.colors[0] : "");
        setSelectedSize(Array.isArray(data.sizes) && data.sizes.length ? data.sizes[0] : "");
        setSelectedQuantity(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <p>Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="section">
        <div className="container">
          <p className="admin-error">{error || "Product not found"}</p>
          <Link to="/" className="back-link">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (session.role !== "user" || !session.token) {
      navigate("/login");
      return;
    }

    if (Array.isArray(product.colors) && product.colors.length && !selectedColor) {
      setSelectionError("Please select a color.");
      return;
    }
    if (Array.isArray(product.sizes) && product.sizes.length && !selectedSize) {
      setSelectionError("Please select a size.");
      return;
    }
    if (selectedQuantity < 1) {
      setSelectionError("Quantity must be at least 1.");
      return;
    }
    if (selectedQuantity > Number(product.stockCount || 0)) {
      setSelectionError(`Only ${product.stockCount || 0} item(s) in stock.`);
      return;
    }
    setSelectionError("");
    addToCart({
      productId: product._id,
      quantity: selectedQuantity,
      size: selectedSize || "",
      color: selectedColor || ""
    })
      .then(() => {
        window.alert("Added to cart.");
      })
      .catch((err) => setSelectionError(err.message));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (session.role !== "user" || !session.token) {
      navigate("/login");
      return;
    }

    setReviewSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${product._id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit review");
      setProduct(data.product);
      setReviewSuccess(data.message || "Review submitted.");
      setReviewForm((prev) => ({ ...prev, comment: "" }));
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const displayPrice = Number(
    selectedSize && product?.sizePrices?.[selectedSize] !== undefined
      ? product.sizePrices[selectedSize]
      : product.price || 0
  );

  return (
    <main className="section">
      <div className="container product-page">
        <div className="product-page-image">
          <img src={resolveImageUrl(product.image)} alt={product.name} />
        </div>
        <div className="product-page-info">
          <p className="eyebrow">Lakminda Fashion</p>
          <h1>{product.name}</h1>
          <p className="muted">Sub Category: {product.subCategory || product.category || "-"}</p>
          <p className="product-review-summary">
            Rating: {Number(product.rating || 0).toFixed(1)} / 5 ({Number(product.numReviews || 0)} reviews)
          </p>
          <p className="product-page-price">${displayPrice.toFixed(2)}</p>
          <p className="muted">Stock: {product.stockCount ?? 0}</p>
          <div className="product-options">
            <p className="muted">Color</p>
            <div className="option-row">
              {(product.colors || []).length ? (
                product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={selectedColor === color ? "option-btn active" : "option-btn"}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectionError("");
                    }}
                  >
                    {color}
                  </button>
                ))
              ) : (
                <span className="muted">-</span>
              )}
            </div>
          </div>
          <div className="product-options">
            <p className="muted">Size</p>
            <div className="option-row">
              {(product.sizes || []).length ? (
                product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={selectedSize === size ? "option-btn active" : "option-btn"}
                    onClick={() => {
                      setSelectedSize(size);
                      setSelectionError("");
                    }}
                  >
                    {size}
                  </button>
                ))
              ) : (
                <span className="muted">-</span>
              )}
            </div>
          </div>
          <div className="product-options">
            <p className="muted">Quantity</p>
            <div className="option-row">
              <input
                className="quantity-input"
                type="number"
                min="1"
                max={Math.max(1, Number(product.stockCount || 0))}
                value={selectedQuantity}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (Number.isNaN(raw)) return;
                  const clamped = Math.min(Math.max(raw, 1), Math.max(1, Number(product.stockCount || 0)));
                  setSelectedQuantity(clamped);
                  setSelectionError("");
                }}
                disabled={Number(product.stockCount || 0) < 1}
              />
            </div>
          </div>
          <p className="muted">Categories: {(product.categories || product.tags || []).join(", ") || "-"}</p>
          {selectionError ? <p className="admin-error">{selectionError}</p> : null}
          <div className="product-page-actions">
            <button type="button" onClick={handleAddToCart} disabled={Number(product.stockCount || 0) < 1}>
              {Number(product.stockCount || 0) < 1 ? "Out of Stock" : "Add to Cart"}
            </button>
            <Link to="/" className="back-link">
              Continue Shopping
            </Link>
          </div>

          <section className="product-reviews">
            <h2>Customer Reviews</h2>

            <form className="review-form" onSubmit={handleSubmitReview}>
              <div className="review-form-row">
                <label htmlFor="rating-select">Rating</label>
                <select
                  id="rating-select"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Poor</option>
                </select>
              </div>
              <textarea
                placeholder="Write your review"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={4}
              />
              <button type="submit" disabled={reviewSubmitting}>
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>

            {reviewSuccess ? <p className="admin-success">{reviewSuccess}</p> : null}
            {reviewError ? <p className="admin-error">{reviewError}</p> : null}
            {session.role !== "user" ? (
              <p className="muted">
                Please <Link to="/login">sign in</Link> to write a review.
              </p>
            ) : null}

            <div className="review-list">
              {(product.reviews || []).length ? (
                [...product.reviews]
                  .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                  .map((review) => (
                    <article className="review-card" key={review._id || `${review.user}-${review.createdAt}`}>
                      <div className="review-top">
                        <strong>{review.name || "User"}</strong>
                        <span>{Number(review.rating || 0).toFixed(1)} / 5</span>
                      </div>
                      <p>{review.comment || "No comment."}</p>
                      <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</small>
                    </article>
                  ))
              ) : (
                <p className="muted">No reviews yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
