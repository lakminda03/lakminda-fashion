import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

function CategoryCard({ item }) {
  const safePrice = Number(item?.price || 0);
  const productUrl = `/product/${item?._id}`;

  return (
    <article className="category-card">
      <Link to={productUrl}>
        <img src={resolveImageUrl(item?.image)} alt={item?.name || "Product"} />
      </Link>
      <div className="category-meta">
        <p>{item?.subCategory || item?.category || "Uncategorized"}</p>
        <h3>
          <Link to={productUrl}>{item?.name || "Untitled Product"}</Link>
        </h3>
        <strong>${safePrice.toFixed(2)}</strong>
      </div>
    </article>
  );
}

export default function CategoryPageContent({ title, subtitle, image, products }) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("");

  const filterOptions = useMemo(() => {
    const subCategories = Array.from(
      new Set(safeProducts.map((item) => item?.subCategory || item?.category).filter(Boolean))
    );
    const sizes = Array.from(
      new Set(
        safeProducts
          .flatMap((item) => (Array.isArray(item?.sizes) ? item.sizes : []))
          .map((item) => String(item).trim())
          .filter(Boolean)
      )
    );
    const colors = Array.from(
      new Set(
        safeProducts
          .flatMap((item) => (Array.isArray(item?.colors) ? item.colors : []))
          .map((item) => String(item).trim())
          .filter(Boolean)
      )
    );
    return { subCategories, sizes, colors };
  }, [safeProducts]);

  const displayedProducts = useMemo(() => {
    let result = [...safeProducts];

    if (subCategoryFilter !== "all") {
      result = result.filter((item) => (item?.subCategory || item?.category) === subCategoryFilter);
    }
    if (sizeFilter !== "all") {
      result = result.filter((item) => (item?.sizes || []).includes(sizeFilter));
    }
    if (colorFilter !== "all") {
      result = result.filter((item) => (item?.colors || []).includes(colorFilter));
    }
    if (maxPrice !== "") {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        result = result.filter((item) => Number(item?.price || 0) <= max);
      }
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    } else if (sortBy === "name-az") {
      result.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
    } else {
      result.sort((a, b) => String(b?._id || "").localeCompare(String(a?._id || "")));
    }

    return result;
  }, [safeProducts, subCategoryFilter, sizeFilter, colorFilter, maxPrice, sortBy]);

  return (
    <section className="category-page">
      <div className="category-hero" style={{ backgroundImage: `url(${image})` }}>
        <div className="category-hero-overlay" />
        <div className="container category-hero-content">
          <p className="eyebrow category-eyebrow">Lakminda Fashion</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="section-heading">
            <h2>{title} Picks</h2>
          </div>
          <div className="filter-toolbar">
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)}>
              <option value="all">All Sub Categories</option>
              {filterOptions.subCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
              <option value="all">All Sizes</option>
              {filterOptions.sizes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
              <option value="all">All Colors</option>
              {filterOptions.colors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A-Z</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSubCategoryFilter("all");
                setSizeFilter("all");
                setColorFilter("all");
                setMaxPrice("");
                setSortBy("newest");
              }}
            >
              Reset
            </button>
          </div>
          <div className="category-grid">
            {displayedProducts.map((item) => (
              <CategoryCard key={item._id || item.name} item={item} />
            ))}
          </div>
          {displayedProducts.length === 0 ? (
            <p className="muted">No products match your current filters.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
