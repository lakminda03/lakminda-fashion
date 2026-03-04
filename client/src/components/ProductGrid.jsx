import { useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

function ProductCard({ product }) {
  const productUrl = `/product/${product._id}`;

  return (
    <article className="product-card">
      <Link to={productUrl}>
        <img src={resolveImageUrl(product.image)} alt={product.name} />
      </Link>
      <div className="product-meta">
        <div className="product-top">
          <p>{product.subCategory || product.category || "Uncategorized"}</p>
          {product.badges?.[0] ? <span>{product.badges[0]}</span> : null}
        </div>
        <h3>
          <Link to={productUrl}>{product.name}</Link>
        </h3>
        <div className="product-bottom">
          <strong>${product.price.toFixed(2)}</strong>
          <Link to={productUrl} className="mini-link-btn">
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ProductGrid({ products, loading }) {
  const rowRef = useRef(null);

  const scrollRow = (direction) => {
    if (!rowRef.current) return;
    const amount = 480;
    rowRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  };

  return (
    <section className="section section-dark" id="featured-products">
      <div className="container">
        <div className="section-heading row featured-head">
          <h2>Featured Products</h2>
          <div className="subcat-arrows">
            <button type="button" onClick={() => scrollRow("left")} aria-label="Scroll featured products left">
              &lt;
            </button>
            <button type="button" onClick={() => scrollRow("right")} aria-label="Scroll featured products right">
              &gt;
            </button>
          </div>
        </div>
        {loading ? <p className="loading">Loading products...</p> : null}
        <div className="products products-row" ref={rowRef}>
          {products.map((product) => (
            <ProductCard key={product._id || product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
