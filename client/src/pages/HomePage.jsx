import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import CollectionGrid from "../components/CollectionGrid";
import ProductGrid from "../components/ProductGrid";
import PromoBanner from "../components/PromoBanner";
import { fallbackProducts } from "../data/fallbackProducts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const resolveImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

function SubCategoryRow({ subCategory, products }) {
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
    <div className="subcat-section">
      <div className="subcat-head">
        <h3>{subCategory}</h3>
        <div className="subcat-arrows">
          <button type="button" onClick={() => scrollRow("left")} aria-label={`Scroll ${subCategory} left`}>
            &lt;
          </button>
          <button type="button" onClick={() => scrollRow("right")} aria-label={`Scroll ${subCategory} right`}>
            &gt;
          </button>
        </div>
      </div>

      <div className="subcat-row" ref={rowRef}>
        {products.map((product) => (
          <article className="subcat-card" key={product._id || product.name}>
            <Link to={`/product/${product._id}`}>
              <img src={resolveImageUrl(product.image)} alt={product.name} />
            </Link>
            <div>
              <p>
                <Link to={`/product/${product._id}`}>{product.name}</Link>
              </p>
              <strong>${Number(product.price).toFixed(2)}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState(fallbackProducts);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const [featuredRes, allRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/featured`),
          fetch(`${API_BASE_URL}/api/products`)
        ]);

        if (!featuredRes.ok || !allRes.ok) {
          throw new Error("Failed to fetch products");
        }

        const featuredData = await featuredRes.json();
        const allData = await allRes.json();

        if (Array.isArray(featuredData) && featuredData.length > 0) {
          setFeaturedProducts(featuredData);
        }
        setAllProducts(Array.isArray(allData) ? allData : []);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  const groupedBySubCategory = allProducts.reduce((acc, product) => {
    const key = product.subCategory || product.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});

  return (
    <main>
      <Hero />
      <CollectionGrid />
      <ProductGrid products={featuredProducts} loading={loading} />
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <h2>Shop by Sub Categories</h2>
          </div>

          {Object.entries(groupedBySubCategory).map(([subCategory, products]) => (
            <SubCategoryRow key={subCategory} subCategory={subCategory} products={products} />
          ))}
        </div>
      </section>
      <PromoBanner />
    </main>
  );
}
