import { useEffect, useState } from "react";
import CategoryPageContent from "../components/CategoryPageContent";

const unisexHero =
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UnisexPage() {
  const [unisexProducts, setUnisexProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        const filtered = (Array.isArray(data) ? data : []).filter((product) => {
          const productCategories = product.categories || product.tags || [];
          return productCategories.map((item) => String(item).toLowerCase()).includes("unisex");
        });
        setUnisexProducts(filtered);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      <CategoryPageContent
        title="Unisex"
        subtitle="Versatile pieces designed to fit every wardrobe with confidence and ease."
        image={unisexHero}
        products={unisexProducts}
      />
    </main>
  );
}
